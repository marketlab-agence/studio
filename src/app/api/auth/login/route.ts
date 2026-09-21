import { NextResponse } from 'next/server';
import { getAuthProvider, isMfaChallenge } from '@/lib/providers';
import { loginSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, mapAuthError, parseBody } from '@/lib/auth/api';
import { setSessionCookies } from '@/lib/auth/cookies';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/login — connexion (REQ-AUTH-01, REQ-AUTH-04, REQ-AUTH-06).
 *
 * Deux issues possibles :
 *
 * 1. **Session complète** — cookies posés, comme attendu.
 * 2. **Second facteur exigé** (`mfaRequired`) — dans ce cas **aucun cookie n'est
 *    posé** : le mot de passe seul ne suffit pas. Le client doit présenter le
 *    défi et le code TOTP sur `/api/auth/mfa/challenge`.
 *
 * Réponse identique pour un email inconnu et un mot de passe erroné : le
 * provider garantit déjà l'égalité du message et du type d'erreur, et cette
 * route se contente de la relayer sans l'enrichir.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'login', RATE_LIMITS.login);
  if (limited) return limited;

  const body = await parseBody(request, loginSchema);
  if (body.response) return body.response;

  try {
    const result = await getAuthProvider().login(body.data);

    if (isMfaChallenge(result)) {
      return NextResponse.json(
        {
          mfaRequired: true,
          challengeToken: result.challengeToken,
          expiresInSeconds: result.expiresInSeconds,
        },
        { status: 200 },
      );
    }

    return setSessionCookies(
      NextResponse.json({
        user: result.user,
        accessTokenExpiresIn: result.accessTokenExpiresIn,
        // Indique au client où rediriger : changement de mot de passe imposé.
        redirectTo: result.user.mustResetPassword ? '/forgot-password' : null,
      }),
      result,
    );
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/login');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}
