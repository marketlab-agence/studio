import {
  getAuthProvider,
  InvalidCredentialsError,
  InvalidMfaCodeError,
  isMfaChallenge,
  MfaNotConfiguredError,
  resetProviders,
  type AuthProvider,
  type OrgScope,
  type Session,
} from '@/lib/providers';
import { totp } from '@/lib/auth/totp';
import { looksEncrypted } from '@/lib/auth/crypto';
import { signMfaChallenge } from '@/lib/auth/jwt';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Double authentification (T4.4, REQ-AUTH-04).
 *
 * Points verrouillés :
 * - le secret TOTP est stocké **chiffré** — jamais en clair ;
 * - `beginMfaSetup` n'active **rien** : sans confirmation, un utilisateur dont
 *   l'application n'aurait pas enregistré le secret serait enfermé dehors ;
 * - une connexion à deux facteurs ne retourne **pas** de session avant le code ;
 * - la désactivation exige le mot de passe, sinon un jeton d'accès volé
 *   suffirait à retirer le second facteur.
 */

jest.setTimeout(90_000);

const TEST_DOMAIN = '@mfa-test.local';
const PASSWORD = 'un-mot-de-passe-solide-2026';

let provider: AuthProvider;
let scope: OrgScope;
let session: Session;

function email(local: string): string {
  return `${local}${TEST_DOMAIN}`;
}

async function cleanup(): Promise<void> {
  await pool.query(
    `DELETE FROM organizations
     WHERE id IN (SELECT organization_id FROM users WHERE email LIKE $1)`,
    [`%${TEST_DOMAIN}`],
  );
}

/** Active la double authentification et retourne le secret, pour les tests suivants. */
async function enableMfa(): Promise<string> {
  const setup = await provider.beginMfaSetup(scope, session.user.id);
  await provider.confirmMfaSetup(scope, session.user.id, totp(setup.secret));
  return setup.secret;
}

describe('double authentification (TOTP)', () => {
  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    await cleanup();
    provider = getAuthProvider();

    session = await provider.register({
      email: email('formateur'),
      password: PASSWORD,
      name: 'Formateur MFA',
    });
    scope = {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      role: 'Propriétaire',
    };
  });

  afterAll(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  describe('état initial', () => {
    it('n’est ni configurée ni active au départ', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      expect(await provider.mfaStatus(scope, session.user.id)).toEqual({
        configured: false,
        enabled: false,
      });
    });

    it('laisse la connexion simple aboutir sans second facteur', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const result = await provider.login({ email: email('formateur'), password: PASSWORD });

      expect(isMfaChallenge(result)).toBe(false);
    }, 60_000);
  });

  describe('activation', () => {
    it('génère un secret et une URI otpauth', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const setup = await provider.beginMfaSetup(scope, session.user.id);

      expect(setup.secret).toMatch(/^[A-Z2-7]{32}$/);
      expect(setup.uri.startsWith('otpauth://totp/')).toBe(true);
      expect(setup.uri).toContain(setup.secret);
    });

    it('stocke le secret CHIFFRÉ, jamais en clair', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const setup = await provider.beginMfaSetup(scope, session.user.id);

      const { rows } = await pool.query<{ two_factor_secret: string }>(
        'SELECT two_factor_secret FROM users WHERE id = $1',
        [session.user.id],
      );

      // Le secret ne doit apparaître nulle part en clair dans la base : une
      // fuite de celle-ci ne doit pas permettre de générer des codes valides.
      expect(rows[0].two_factor_secret).not.toBe(setup.secret);
      expect(rows[0].two_factor_secret).not.toContain(setup.secret);
      expect(looksEncrypted(rows[0].two_factor_secret)).toBe(true);
    });

    it('n’active RIEN avant confirmation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.beginMfaSetup(scope, session.user.id);

      // Un secret existe, mais la double authentification n'est pas active : sans
      // cette distinction, un utilisateur dont le téléphone n'a pas enregistré le
      // secret se retrouverait enfermé hors de son compte.
      expect(await provider.mfaStatus(scope, session.user.id)).toEqual({
        configured: true,
        enabled: false,
      });
    });

    it('active après un premier code valide', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const setup = await provider.beginMfaSetup(scope, session.user.id);
      await provider.confirmMfaSetup(scope, session.user.id, totp(setup.secret));

      expect(await provider.mfaStatus(scope, session.user.id)).toEqual({
        configured: true,
        enabled: true,
      });
    });

    it('refuse un code invalide et n’active rien', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.beginMfaSetup(scope, session.user.id);

      await expect(
        provider.confirmMfaSetup(scope, session.user.id, '000000'),
      ).rejects.toBeInstanceOf(InvalidMfaCodeError);

      expect((await provider.mfaStatus(scope, session.user.id)).enabled).toBe(false);
    });

    it('refuse une confirmation sans secret préalable', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await expect(
        provider.confirmMfaSetup(scope, session.user.id, '123456'),
      ).rejects.toBeInstanceOf(MfaNotConfiguredError);
    });

    it('refuse d’agir sur un utilisateur d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const autre = await provider.register({
        email: email('autre'),
        password: PASSWORD,
        name: 'Autre',
      });

      await expect(
        provider.beginMfaSetup(scope, autre.user.id),
      ).rejects.toThrow(/introuvable dans cette organisation/);
    }, 60_000);
  });

  describe('connexion à deux facteurs', () => {
    it('retourne un défi, PAS une session, tant que le code n’est pas fourni', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      await enableMfa();

      const result = await provider.login({ email: email('formateur'), password: PASSWORD });

      expect(isMfaChallenge(result)).toBe(true);
      if (!isMfaChallenge(result)) return;

      expect(result.challengeToken).toBeTruthy();
      expect(result.expiresInSeconds).toBeGreaterThan(0);
      // Le mot de passe seul ne doit jamais suffire.
      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('refreshToken');
    }, 60_000);

    it('ouvre une session avec un code valide', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      const secret = await enableMfa();

      const challenge = await provider.login({ email: email('formateur'), password: PASSWORD });
      if (!isMfaChallenge(challenge)) throw new Error('Défi attendu.');

      const completed = await provider.completeMfaChallenge(
        challenge.challengeToken,
        totp(secret),
      );

      expect(completed.user.id).toBe(session.user.id);
      expect(completed.accessToken).toBeTruthy();
      expect(completed.refreshToken).toBeTruthy();
    }, 60_000);

    it('refuse un code invalide', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      await enableMfa();

      const challenge = await provider.login({ email: email('formateur'), password: PASSWORD });
      if (!isMfaChallenge(challenge)) throw new Error('Défi attendu.');

      await expect(
        provider.completeMfaChallenge(challenge.challengeToken, '000000'),
      ).rejects.toBeInstanceOf(InvalidMfaCodeError);
    }, 60_000);

    it('refuse un défi falsifié, sans révéler s’il correspond à un compte', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      const secret = await enableMfa();

      await expect(
        provider.completeMfaChallenge('defi-invente', totp(secret)),
      ).rejects.toBeInstanceOf(InvalidMfaCodeError);
    }, 60_000);

    it('refuse un défi signé pour un autre usage', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      const secret = await enableMfa();

      // Un jeton d'accès ne doit pas pouvoir tenir lieu de défi : l'audience
      // diffère, donc la vérification échoue.
      await expect(
        provider.completeMfaChallenge(session.accessToken, totp(secret)),
      ).rejects.toBeInstanceOf(InvalidMfaCodeError);
    }, 60_000);

    it('refuse un défi pointant vers un utilisateur sans second facteur', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const sansMfa = await provider.register({
        email: email('sans-mfa'),
        password: PASSWORD,
        name: 'Sans MFA',
      });

      const defi = await signMfaChallenge(sansMfa.user.id);

      await expect(provider.completeMfaChallenge(defi, '123456')).rejects.toBeInstanceOf(
        MfaNotConfiguredError,
      );
    }, 60_000);
  });

  describe('désactivation', () => {
    it('exige le mot de passe actuel', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      await enableMfa();

      // Sans cette exigence, un jeton d'accès volé suffirait à retirer le second
      // facteur : l'attaquant n'aurait plus qu'à se servir du mot de passe.
      await expect(
        provider.disableMfa(scope, session.user.id, 'mauvais-mot-de-passe-2026'),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);

      expect((await provider.mfaStatus(scope, session.user.id)).enabled).toBe(true);
    }, 60_000);

    it('efface le secret et le drapeau quand le mot de passe est correct', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      await enableMfa();

      await provider.disableMfa(scope, session.user.id, PASSWORD);

      expect(await provider.mfaStatus(scope, session.user.id)).toEqual({
        configured: false,
        enabled: false,
      });

      const { rows } = await pool.query<{ two_factor_secret: string | null }>(
        'SELECT two_factor_secret FROM users WHERE id = $1',
        [session.user.id],
      );
      // Le secret est supprimé, pas seulement désactivé : le conserver
      // permettrait de réactiver la double authentification sans le re-saisir.
      expect(rows[0].two_factor_secret).toBeNull();
    }, 60_000);

    it('rétablit la connexion simple après désactivation', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      await enableMfa();
      await provider.disableMfa(scope, session.user.id, PASSWORD);

      const result = await provider.login({ email: email('formateur'), password: PASSWORD });

      expect(isMfaChallenge(result)).toBe(false);
    }, 60_000);
  });
});
