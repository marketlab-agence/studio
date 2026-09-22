import type { AuthenticatedUser } from '@/lib/providers/auth';
import { request, type ApiResult } from '@/lib/api-client';

/**
 * Appels d'authentification côté navigateur.
 *
 * Séparés du contexte React : celui-ci ne porte que l'**état** de session, ces
 * fonctions ne font que **parler au serveur**. Mélanger les deux rendrait le
 * contexte impossible à tester et à raisonner.
 *
 * Aucune de ces fonctions ne manipule de jeton : les cookies sont `httpOnly`,
 * donc invisibles au JavaScript de la page — c'est précisément l'objectif.
 */

// Ré-exporté : les appelants historiques importent ApiResult depuis ce module.
export type { ApiResult };

export interface SessionUserResponse {
  user: AuthenticatedUser;
  accessTokenExpiresIn?: number;
  redirectTo?: string | null;
}

export interface MfaChallengeResponse {
  mfaRequired: true;
  challengeToken: string;
  expiresInSeconds: number;
}


/** Connexion. Peut retourner une session ou un défi à deux facteurs. */
export function loginRequest(
  email: string,
  password: string,
): Promise<ApiResult<SessionUserResponse | MfaChallengeResponse>> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(input: {
  email: string;
  password: string;
  name: string;
}): Promise<ApiResult<SessionUserResponse>> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Complète une connexion à deux facteurs. */
export function completeMfaRequest(
  challengeToken: string,
  code: string,
): Promise<ApiResult<SessionUserResponse>> {
  return request('/api/auth/mfa/challenge', {
    method: 'POST',
    body: JSON.stringify({ challengeToken, code }),
  });
}

export function logoutRequest(): Promise<ApiResult<void>> {
  return request('/api/auth/logout', { method: 'POST' });
}

export function forgotPasswordRequest(email: string): Promise<ApiResult<{ message: string }>> {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordRequest(
  token: string,
  password: string,
): Promise<ApiResult<{ message: string }>> {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
): Promise<ApiResult<{ message: string }>> {
  return request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function mfaStatusRequest(): Promise<
  ApiResult<{ configured: boolean; enabled: boolean }>
> {
  return request('/api/auth/mfa/status');
}

export function mfaSetupRequest(): Promise<
  ApiResult<{ secret: string; uri: string; message: string }>
> {
  return request('/api/auth/mfa/setup', { method: 'POST' });
}

export function mfaVerifyRequest(code: string): Promise<ApiResult<{ enabled: boolean }>> {
  return request('/api/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function mfaDisableRequest(password: string): Promise<ApiResult<{ enabled: boolean }>> {
  return request('/api/auth/mfa/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

/**
 * Met à jour le profil de l'utilisateur connecté.
 * Seuls le nom et le téléphone sont modifiables ; l'email exige une vérification.
 */
export function updateProfileRequest(changes: {
  name?: string;
  phone?: string;
}): Promise<ApiResult<{ user: AuthenticatedUser }>> {
  return request('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

// --- Invitations (REQ-ORG-05) -------------------------------------------------

export interface InvitationView {
  email: string;
  role: string;
  organizationName: string;
  expiresAt: string;
}

/** Informations publiques d'une invitation, avant création du compte. */
export function fetchInvitation(
  token: string,
): Promise<ApiResult<{ invitation: InvitationView }>> {
  return request(`/api/auth/invitation?token=${encodeURIComponent(token)}`);
}

/** Accepte une invitation : crée le compte et ouvre la session. */
export function acceptInvitationRequest(
  token: string,
  details: { name: string; password: string },
): Promise<ApiResult<SessionUserResponse>> {
  return request('/api/auth/invitation', {
    method: 'POST',
    body: JSON.stringify({ token, ...details }),
  });
}

/** Invite une personne dans l'organisation. Réservé à l'administration. */
export function createInvitationRequest(input: {
  email: string;
  role: string;
}): Promise<ApiResult<{ invitation: InvitationView; message: string }>> {
  return request('/api/v1/invitations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Liste les invitations en attente de l'organisation. */
export function listInvitationsRequest(): Promise<ApiResult<{ invitations: InvitationView[] }>> {
  return request('/api/v1/invitations');
}

/** Révoque une invitation en attente. */
export function revokeInvitationRequest(id: string): Promise<ApiResult<{ message: string }>> {
  return request(`/api/v1/invitations/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/**
 * Récupère la session courante, en un seul appel.
 *
 * `POST /api/auth/session` répond **toujours 200** (`{ user }` ou
 * `{ user: null }`) et se charge lui-même de rafraîchir le jeton d'accès s'il a
 * expiré. C'est le remplacement de l'écouteur Firebase : **un appel, au
 * montage**, au lieu d'un abonnement permanent — rien à détacher, donc rien à
 * fuir.
 *
 * Un seul appel plutôt que deux : interroger `/me` puis `/refresh` produisait
 * une requête en échec (401) dans la console de chaque visiteur anonyme, sur
 * toutes les pages publiques.
 */
export async function fetchSession(): Promise<AuthenticatedUser | null> {
  const result = await request<{ user: AuthenticatedUser | null }>('/api/auth/session', {
    method: 'POST',
  });

  // Panne réseau : on considère qu'il n'y a pas de session. L'utilisateur
  // verra l'état déconnecté, et le prochain chargement rétablira la situation.
  return result.ok ? result.data.user : null;
}