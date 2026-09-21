import type { OrgScope } from './types';

/**
 * Authentification (ADR 0002, REQ-AUTH-01 à REQ-AUTH-04, REQ-AUTH-06).
 *
 * Remplace Firebase Auth. Le choix du mécanisme est fait par `AUTH_PROVIDER`
 * (aujourd'hui `jwt` uniquement) : aucun appelant ne connaît l'implémentation.
 *
 * ⚠️ Ce provider est le **seul** à travailler sans `OrgScope` : au moment de la
 * connexion, l'organisation de l'utilisateur n'est pas encore connue. C'est
 * précisément ce que la connexion établit. Toutes les méthodes qui s'adressent à
 * un utilisateur **déjà identifié** (révocation, réinitialisation) prennent,
 * elles, un `OrgScope`.
 */

/** Utilisateur tel que l'authentification le restitue (jamais de hachage). */
export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: string;
  status: 'Actif' | 'Inactif';
  avatarUrl?: string;
  /**
   * `true` pour les comptes repris de Firebase Auth : la connexion aboutit mais
   * l'application doit imposer un nouveau mot de passe (REQ-AUTH-06).
   */
  mustResetPassword: boolean;
  twoFactorEnabled: boolean;
}

export interface Session {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  /** Durée de vie du jeton d'accès, en secondes. */
  accessTokenExpiresIn: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  /** Organisation de rattachement. Absent = création d'une organisation (REQ-ORG-04). */
  organizationId?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Levée quand les identifiants sont refusés.
 *
 * Un message unique couvre « email inconnu » et « mot de passe erroné » : les
 * distinguer permettrait d'énumérer les comptes existants.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email ou mot de passe incorrect.');
    this.name = 'InvalidCredentialsError';
  }
}

/** Levée quand un compte est désactivé. */
export class AccountDisabledError extends Error {
  constructor() {
    super('Ce compte est désactivé. Contacter un administrateur.');
    this.name = 'AccountDisabledError';
  }
}

/**
 * Levée quand un refresh token déjà révoqué est présenté.
 *
 * Signe probable d'un vol de jeton : par précaution, **toutes** les sessions de
 * l'utilisateur concerné sont révoquées.
 */
export class RefreshTokenReuseError extends Error {
  constructor() {
    super(
      'Ce jeton de session a déjà été utilisé. Par précaution, toutes les sessions ' +
        'ont été révoquées : reconnectez-vous.',
    );
    this.name = 'RefreshTokenReuseError';
  }
}

/** Levée quand un jeton de réinitialisation est inconnu, expiré ou déjà utilisé. */
export class InvalidResetTokenError extends Error {
  constructor(reason = 'lien inconnu, expiré ou déjà utilisé') {
    super(`Réinitialisation impossible : ${reason}. Demander un nouveau lien.`);
    this.name = 'InvalidResetTokenError';
  }
}

/** Levée quand un refresh token est inconnu ou expiré (mais pas réutilisé). */
export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Session expirée ou inconnue. Reconnectez-vous.');
    this.name = 'InvalidRefreshTokenError';
  }
}

/**
 * Durée de vie d'un lien de réinitialisation, en minutes.
 *
 * Source unique : l'email annonce cette durée et le stockage l'applique. Deux
 * constantes séparées finiraient par diverger, et l'utilisateur lirait une
 * promesse que le système ne tient pas.
 */
export const RESET_TTL_MINUTES = 60;

export interface AuthProvider {
  /** Crée un compte. L'organisation est créée si `organizationId` est absent. */
  register(input: RegisterInput): Promise<Session>;

  /** Connexion par email et mot de passe. */
  login(input: LoginInput): Promise<Session>;

  /**
   * Échange un refresh token contre une nouvelle session.
   * Le jeton présenté est **révoqué** au passage (rotation).
   */
  refresh(refreshToken: string): Promise<Session>;

  /** Révoque le refresh token présenté. Sans effet s'il est déjà révoqué. */
  logout(refreshToken: string): Promise<void>;

  /** Révoque toutes les sessions d'un utilisateur (changement de mot de passe, incident). */
  revokeAllSessions(scope: OrgScope, userId: string): Promise<void>;

  /**
   * Émet un jeton de réinitialisation.
   *
   * Retourne le jeton **en clair** — le seul moment où il existe sous cette
   * forme : seul son hachage est conservé. L'appelant l'envoie par email.
   * Retourne `null` si l'email est inconnu, sans le signaler à l'appelant (le
   * endpoint répond la même chose dans les deux cas, pour ne pas énumérer les
   * comptes).
   */
  requestPasswordReset(email: string): Promise<{ token: string; user: AuthenticatedUser } | null>;

  /**
   * Définit un nouveau mot de passe à partir d'un jeton de réinitialisation.
   * Révoque toutes les sessions existantes.
   */
  resetPassword(token: string, newPassword: string): Promise<AuthenticatedUser>;

  /** Change le mot de passe d'un utilisateur authentifié. */
  changePassword(
    scope: OrgScope,
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void>;
}
