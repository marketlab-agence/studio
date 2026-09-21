import { NextResponse } from 'next/server';
import type { z } from 'zod';
import {
  AccountDisabledError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
  RefreshTokenReuseError,
} from '@/lib/providers/auth';
import { PasswordPolicyError } from '@/lib/auth/password';
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
 * Les erreurs d'authentification ont un statut précis ; tout le reste devient un
 * 500 générique, la cause étant journalisée.
 */
export function mapAuthError(error: unknown, context: string): NextResponse {
  if (error instanceof InvalidCredentialsError) return errorResponse(error.message, 401);
  if (error instanceof AccountDisabledError) return errorResponse(error.message, 403);
  if (error instanceof RefreshTokenReuseError) return errorResponse(error.message, 401);
  if (error instanceof InvalidRefreshTokenError) return errorResponse(error.message, 401);
  if (error instanceof InvalidResetTokenError) return errorResponse(error.message, 400);
  if (error instanceof PasswordPolicyError) return errorResponse(error.message, 400);

  // Un compte déjà existant est une erreur d'usage, pas une panne.
  if (error instanceof Error && /existe déjà/.test(error.message)) {
    return errorResponse(error.message, 409);
  }

  console.error(`[auth] ${context} — échec inattendu :`, error);
  return errorResponse('Une erreur interne est survenue.', 500);
}
