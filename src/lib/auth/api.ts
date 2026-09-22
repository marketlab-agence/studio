import { NextResponse } from 'next/server';
import type { z } from 'zod';
import {
  AccountDisabledError,
  InvalidCredentialsError,
  InvalidInvitationError,
  InvalidMfaCodeError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
  InvalidRoleError,
  InvitationEmailTakenError,
  MfaNotConfiguredError,
  RefreshTokenReuseError,
} from '@/lib/providers/auth';
import { PasswordPolicyError } from '@/lib/auth/password';
import type { OrgScope } from '@/lib/providers/types';
import { tryVerifyAccessToken, type AccessTokenClaims } from '@/lib/auth/jwt';
import { ACCESS_COOKIE } from '@/lib/auth/cookies';
import { checkRateLimit, clientKey, type RateLimitResult, type RateLimitRule } from '@/lib/rate-limit';

/**
 * Outillage commun des route handlers d'authentification (REQ-AUTH-01, §20).
 *
 * Deux règles tenues partout :
 *
 * 1. **Aucun détail interne ne franchit la frontière HTTP.** Un message d'erreur
 *    inattendu devient une réponse générique ; la cause est journalisée côté
 *    serveur, jamais renvoyée.
 * 2. **Rien n'atteint la base avant validation.** Schéma Zod et limite de débit
 *    sont vérifiés en premier.
 */

export function errorResponse(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ message, ...extra }, { status });
}

function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { message: 'Trop de tentatives. Merci de réessayer dans quelques instants.' },
    {
      status: 429,
      // `Retry-After` permet au client d'attendre le bon délai au lieu de
      // réessayer à l'aveugle.
      headers: { 'Retry-After': String(result.retryAfterSeconds) },
    },
  );
}

/** Retourne une réponse 429 si la limite est atteinte, `null` sinon. */
export function enforceRateLimit(
  request: Request,
  scope: string,
  rule: RateLimitRule,
): NextResponse | null {
  const result = checkRateLimit(clientKey(request, scope), rule);
  return result.allowed ? null : rateLimitResponse(result);
}

/** Lit le corps JSON et le valide. Retourne soit les données, soit une réponse. */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T; response?: never } | { data?: never; response: NextResponse }> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return { response: errorResponse('Corps de requête illisible : JSON attendu.', 400) };
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      response: errorResponse('Données invalides.', 400, {
        // On expose les motifs de rejet : ils aident l'utilisateur à corriger sa
        // saisie et ne révèlent rien sur l'état du système.
        issues: parsed.error.issues.map((issue) => ({
          champ: issue.path.join('.') || '(racine)',
          message: issue.message,
        })),
      }),
    };
  }

  return { data: parsed.data };
}

/**
 * Traduit une erreur du provider en réponse HTTP.
 *
 * ⚠️ **Tout nouveau type d'erreur du provider doit être déclaré ici.** Une
 * erreur non reconnue tombe dans le `500` générique : le client reçoit « erreur
 * interne » pour ce qui est un simple refus d'usage, et le motif réel n'est
 * visible que dans les journaux du serveur.
 */
export function mapAuthError(error: unknown, context: string): NextResponse {
  if (error instanceof InvalidCredentialsError) return errorResponse(error.message, 401);
  if (error instanceof AccountDisabledError) return errorResponse(error.message, 403);
  if (error instanceof RefreshTokenReuseError) return errorResponse(error.message, 401);
  if (error instanceof InvalidRefreshTokenError) return errorResponse(error.message, 401);
  if (error instanceof InvalidResetTokenError) return errorResponse(error.message, 400);
  if (error instanceof PasswordPolicyError) return errorResponse(error.message, 400);
  if (error instanceof InvalidMfaCodeError) return errorResponse(error.message, 401);
  if (error instanceof MfaNotConfiguredError) return errorResponse(error.message, 409);
  if (error instanceof InvalidInvitationError) return errorResponse(error.message, 400);
  if (error instanceof InvalidRoleError) return errorResponse(error.message, 400);
  if (error instanceof InvitationEmailTakenError) return errorResponse(error.message, 409);

  // Un compte déjà existant est une erreur d'usage, pas une panne.
  if (error instanceof Error && /existe déjà/.test(error.message)) {
    return errorResponse(error.message, 409);
  }

  console.error(`[auth] ${context} — échec inattendu :`, error);
  return errorResponse('Une erreur interne est survenue.', 500);
}

/**
 * Construit le scope d'organisation à partir des informations de session.
 *
 * Le rôle provient du jeton, dont la signature a été vérifiée : il est donc
 * digne de confiance pour filtrer par organisation. L'autorisation fine (qui a
 * le droit de faire quoi) reste à la charge de chaque route.
 */
export function scopeFromClaims(claims: AccessTokenClaims): OrgScope {
  return {
    organizationId: claims.organizationId,
    userId: claims.userId,
    role: claims.role as OrgScope['role'],
  };
}
export async function requireSession(
  request: Request,
): Promise<
  { claims: AccessTokenClaims; response?: never } | { claims?: never; response: NextResponse }
> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ACCESS_COOKIE}=([^;]+)`));

  const claims = await tryVerifyAccessToken(match?.[1]);
  if (!claims) {
    return { response: errorResponse('Authentification requise.', 401) };
  }

  return { claims };
}
