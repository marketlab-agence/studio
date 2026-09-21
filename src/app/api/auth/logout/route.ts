import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { clearSessionCookies, REFRESH_COOKIE } from '@/lib/auth/cookies';

/**
 * POST /api/auth/logout — déconnexion.
 *
 * Le refresh token est révoqué en base **avant** d'effacer les cookies : sinon
 * un jeton encore valide survivrait à la déconnexion.
 *
 * La route ne limite pas le débit et ne peut pas échouer côté client : se
 * déconnecter doit toujours aboutir, même avec un jeton inconnu ou expiré.
 */
export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await getAuthProvider().logout(refreshToken);
    } catch (error) {
      // Une révocation impossible ne doit pas empêcher la déconnexion : les
      // cookies sont effacés dans tous les cas. La cause est journalisée.
      console.error('[auth] POST /api/auth/logout — révocation échouée :', error);
    }
  }

  return clearSessionCookies(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  return NextResponse.json({ message: 'Méthode non autorisée : utiliser POST.' }, { status: 405 });
}
