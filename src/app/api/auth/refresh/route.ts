import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { enforceRateLimit, errorResponse, mapAuthError } from '@/lib/auth/api';
import { clearSessionCookies, REFRESH_COOKIE, setSessionCookies } from '@/lib/auth/cookies';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/refresh — rotation du refresh token (REQ-AUTH-03).
 *
 * Le refresh token est lu dans le **cookie** et non dans le corps : il n'est
 * jamais exposé au JavaScript de la page, donc jamais accessible par XSS.
 *
 * Le provider révoque le jeton présenté et en émet un nouveau. Si un jeton déjà
 * révoqué est présenté, il révoque toutes les sessions de l'utilisateur : on
 * efface alors les cookies pour ne pas laisser le client en état de session
 * apparente.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'refresh', RATE_LIMITS.refresh);
  if (limited) return limited;

  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return errorResponse('Aucune session à rafraîchir.', 401);
  }

  try {
    const session = await getAuthProvider().refresh(refreshToken);

    return setSessionCookies(
      NextResponse.json({
        user: session.user,
        accessTokenExpiresIn: session.accessTokenExpiresIn,
      }),
      session,
    );
  } catch (error) {
    const response = mapAuthError(error, 'POST /api/auth/refresh');
    // Session invalide ou réutilisée : les cookies doivent disparaître, sinon le
    // client croirait encore disposer d'une session.
    return clearSessionCookies(response);
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}
