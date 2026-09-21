import {
  AccountDisabledError,
  getAuthProvider,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
  isMfaChallenge,
  RefreshTokenReuseError,
  resetProviders,
  type AuthProvider,
  type Session,
} from '@/lib/providers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * JwtAuthProvider (T4.2, REQ-AUTH-01/03/06).
 *
 * Les tests portent surtout sur les **chemins de sécurité** : non-énumération
 * des comptes, rotation des refresh tokens, détection de réutilisation, usage
 * unique des liens de réinitialisation.
 *
 * Les hachages bcrypt au coût 12 prennent ~290 ms : le délai global est relevé
 * en conséquence plutôt que de réduire le coût (ce serait tester autre chose que
 * la production).
 */

jest.setTimeout(60_000);

const TEST_DOMAIN = '@auth-test.local';
const PASSWORD = 'un-mot-de-passe-solide-2026';

let provider: AuthProvider;

/**
 * Connexion en attendant une session complète.
 *
 * Les comptes de ces tests n'ont pas de double authentification : `login`
 * retourne donc toujours une session. Ce garde-fou rend l'hypothèse explicite —
 * si un jour elle ne tient plus, le test échoue franchement au lieu de lire
 * `undefined` avec un message obscur.
 */
async function loginSession(input: { email: string; password: string }): Promise<Session> {
  const result = await provider.login(input);
  if (isMfaChallenge(result)) {
    throw new Error('Défi MFA inattendu : ces comptes de test n’ont pas de double authentification.');
  }
  return result;
}

function email(local: string): string {
  return `${local}${TEST_DOMAIN}`;
}

async function cleanup(): Promise<void> {
  // Supprimer les organisations de test emporte leurs utilisateurs, leurs
  // refresh tokens et leurs jetons de réinitialisation (ON DELETE CASCADE).
  await pool.query(
    `DELETE FROM organizations
     WHERE id IN (SELECT organization_id FROM users WHERE email LIKE $1)`,
    [`%${TEST_DOMAIN}`],
  );
}

describe('JwtAuthProvider', () => {
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

  describe('inscription', () => {
    it('crée le compte, son organisation, et ouvre une session', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('nouveau'),
        password: PASSWORD,
        name: 'Nouveau Formateur',
      });

      expect(session.user.email).toBe(email('nouveau'));
      expect(session.user.mustResetPassword).toBe(false);
      // Inscription libre-service : l'inscrit devient Propriétaire (REQ-ORG-04).
      expect(session.user.role).toBe('Propriétaire');
      expect(session.accessToken).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();

      // Le jeton d'accès porte bien l'organisation créée.
      const claims = await verifyAccessToken(session.accessToken);
      expect(claims.organizationId).toBe(session.user.organizationId);
      expect(claims.userId).toBe(session.user.id);

      // L'organisation est bien créée et rattachée à l'inscrit.
      const org = await pool.query<{ owner_id: string }>(
        'SELECT owner_id FROM organizations WHERE id = $1',
        [session.user.organizationId],
      );
      expect(org.rows[0].owner_id).toBe(session.user.id);
    }, 60_000);

    it('ne stocke jamais le mot de passe en clair', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('hash'),
        password: PASSWORD,
        name: 'Test Hash',
      });

      const { rows } = await pool.query<{ password_hash: string | null }>(
        'SELECT password_hash FROM users WHERE id = $1',
        [session.user.id],
      );

      expect(rows[0].password_hash).not.toBe(PASSWORD);
      expect(rows[0].password_hash).toMatch(/^\$2[aby]\$12\$/);
    }, 60_000);

    it('ne stocke jamais le refresh token en clair', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('refresh-hash'),
        password: PASSWORD,
        name: 'Test Refresh',
      });

      const { rows } = await pool.query<{ token: string }>(
        'SELECT token FROM refresh_tokens WHERE user_id = $1',
        [session.user.id],
      );

      // Le jeton en clair ne doit apparaître nulle part en base.
      expect(rows[0].token).not.toBe(session.refreshToken);
      expect(rows[0].token).toMatch(/^[0-9a-f]{64}$/);
    }, 60_000);

    it('normalise l’email et refuse un doublon, quelle que soit la casse', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.register({ email: email('casse'), password: PASSWORD, name: 'Casse' });

      await expect(
        provider.register({ email: email('CASSE'), password: PASSWORD, name: 'Casse Bis' }),
      ).rejects.toThrow(/existe déjà/);
    }, 60_000);

    it('refuse un mot de passe trop court sans rien créer', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await expect(
        provider.register({ email: email('court'), password: 'court', name: 'Court' }),
      ).rejects.toThrow(/trop court/);

      const { rows } = await pool.query('SELECT 1 FROM users WHERE email = $1', [email('court')]);
      expect(rows).toHaveLength(0);
    });
  });

  describe('connexion', () => {
    it('accepte les identifiants corrects et met à jour last_login', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.register({ email: email('login'), password: PASSWORD, name: 'Login' });
      const session = await loginSession({ email: email('login'), password: PASSWORD });

      expect(session.user.email).toBe(email('login'));

      const { rows } = await pool.query<{ last_login: Date | null }>(
        'SELECT last_login FROM users WHERE id = $1',
        [session.user.id],
      );
      expect(rows[0].last_login).not.toBeNull();
    }, 60_000);

    it('refuse un mot de passe erroné', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.register({ email: email('mauvais-mdp'), password: PASSWORD, name: 'Test' });

      await expect(
        provider.login({ email: email('mauvais-mdp'), password: 'mauvais-mot-de-passe-2026' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    }, 60_000);

    it('ne permet pas de distinguer un email inconnu d’un mot de passe erroné', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.register({ email: email('connu'), password: PASSWORD, name: 'Connu' });

      const inconnu = await provider
        .login({ email: email('jamais-cree'), password: PASSWORD })
        .catch((error: Error) => error);
      const mauvaisMdp = await provider
        .login({ email: email('connu'), password: 'mauvais-mot-de-passe-2026' })
        .catch((error: Error) => error);

      // Message ET type identiques : rien ne permet d'énumérer les comptes.
      expect(inconnu).toBeInstanceOf(InvalidCredentialsError);
      expect(mauvaisMdp).toBeInstanceOf(InvalidCredentialsError);
      expect((inconnu as Error).message).toBe((mauvaisMdp as Error).message);
    }, 60_000);

    it('refuse un compte désactivé', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('inactif'),
        password: PASSWORD,
        name: 'Inactif',
      });
      await pool.query("UPDATE users SET status = 'Inactif' WHERE id = $1", [session.user.id]);

      await expect(
        provider.login({ email: email('inactif'), password: PASSWORD }),
      ).rejects.toBeInstanceOf(AccountDisabledError);
    }, 60_000);

    it('laisse se connecter un compte importé, en signalant le reset obligatoire', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      // Reproduit un compte repris de Firebase Auth : mot de passe posé par
      // l'import, `must_reset_password` à true.
      const session = await provider.register({
        email: email('importe'),
        password: PASSWORD,
        name: 'Compte Importé',
      });
      await pool.query('UPDATE users SET must_reset_password = true WHERE id = $1', [
        session.user.id,
      ]);

      const relogin = await loginSession({ email: email('importe'), password: PASSWORD });

      expect(relogin.user.mustResetPassword).toBe(true);
      expect(relogin.accessToken).toBeTruthy();
    }, 60_000);
  });

  describe('refresh et rotation', () => {
    it('échange un refresh token contre une nouvelle session', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const first = await provider.register({
        email: email('refresh'),
        password: PASSWORD,
        name: 'Refresh',
      });

      const second = await provider.refresh(first.refreshToken);

      expect(second.user.id).toBe(first.user.id);
      expect(second.refreshToken).not.toBe(first.refreshToken);
      expect(second.accessToken).toBeTruthy();
    }, 60_000);

    it('invalide l’ancien refresh token après rotation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const first = await provider.register({
        email: email('rotation'),
        password: PASSWORD,
        name: 'Rotation',
      });
      const second = await provider.refresh(first.refreshToken);

      // Réutiliser l'ancien jeton est un signe de vol : erreur dédiée.
      await expect(provider.refresh(first.refreshToken)).rejects.toBeInstanceOf(
        RefreshTokenReuseError,
      );

      // …et par précaution, TOUTES les sessions ont été révoquées. Présenter le
      // jeton de la seconde session est donc, lui aussi, une réutilisation d'un
      // jeton révoqué — d'où la même erreur, et non « jeton inconnu ».
      await expect(provider.refresh(second.refreshToken)).rejects.toBeInstanceOf(
        RefreshTokenReuseError,
      );

      // Vérification directe en base : plus aucune session active.
      const { rows } = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL',
        [second.user.id],
      );
      expect(Number(rows[0].count)).toBe(0);
    }, 60_000);

    it('refuse un refresh token inconnu', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await expect(provider.refresh('jeton-invente')).rejects.toBeInstanceOf(
        InvalidRefreshTokenError,
      );
    });

    it('refuse un refresh token expiré', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('expire'),
        password: PASSWORD,
        name: 'Expiré',
      });
      await pool.query(
        "UPDATE refresh_tokens SET expires_at = NOW() - INTERVAL '1 day' WHERE user_id = $1",
        [session.user.id],
      );

      await expect(provider.refresh(session.refreshToken)).rejects.toBeInstanceOf(
        InvalidRefreshTokenError,
      );
    }, 60_000);

    it('refuse de rafraîchir un compte désactivé', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('refresh-inactif'),
        password: PASSWORD,
        name: 'Test',
      });
      await pool.query("UPDATE users SET status = 'Inactif' WHERE id = $1", [session.user.id]);

      await expect(provider.refresh(session.refreshToken)).rejects.toBeInstanceOf(
        AccountDisabledError,
      );
    }, 60_000);
  });

  describe('déconnexion', () => {
    it('révoque le refresh token présenté', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('logout'),
        password: PASSWORD,
        name: 'Logout',
      });

      await provider.logout(session.refreshToken);

      await expect(provider.refresh(session.refreshToken)).rejects.toBeInstanceOf(
        RefreshTokenReuseError,
      );
    }, 60_000);

    it('est idempotente', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('logout-deux-fois'),
        password: PASSWORD,
        name: 'Logout',
      });

      await expect(provider.logout(session.refreshToken)).resolves.toBeUndefined();
      await expect(provider.logout(session.refreshToken)).resolves.toBeUndefined();
    }, 60_000);
  });

  describe('réinitialisation de mot de passe', () => {
    it('émet un jeton, l’enregistre haché, et permet de définir un nouveau mot de passe', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('reset'),
        password: PASSWORD,
        name: 'Reset',
      });

      const request = await provider.requestPasswordReset(email('reset'));
      expect(request).not.toBeNull();

      // Le jeton n'est jamais stocké en clair.
      const stored = await pool.query<{ token_hash: string }>(
        'SELECT token_hash FROM password_reset_tokens WHERE user_id = $1',
        [session.user.id],
      );
      expect(stored.rows[0].token_hash).not.toBe(request!.token);
      expect(stored.rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);

      const newPassword = 'un-tout-nouveau-mot-de-passe-2026';
      const user = await provider.resetPassword(request!.token, newPassword);
      expect(user.id).toBe(session.user.id);

      // Le nouveau mot de passe fonctionne, l'ancien non.
      await expect(
        provider.login({ email: email('reset'), password: newPassword }),
      ).resolves.toBeTruthy();
      await expect(
        provider.login({ email: email('reset'), password: PASSWORD }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    }, 90_000);

    it('lève le drapeau de reset obligatoire', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('reset-drapeau'),
        password: PASSWORD,
        name: 'Test',
      });
      await pool.query('UPDATE users SET must_reset_password = true WHERE id = $1', [
        session.user.id,
      ]);

      const request = await provider.requestPasswordReset(email('reset-drapeau'));
      const user = await provider.resetPassword(request!.token, 'un-nouveau-mot-de-passe-2026');

      expect(user.mustResetPassword).toBe(false);
    }, 90_000);

    it('révoque les sessions ouvertes lors du changement de mot de passe', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('reset-sessions'),
        password: PASSWORD,
        name: 'Test',
      });
      const request = await provider.requestPasswordReset(email('reset-sessions'));

      await provider.resetPassword(request!.token, 'un-nouveau-mot-de-passe-2026');

      // La session ouverte avec l'ancien mot de passe ne doit plus servir.
      await expect(provider.refresh(session.refreshToken)).rejects.toBeInstanceOf(
        RefreshTokenReuseError,
      );
    }, 90_000);

    it('n’accepte un lien qu’une seule fois', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.register({ email: email('reset-once'), password: PASSWORD, name: 'Test' });
      const request = await provider.requestPasswordReset(email('reset-once'));

      await provider.resetPassword(request!.token, 'un-nouveau-mot-de-passe-2026');

      await expect(
        provider.resetPassword(request!.token, 'encore-un-autre-mot-de-passe-2026'),
      ).rejects.toThrow(/déjà utilisé/);
    }, 90_000);

    it('refuse un jeton inconnu ou expiré', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await expect(
        provider.resetPassword('jeton-invente', 'un-nouveau-mot-de-passe-2026'),
      ).rejects.toBeInstanceOf(InvalidResetTokenError);

      const session = await provider.register({
        email: email('reset-expire'),
        password: PASSWORD,
        name: 'Test',
      });
      const request = await provider.requestPasswordReset(email('reset-expire'));
      await pool.query(
        "UPDATE password_reset_tokens SET expires_at = NOW() - INTERVAL '1 hour' WHERE user_id = $1",
        [session.user.id],
      );

      await expect(
        provider.resetPassword(request!.token, 'un-nouveau-mot-de-passe-2026'),
      ).rejects.toThrow(/expiré/);
    }, 90_000);

    it('retourne null pour un email inconnu, sans révéler qu’il n’existe pas', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await expect(provider.requestPasswordReset(email('jamais-cree'))).resolves.toBeNull();
    });
  });

  describe('changement de mot de passe', () => {
    it('exige le mot de passe actuel', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('change'),
        password: PASSWORD,
        name: 'Change',
      });

      const scope = {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        role: 'Propriétaire' as const,
      };

      await expect(
        provider.changePassword(scope, session.user.id, 'mauvais-mot-de-passe-2026', 'nouveau-mot-de-passe-2026'),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);

      await expect(
        provider.changePassword(scope, session.user.id, PASSWORD, 'nouveau-mot-de-passe-2026'),
      ).resolves.toBeUndefined();

      await expect(
        provider.login({ email: email('change'), password: 'nouveau-mot-de-passe-2026' }),
      ).resolves.toBeTruthy();
    }, 90_000);

    it('refuse d’agir sur un utilisateur d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const cible = await provider.register({
        email: email('cible'),
        password: PASSWORD,
        name: 'Cible',
      });
      const attaquant = await provider.register({
        email: email('attaquant'),
        password: PASSWORD,
        name: 'Attaquant',
      });

      const scopeAttaquant = {
        organizationId: attaquant.user.organizationId,
        userId: attaquant.user.id,
        role: 'Propriétaire' as const,
      };

      await expect(
        provider.changePassword(
          scopeAttaquant,
          cible.user.id,
          PASSWORD,
          'mot-de-passe-usurpe-2026',
        ),
      ).rejects.toThrow(/introuvable dans cette organisation/);
    }, 90_000);

    it('révoque toutes les sessions d’un utilisateur, dans sa seule organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const session = await provider.register({
        email: email('revoke-all'),
        password: PASSWORD,
        name: 'Revoke',
      });

      await provider.revokeAllSessions(
        {
          organizationId: session.user.organizationId,
          userId: session.user.id,
          role: 'Propriétaire',
        },
        session.user.id,
      );

      await expect(provider.refresh(session.refreshToken)).rejects.toBeInstanceOf(
        RefreshTokenReuseError,
      );
    }, 90_000);
  });

  it('est sélectionnable par AUTH_PROVIDER et rejette une valeur inconnue', () => {
    const previous = process.env.AUTH_PROVIDER;
    try {
      process.env.AUTH_PROVIDER = 'jwt';
      resetProviders();
      expect(getAuthProvider()).toBeInstanceOf(Object.getPrototypeOf(provider).constructor);

      process.env.AUTH_PROVIDER = 'oauth2';
      resetProviders();
      expect(() => getAuthProvider()).toThrow(/AUTH_PROVIDER inconnu.*jwt/);
    } finally {
      if (previous === undefined) delete process.env.AUTH_PROVIDER;
      else process.env.AUTH_PROVIDER = previous;
      resetProviders();
    }
  });
});
