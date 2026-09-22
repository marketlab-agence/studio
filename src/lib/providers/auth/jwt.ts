import { createHash, randomBytes } from 'node:crypto';
import { query, withTransaction } from '@/lib/db/pool';
import {
  ACCESS_TTL_SECONDS,
  MFA_CHALLENGE_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  signAccessToken,
  signMfaChallenge,
  verifyMfaChallenge,
} from '@/lib/auth/jwt';
import { assertPasswordPolicy, hashPassword, verifyPassword } from '@/lib/auth/password';
import { decryptSecret, encryptSecret, looksEncrypted } from '@/lib/auth/crypto';
import {
  buildTotpUri,
  generateTotpSecret,
  verifyTotp,
  TOTP_PERIOD_SECONDS,
} from '@/lib/auth/totp';
import {
  AccountDisabledError,
  GoogleAccountConflictError,
  InvalidCredentialsError,
  InvalidMfaCodeError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
  MfaNotConfiguredError,
  RefreshTokenReuseError,
  RESET_TTL_MINUTES,
  type AuthProvider,
  type AuthenticatedUser,
  type GoogleProfileInput,
  type LoginInput,
  type LoginResult,
  type MfaSetup,
  type MfaStatus,
  type RegisterInput,
  type Session,
} from '../auth';
import type { OrgScope } from '../types';

/**
 * Authentification JWT sur PostgreSQL (ADR 0002).
 *
 * Deux principes de sécurité structurent ce module :
 *
 * 1. **Rien de secret n'est stocké en clair.** Les mots de passe sont hachés par
 *    bcrypt ; les refresh tokens et les jetons de réinitialisation sont hachés
 *    par SHA-256 (ils sont aléatoires sur 32 octets, donc non devinables : un
 *    KDF lent n'apporterait rien).
 *
 * 2. **Un refresh token ne sert qu'une fois.** Chaque rafraîchissement révoque
 *    le jeton présenté et en émet un nouveau. Présenter un jeton **déjà révoqué**
 *    est traité comme un vol probable : toutes les sessions de l'utilisateur
 *    sont alors révoquées.
 */

/** Durée de vie d'un lien de réinitialisation : voir `RESET_TTL_MINUTES`. */

type UserRow = {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: string;
  status: 'Actif' | 'Inactif';
  plan_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  password_hash: string | null;
  must_reset_password: boolean;
  two_factor_enabled: boolean;
  google_id: string | null;
  two_factor_secret: string | null;
};

const USER_COLUMNS = `
  id, organization_id, email, name, role, status, plan_id, avatar_url, phone,
  password_hash, must_reset_password, two_factor_enabled, two_factor_secret, google_id
`;

function toAuthenticatedUser(row: UserRow): AuthenticatedUser {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    planId: row.plan_id ?? 'free',
    avatarUrl: row.avatar_url ?? undefined,
    phone: row.phone ?? undefined,
    mustResetPassword: row.must_reset_password,
    twoFactorEnabled: row.two_factor_enabled,
  };
}

/** Jeton aléatoire opaque (32 octets → 43 caractères base64url). */
function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Empreinte d'un jeton opaque.
 * SHA-256 (et non bcrypt) : le jeton est déjà imprévisible, il n'y a donc rien
 * à ralentir — et la vérification doit rester rapide à chaque requête.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'organisation';
}

/** Code PostgreSQL d'une violation de contrainte d'unicité. */
const UNIQUE_VIOLATION = '23505';

/**
 * Indique si l'erreur est une violation d'unicité sur une contrainte donnée.
 *
 * **Pourquoi c'est nécessaire** : « vérifier puis insérer » est un schéma
 * *racé par nature*. Deux requêtes concurrentes passent le contrôle
 * d'existence, puis l'une viole la contrainte. Sans ce traitement, la seconde
 * obtient un **500** — une erreur serveur pour ce qui est un simple conflit
 * d'usage. La contrainte est le vrai garde-fou ; encore faut-il traduire sa
 * violation correctement.
 */
function isUniqueViolation(error: unknown, constraint: string): boolean {
  const candidate = error as { code?: string; constraint?: string };
  return candidate?.code === UNIQUE_VIOLATION && candidate.constraint === constraint;
}

export class JwtAuthProvider implements AuthProvider {
  /** Normalise l'email : la casse ne doit pas créer de comptes distincts. */
  private static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = lower($1)`,
      [JwtAuthProvider.normalizeEmail(email)],
    );
    return rows[0] ?? null;
  }

  private async findById(userId: string): Promise<UserRow | null> {
    const { rows } = await query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
      userId,
    ]);
    return rows[0] ?? null;
  }

  /** Émet une session et enregistre le refresh token (haché). */
  private async issueSession(user: UserRow): Promise<Session> {
    const accessToken = await signAccessToken({
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, hashToken(refreshToken), expiresAt],
    );

    return {
      user: toAuthenticatedUser(user),
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TTL_SECONDS,
    };
  }

  async register(input: RegisterInput): Promise<Session> {
    const email = JwtAuthProvider.normalizeEmail(input.email);

    // La politique est vérifiée AVANT toute écriture : pas d'organisation
    // orpheline si le mot de passe est refusé.
    assertPasswordPolicy(input.password);
    const passwordHash = await hashPassword(input.password);

    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error(`Un compte existe déjà pour ${email}.`);
    }

    let userId: string;
    try {
      userId = await withTransaction(async (client) => {
        let organizationId = input.organizationId;

        if (!organizationId) {
          // Inscription libre-service (REQ-ORG-04) : créer un compte crée
          // l'organisation, l'inscrit devient Propriétaire.
          const slug = `${slugify(input.name)}-${randomBytes(3).toString('hex')}`;
          const created = await client.query<{ id: string }>(
            `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id`,
            [input.name, slug],
          );
          organizationId = created.rows[0].id;
        }

        const inserted = await client.query<{ id: string }>(
          `INSERT INTO users (organization_id, email, name, role, password_hash)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            organizationId,
            email,
            input.name,
            input.organizationId ? 'Utilisateur' : 'Propriétaire',
            passwordHash,
          ],
        );

        const createdUserId = inserted.rows[0].id;

        // `organizations.owner_id` référence users : renseigné après création.
        if (!input.organizationId) {
          await client.query('UPDATE organizations SET owner_id = $1 WHERE id = $2', [
            createdUserId,
            organizationId,
          ]);
        }

        return createdUserId;
      });
    } catch (error) {
      // Une inscription concurrente a créé le compte entre le contrôle et
      // l'insertion : c'est un conflit d'usage, pas une panne.
      if (isUniqueViolation(error, 'users_email_key')) {
        throw new Error(`Un compte existe déjà pour ${email}.`);
      }
      throw error;
    }

    const user = await this.findById(userId);
    if (!user) throw new Error('Compte introuvable après création.');

    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.findByEmail(input.email);

    // Le mot de passe est vérifié même si le compte est introuvable : sans cela,
    // le temps de réponse révélerait quels emails existent. `verifyPassword`
    // retourne `false` sur un hachage absent, ce qui couvre les comptes OAuth.
    const passwordOk = await verifyPassword(input.password, user?.password_hash ?? null);

    if (!user || !passwordOk) {
      throw new InvalidCredentialsError();
    }

    if (user.status !== 'Actif') {
      throw new AccountDisabledError();
    }

    // Second facteur exigé : le mot de passe seul ne suffit pas, aucune session
    // n'est ouverte. On retourne un défi à courte durée de vie.
    if (user.two_factor_enabled) {
      return {
        mfaRequired: true,
        challengeToken: await signMfaChallenge(user.id),
        expiresInSeconds: MFA_CHALLENGE_TTL_SECONDS,
      };
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    return this.issueSession(user);
  }

  // --- Double authentification ----------------------------------------------

  async loginWithGoogle(profile: GoogleProfileInput): Promise<Session> {
    const email = JwtAuthProvider.normalizeEmail(profile.email);

    // 1. Compte déjà rattaché à ce compte Google : chemin nominal des visites
    //    suivantes, et seul cas où un changement d'adresse côté Google ne crée
    //    pas de doublon.
    const bySubject = await query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users WHERE google_id = $1`,
      [profile.subject],
    );

    if (bySubject.rows[0]) {
      const user = bySubject.rows[0];
      if (user.status !== 'Actif') throw new AccountDisabledError();

      await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
      return this.issueSession(user);
    }

    // 2. Compte existant portant cette adresse : on le rattache.
    const existing = await this.findByEmail(email);

    if (existing) {
      // L'adresse est déjà liée à un AUTRE compte Google : on refuse plutôt que
      // d'écraser, sinon la connexion d'un tiers prendrait la main sur ce compte.
      if (existing.google_id && existing.google_id !== profile.subject) {
        throw new GoogleAccountConflictError();
      }

      if (existing.status !== 'Actif') throw new AccountDisabledError();

      await query(
        `UPDATE users
         SET google_id = $2,
             avatar_url = COALESCE(avatar_url, $3),
             last_login = NOW(),
             -- Google a vérifié l'adresse : le mot de passe local n'est plus
             -- nécessaire, et l'obligation de le réinitialiser n'a plus lieu
             -- d'être (REQ-AUTH-07 : les comptes Google se connectent sans
             -- friction).
             must_reset_password = false
         WHERE id = $1`,
        [existing.id, profile.subject, profile.picture ?? null],
      );

      const refreshed = await this.findById(existing.id);
      if (!refreshed) throw new InvalidCredentialsError();

      return this.issueSession(refreshed);
    }

    // 3. Aucun compte : inscription libre-service, comme pour l'email. Le compte
    //    n'a PAS de mot de passe local (`password_hash` reste NULL).
    let userId: string;
    try {
      userId = await withTransaction(async (client) => {
        const slug = `${slugify(profile.name)}-${randomBytes(3).toString('hex')}`;
        const created = await client.query<{ id: string }>(
          `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id`,
          [profile.name, slug],
        );
        const organizationId = created.rows[0].id;

        const inserted = await client.query<{ id: string }>(
          `INSERT INTO users (organization_id, email, name, role, google_id, avatar_url)
           VALUES ($1, $2, $3, 'Propriétaire', $4, $5)
           RETURNING id`,
          [organizationId, email, profile.name, profile.subject, profile.picture ?? null],
        );

        const createdUserId = inserted.rows[0].id;

        await client.query('UPDATE organizations SET owner_id = $1 WHERE id = $2', [
          createdUserId,
          organizationId,
        ]);

        return createdUserId;
      });
    } catch (error) {
      // Deux connexions Google simultanées pour le même compte, ou pour la même
      // adresse : la contrainte tranche, et on traduit en conflit d'usage plutôt
      // qu'en erreur serveur.
      if (isUniqueViolation(error, 'users_google_id_key')) {
        throw new GoogleAccountConflictError();
      }
      if (isUniqueViolation(error, 'users_email_key')) {
        throw new GoogleAccountConflictError();
      }
      throw error;
    }

    const user = await this.findById(userId);
    if (!user) throw new InvalidCredentialsError();

    return this.issueSession(user);
  }

  async currentUser(scope: OrgScope, userId: string): Promise<AuthenticatedUser | null> {
    // Filtré par organisation : un identifiant valide d'une autre organisation
    // retourne `null`, jamais la ligne.
    const { rows } = await query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users WHERE organization_id = $1 AND id = $2`,
      [scope.organizationId, userId],
    );

    return rows[0] ? toAuthenticatedUser(rows[0]) : null;
  }

  /**
   * Déchiffre le secret TOTP stocké.
   *
   * Tolère une valeur non chiffrée : c'est le cas d'un secret posé avant la
   * mise en place du chiffrement. Refuser ces valeurs enfermerait dehors les
   * utilisateurs concernés.
   */
  private static readTotpSecret(stored: string | null): string | null {
    if (!stored) return null;
    return looksEncrypted(stored) ? decryptSecret(stored) : stored;
  }

  async mfaStatus(scope: OrgScope, userId: string): Promise<MfaStatus> {
    const { rows } = await query<{ two_factor_enabled: boolean; two_factor_secret: string | null }>(
      'SELECT two_factor_enabled, two_factor_secret FROM users WHERE organization_id = $1 AND id = $2',
      [scope.organizationId, userId],
    );

    const row = rows[0];
    if (!row) throw new Error(`Utilisateur "${userId}" introuvable dans cette organisation.`);

    return {
      configured: row.two_factor_secret !== null,
      enabled: row.two_factor_enabled,
    };
  }

  async beginMfaSetup(scope: OrgScope, userId: string): Promise<MfaSetup> {
    const user = await query<{ email: string; name: string }>(
      'SELECT email, name FROM users WHERE organization_id = $1 AND id = $2',
      [scope.organizationId, userId],
    );

    const account = user.rows[0];
    if (!account) throw new Error(`Utilisateur "${userId}" introuvable dans cette organisation.`);

    const secret = generateTotpSecret();

    // Le secret est stocké chiffré, mais `two_factor_enabled` reste à false :
    // l'activation attend la preuve que l'application d'authentification
    // enregistre bien ce secret (voir `confirmMfaSetup`).
    await query(
      `UPDATE users SET two_factor_secret = $3, two_factor_enabled = false
       WHERE organization_id = $1 AND id = $2`,
      [scope.organizationId, userId, encryptSecret(secret)],
    );

    return {
      secret,
      uri: buildTotpUri({
        secretBase32: secret,
        accountName: account.email,
        issuer: process.env.MFA_ISSUER ?? 'Katalyst',
      }),
    };
  }

  async confirmMfaSetup(scope: OrgScope, userId: string, code: string): Promise<void> {
    const { rows } = await query<{ two_factor_secret: string | null }>(
      'SELECT two_factor_secret FROM users WHERE organization_id = $1 AND id = $2',
      [scope.organizationId, userId],
    );

    const stored = rows[0]?.two_factor_secret;
    if (!stored) throw new MfaNotConfiguredError();

    const secret = JwtAuthProvider.readTotpSecret(stored);
    if (!secret || !verifyTotp(secret, code)) {
      throw new InvalidMfaCodeError();
    }

    await query(
      'UPDATE users SET two_factor_enabled = true WHERE organization_id = $1 AND id = $2',
      [scope.organizationId, userId],
    );
  }

  async disableMfa(scope: OrgScope, userId: string, password: string): Promise<void> {
    const { rows } = await query<{ password_hash: string | null }>(
      'SELECT password_hash FROM users WHERE organization_id = $1 AND id = $2',
      [scope.organizationId, userId],
    );

    const stored = rows[0];
    if (!stored) throw new Error(`Utilisateur "${userId}" introuvable dans cette organisation.`);

    // Le mot de passe est exigé : sans lui, un jeton d'accès volé suffirait à
    // retirer le second facteur — c'est-à-dire à affaiblir le compte.
    if (!(await verifyPassword(password, stored.password_hash))) {
      throw new InvalidCredentialsError();
    }

    await query(
      `UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL
       WHERE organization_id = $1 AND id = $2`,
      [scope.organizationId, userId],
    );
  }

  async completeMfaChallenge(challengeToken: string, code: string): Promise<Session> {
    // Un défi invalide ou expiré ne doit pas révéler s'il correspond à un compte.
    let userId: string;
    try {
      ({ userId } = await verifyMfaChallenge(challengeToken));
    } catch {
      throw new InvalidMfaCodeError();
    }

    const user = await this.findById(userId);
    if (!user || user.status !== 'Actif') {
      throw new InvalidMfaCodeError();
    }

    const secret = JwtAuthProvider.readTotpSecret(user.two_factor_secret);
    if (!secret) throw new MfaNotConfiguredError();

    if (!verifyTotp(secret, code, { period: TOTP_PERIOD_SECONDS })) {
      throw new InvalidMfaCodeError();
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<Session> {
    const tokenHash = hashToken(refreshToken);

    const { rows } = await query<{
      id: string;
      user_id: string;
      expires_at: Date;
      revoked_at: Date | null;
    }>('SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token = $1', [
      tokenHash,
    ]);

    const stored = rows[0];
    if (!stored) {
      throw new InvalidRefreshTokenError();
    }

    // Jeton déjà utilisé : on ne peut pas distinguer un vol d'une simple
    // reprise, donc on révoque tout par précaution (détection de réutilisation).
    if (stored.revoked_at) {
      await query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
        [stored.user_id],
      );
      throw new RefreshTokenReuseError();
    }

    if (stored.expires_at.getTime() <= Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.findById(stored.user_id);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }
    if (user.status !== 'Actif') {
      throw new AccountDisabledError();
    }

    // Rotation : l'ancien jeton est révoqué, un nouveau est émis.
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [stored.id]);

    return this.issueSession(user);
  }

  async logout(refreshToken: string): Promise<void> {
    // Idempotent : se déconnecter deux fois n'est pas une erreur.
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1 AND revoked_at IS NULL',
      [hashToken(refreshToken)],
    );
  }

  async revokeAllSessions(scope: OrgScope, userId: string): Promise<void> {
    // Le filtre par organisation empêche de révoquer les sessions d'un
    // utilisateur appartenant à une autre organisation.
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE revoked_at IS NULL
         AND user_id IN (SELECT id FROM users WHERE organization_id = $1 AND id = $2)`,
      [scope.organizationId, userId],
    );
  }

  async requestPasswordReset(
    email: string,
  ): Promise<{ token: string; user: AuthenticatedUser } | null> {
    const user = await this.findByEmail(email);

    // Email inconnu : on retourne `null` sans lever. L'endpoint répondra la même
    // chose que pour un email connu, afin de ne pas énumérer les comptes.
    if (!user) return null;

    const token = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, hashToken(token), expiresAt],
    );

    // Seul moment où le jeton existe en clair : l'appelant doit l'envoyer.
    return { token, user: toAuthenticatedUser(user) };
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthenticatedUser> {
    assertPasswordPolicy(newPassword);
    const passwordHash = await hashPassword(newPassword);
    const tokenHash = hashToken(token);

    const userId = await withTransaction(async (client) => {
      const { rows } = await client.query<{
        id: string;
        user_id: string;
        expires_at: Date;
        used_at: Date | null;
      }>(
        'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1 FOR UPDATE',
        [tokenHash],
      );

      const stored = rows[0];
      if (!stored) throw new InvalidResetTokenError();
      if (stored.used_at) throw new InvalidResetTokenError('lien déjà utilisé');
      if (stored.expires_at.getTime() <= Date.now()) throw new InvalidResetTokenError('lien expiré');

      // Le lien est consommé et le mot de passe posé dans la même transaction :
      // jamais de lien brûlé sans mot de passe changé, ni l'inverse.
      await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [
        stored.id,
      ]);

      await client.query(
        `UPDATE users SET password_hash = $2, must_reset_password = false WHERE id = $1`,
        [stored.user_id, passwordHash],
      );

      // Un mot de passe changé invalide les sessions ouvertes avec l'ancien.
      await client.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
        [stored.user_id],
      );

      return stored.user_id;
    });

    const user = await this.findById(userId);
    if (!user) throw new InvalidResetTokenError('compte introuvable');
    return toAuthenticatedUser(user);
  }

  async changePassword(
    scope: OrgScope,
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    assertPasswordPolicy(newPassword);

    const { rows } = await query<{ password_hash: string | null }>(
      'SELECT password_hash FROM users WHERE organization_id = $1 AND id = $2',
      [scope.organizationId, userId],
    );

    const stored = rows[0];
    if (!stored) throw new Error(`Utilisateur "${userId}" introuvable dans cette organisation.`);

    // Le mot de passe actuel est exigé : sans cela, un jeton d'accès volé
    // suffirait à s'approprier définitivement le compte.
    if (!(await verifyPassword(currentPassword, stored.password_hash))) {
      throw new InvalidCredentialsError();
    }

    const newHash = await hashPassword(newPassword);

    await query('UPDATE users SET password_hash = $2, must_reset_password = false WHERE id = $1', [
      userId,
      newHash,
    ]);
  }
}
