import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { loginSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, mapAuthError, parseBody } from '@/lib/auth/api';
import { setSessionCookies } from '@/lib/auth/cookies';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/login — connexion (REQ-AUTH-01, REQ-AUTH-06).
 *
 * Réponse identique pour un email inconnu et un mot de passe erroné : le
 * provider garantit déjà l'égalité du message et du type d'erreur, et cette
 * route se contente de la relayer sans l'enrichir.
 *
 * `user.mustResetPassword` est transmis au client : les comptes repris de
 * Firebase Auth se connectent, mais doivent définir un nouveau mot de passe
 * (REQ-AUTH-06).
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'login', RATE_LIMITS.login);
  if (limited) return limited;

  const body = await parseBody(request, loginSchema);
  if (body.response) return body.response;

  try {
    const session = await getAuthProvider().login(body.data);

    return setSessionCookies(
      NextResponse.json({
        user: session.user,
        accessTokenExpiresIn: session.accessTokenExpiresIn,
        // Indique au client où rediriger : changement de mot de passe imposé.
        redirectTo: session.user.mustResetPassword ? '/forgot-password' : null,
      }),
      session,
    );
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/login');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}
