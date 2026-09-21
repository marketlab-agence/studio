import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { mfaCodeSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, mapAuthError, parseBody, requireSession, scopeFromClaims } from '@/lib/auth/api';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/mfa/verify — active la double authentification.
 *
 * Exige un premier code TOTP valide : c'est la preuve que l'application
 * d'authentification a bien enregistré le secret. Sans cette vérification,
 * l'activation reposerait sur une simple déclaration.
 *
 * Limite de débit stricte : cette route accepte un code à 6 chiffres, donc
 * 10^6 possibilités — sans limitation, elle serait attaquable par force brute.
 */
export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  const limited = enforceRateLimit(request, 'mfa-verify', RATE_LIMITS.login);
  if (limited) return limited;

  const body = await parseBody(request, mfaCodeSchema);
  if (body.response) return body.response;

  try {
    await getAuthProvider().confirmMfaSetup(
      scopeFromClaims(session.claims),
      session.claims.userId,
      body.data.code,
    );

    return NextResponse.json({ enabled: true, message: 'Double authentification activée.' });
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/mfa/verify');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}
