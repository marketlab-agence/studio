import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { disableMfaSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, mapAuthError, parseBody, requireSession, scopeFromClaims } from '@/lib/auth/api';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/mfa/disable — désactive la double authentification.
 *
 * Exige le **mot de passe actuel**. Sans cette exigence, un jeton d'accès volé
 * suffirait à retirer le second facteur : l'attaquant n'aurait plus qu'à se
 * connecter avec le mot de passe, et la protection aurait été annulée par
 * celui-là même qu'elle visait.
 */
export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  const limited = enforceRateLimit(request, 'mfa-disable', RATE_LIMITS.login);
  if (limited) return limited;

  const body = await parseBody(request, disableMfaSchema);
  if (body.response) return body.response;

  try {
    await getAuthProvider().disableMfa(
      scopeFromClaims(session.claims),
      session.claims.userId,
      body.data.password,
    );

    return NextResponse.json({
      enabled: false,
      message: 'Double authentification désactivée.',
    });
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/mfa/disable');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}
