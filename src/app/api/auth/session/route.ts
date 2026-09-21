import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { tryVerifyAccessToken } from '@/lib/auth/jwt';
import { clearSessionCookies, REFRESH_COOKIE, setSessionCookies } from '@/lib/auth/cookies';
import { scopeFromClaims } from '@/lib/auth/api';

/**
 * POST /api/auth/session — amorce la session côté client.
 *
 * **Répond toujours 200**, avec `{ user }` ou `{ user: null }`. C'est
 * volontaire : « qui suis-je ? » → « personne » n'est pas une erreur, et un 401
 * ferait apparaître une requête en échec dans la console de **chaque visiteur
 * anonyme**, sur toutes les pages publiques.
 *
 * **POST et non GET** : l'opération peut faire **tourner** le refresh token
 * (elle rafraîchit la session si le jeton d'accès a expiré). Un GET qui modifie
 * l'état serait contraire à la sémantique HTTP et pourrait être mis en cache.
 *
 * Elle remplace deux allers-retours (`GET /me` puis `POST /refresh`) par un
 * seul, et surtout elle évite à l'appelant d'avoir à interpréter un 401.
 */
export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const readCookie = (name: string): string | undefined =>
    cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];

  try {
    // 1. Jeton d'accès encore valide : rien à faire, c'est le cas courant.
    const claims = await tryVerifyAccessToken(readCookie('katalyst_access'));
    if (claims) {
      const user = await getAuthProvider().currentUser(scopeFromClaims(claims), claims.userId);
      if (user && user.status === 'Actif') {
        return NextResponse.json({ user });
      }
      // Jeton valide mais compte disparu ou désactivé : on nettoie la session.
      return clearSessionCookies(NextResponse.json({ user: null }));
    }

    // 2. Jeton expiré : on tente le rafraîchissement, qui fait tourner le jeton.
    const refreshToken = readCookie(REFRESH_COOKIE);
    if (!refreshToken) {
      return NextResponse.json({ user: null });
    }

    const session = await getAuthProvider().refresh(refreshToken);

    return setSessionCookies(NextResponse.json({ user: session.user }), session);
  } catch (error) {
    // Session irrécupérable (jeton révoqué, réutilisation détectée, compte
    // désactivé) : on efface les cookies et on répond « personne ». Ce n'est pas
    // une panne, c'est une session qui n'existe plus.
    console.warn('[auth] POST /api/auth/session — session non restaurée :', error);
    return clearSessionCookies(NextResponse.json({ user: null }));
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Méthode non autorisée : utiliser POST.' }, { status: 405 });
}
