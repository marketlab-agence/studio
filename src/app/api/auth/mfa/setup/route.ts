import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { enforceRateLimit, errorResponse, mapAuthError, requireSession, scopeFromClaims } from '@/lib/auth/api';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/mfa/setup — prépare l'activation (génère un secret chiffré).
 *
 * Le secret n'est **pas** activé à cette étape : `two_factor_enabled` reste à
 * false jusqu'à `confirmMfaSetup`. Sans cette précaution, un utilisateur dont
 * l'application d'authentification n'aurait pas enregistré le secret se
 * retrouverait enfermé hors de son compte.
 *
 * L'état se consulte sur `/api/auth/mfa/status`.
 */
export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  // La génération d'un secret est peu coûteuse mais crée un état en base :
  // on la limite pour éviter qu'un compte compromis n'en génère en boucle.
  const limited = enforceRateLimit(request, 'mfa-setup', RATE_LIMITS.refresh);
  if (limited) return limited;

  try {
    const setup = await getAuthProvider().beginMfaSetup(
      scopeFromClaims(session.claims),
      session.claims.userId,
    );

    return NextResponse.json({
      secret: setup.secret,
      uri: setup.uri,
      message:
        'Scannez le QR code, puis validez un premier code sur /api/auth/mfa/verify pour activer la double authentification.',
    });
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/mfa/setup');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : l’état se consulte sur /api/auth/mfa/status.', 405);
}
