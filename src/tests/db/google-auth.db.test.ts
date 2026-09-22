import {
  AccountDisabledError,
  getAuthProvider,
  GoogleAccountConflictError,
  resetProviders,
  type AuthProvider,
} from '@/lib/providers';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Connexion Google (T4.3, REQ-AUTH-02, REQ-AUTH-07).
 *
 * Le profil est fourni directement : la vérification de la signature du jeton
 * d'identité Google relève de `src/lib/auth/google.ts` (et exige un appel
 * réseau). Ce qui est vérifié ici, c'est ce que le provider en fait :
 * **liaison, création, conflits et réactivation**.
 *
 * ⚠️ REQ-AUTH-07 : les **2 comptes Google importés** n'ont pas de mot de passe
 * local. Ce parcours est leur seule voie d'accès sans réinitialisation.
 */

jest.setTimeout(60_000);

const TEST_DOMAIN = '@google-test.local';

let provider: AuthProvider;

function email(local: string): string {
  return `${local}${TEST_DOMAIN}`;
}

/** Profil Google plausible, avec un identifiant stable dérivé du nom local. */
function profile(local: string, overrides: Partial<{ email: string; name: string; picture: string }> = {}) {
  return {
    subject: `google-sub-${local}`,
    email: email(local),
    name: 'Formateur Google',
    ...overrides,
  };
}

async function cleanup(): Promise<void> {
  await pool.query(
    `DELETE FROM organizations
     WHERE id IN (SELECT organization_id FROM users WHERE email LIKE $1)`,
    [`%${TEST_DOMAIN}`],
  );
}

describe('connexion Google', () => {
  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    await cleanup();
    provider = getAuthProvider();
  });

  afterAll(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  describe('première connexion', () => {
    it('crée le compte et son organisation, sans mot de passe local', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.loginWithGoogle(profile('nouveau'));

      expect(session.user.email).toBe(email('nouveau'));
      // Inscription libre-service : l'inscrit devient Propriétaire (REQ-ORG-04).
      expect(session.user.role).toBe('Propriétaire');
      expect(session.accessToken).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();

      const { rows } = await pool.query<{ password_hash: string | null; google_id: string | null }>(
        'SELECT password_hash, google_id FROM users WHERE id = $1',
        [session.user.id],
      );

      // Aucun mot de passe local : la connexion passe exclusivement par Google.
      expect(rows[0].password_hash).toBeNull();
      expect(rows[0].google_id).toBe('google-sub-nouveau');
    });

    it('conserve la photo de profil fournie par Google', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.loginWithGoogle(
        profile('photo', { picture: 'https://lh3.googleusercontent.com/photo.jpg' }),
      );

      expect(session.user.avatarUrl).toBe('https://lh3.googleusercontent.com/photo.jpg');
    });

    it('n’ouvre pas de session pour un compte désactivé', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const first = await provider.loginWithGoogle(profile('inactif'));
      await pool.query("UPDATE users SET status = 'Inactif' WHERE id = $1", [first.user.id]);

      await expect(provider.loginWithGoogle(profile('inactif'))).rejects.toBeInstanceOf(
        AccountDisabledError,
      );
    });
  });

  describe('connexions suivantes', () => {
    it('retrouve le compte par son identifiant Google, sans doublon', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const first = await provider.loginWithGoogle(profile('revisite'));
      const second = await provider.loginWithGoogle(profile('revisite'));

      expect(second.user.id).toBe(first.user.id);

      const { rows } = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM users WHERE email = $1',
        [email('revisite')],
      );
      expect(Number(rows[0].count)).toBe(1);
    });

    it('retrouve le compte même si l’adresse a changé côté Google', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const first = await provider.loginWithGoogle(profile('adresse-changee'));

      // C'est précisément pourquoi l'identifiant stable est conservé : une
      // liaison par email seul créerait ici un SECOND compte.
      const second = await provider.loginWithGoogle(
        profile('adresse-changee', { email: email('nouvelle-adresse') }),
      );

      expect(second.user.id).toBe(first.user.id);
      expect(second.user.email).toBe(email('adresse-changee'));
    });

    it('met à jour la date de dernière connexion', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const first = await provider.loginWithGoogle(profile('last-login'));
      await pool.query('UPDATE users SET last_login = NULL WHERE id = $1', [first.user.id]);

      const second = await provider.loginWithGoogle(profile('last-login'));

      const { rows } = await pool.query<{ last_login: Date | null }>(
        'SELECT last_login FROM users WHERE id = $1',
        [second.user.id],
      );
      expect(rows[0].last_login).not.toBeNull();
    });
  });

  describe('rattachement à un compte existant', () => {
    it('rattache un compte email existant, sans en créer un second', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      // Un compte créé par mot de passe, comme un compte repris de Firebase.
      const existing = await provider.register({
        email: email('existant'),
        password: 'un-mot-de-passe-solide-2026',
        name: 'Compte Existant',
      });

      const viaGoogle = await provider.loginWithGoogle(profile('existant'));

      expect(viaGoogle.user.id).toBe(existing.user.id);

      const { rows } = await pool.query<{ google_id: string | null; count: string }>(
        `SELECT google_id, (SELECT COUNT(*)::text FROM users WHERE email = $2) AS count
         FROM users WHERE id = $1`,
        [existing.user.id, email('existant')],
      );
      expect(rows[0].google_id).toBe('google-sub-existant');
      expect(Number(rows[0].count)).toBe(1);
    });

    it('lève l’obligation de réinitialiser le mot de passe (REQ-AUTH-07)', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const existing = await provider.register({
        email: email('reset-obligatoire'),
        password: 'un-mot-de-passe-solide-2026',
        name: 'Compte Importé',
      });
      await pool.query('UPDATE users SET must_reset_password = true WHERE id = $1', [
        existing.user.id,
      ]);

      const viaGoogle = await provider.loginWithGoogle(profile('reset-obligatoire'));

      // Google a vérifié l'adresse : l'obligation de définir un mot de passe
      // local n'a plus de raison d'être, et l'utilisateur ne doit pas être
      // renvoyé vers une réinitialisation à chaque connexion.
      expect(viaGoogle.user.mustResetPassword).toBe(false);
    });

    it('conserve le rôle existant au lieu de promouvoir Propriétaire', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const existing = await provider.register({
        email: email('apprenant'),
        password: 'un-mot-de-passe-solide-2026',
        name: 'Apprenant',
      });
      await pool.query("UPDATE users SET role = 'Utilisateur' WHERE id = $1", [existing.user.id]);

      const viaGoogle = await provider.loginWithGoogle(profile('apprenant'));

      expect(viaGoogle.user.role).toBe('Utilisateur');
    });

    it('refuse un compte Google déjà rattaché à un autre utilisateur', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      // L'utilisateur existant est rattaché au compte Google « sub-original ».
      const existing = await provider.loginWithGoogle({
        subject: 'google-sub-original',
        email: email('partage'),
        name: 'Premier',
      });

      // Un SECOND compte Google présente la même adresse. La recherche par
      // identifiant ne le trouve pas ; celle par email trouve l'utilisateur, dont
      // l'identifiant diffère. Rattacher écraserait le premier rattachement, donc
      // on refuse au lieu de prendre silencieusement la main sur le compte.
      await expect(
        provider.loginWithGoogle({
          subject: 'google-sub-usurpateur',
          email: email('partage'),
          name: 'Usurpateur',
        }),
      ).rejects.toBeInstanceOf(GoogleAccountConflictError);

      // Le rattachement d'origine est intact.
      const { rows } = await pool.query<{ google_id: string | null }>(
        'SELECT google_id FROM users WHERE id = $1',
        [existing.user.id],
      );
      expect(rows[0].google_id).toBe('google-sub-original');
    });

    it('ne réécrit pas une photo déjà présente', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const existing = await provider.register({
        email: email('photo-existante'),
        password: 'un-mot-de-passe-solide-2026',
        name: 'Photo',
      });
      await pool.query('UPDATE users SET avatar_url = $2 WHERE id = $1', [
        existing.user.id,
        'https://exemple.test/photo-originale.jpg',
      ]);

      const viaGoogle = await provider.loginWithGoogle(
        profile('photo-existante', { picture: 'https://lh3.googleusercontent.com/nouvelle.jpg' }),
      );

      // `COALESCE` : une photo déjà choisie par l'utilisateur n'est pas écrasée
      // par celle de Google.
      expect(viaGoogle.user.avatarUrl).toBe('https://exemple.test/photo-originale.jpg');
    });
  });
});
