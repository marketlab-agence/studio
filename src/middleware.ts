import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE } from '@/lib/auth/cookies';
import { tryVerifyAccessToken } from '@/lib/auth/jwt';
import { isGuestOnlyPath, isProtectedPath } from '@/lib/auth/routes';

/**
 * Protection des routes privées (T4.6, REQ-AUTH-09).
 *
 * ⚠️ Ce middleware s'exécute dans le runtime **Edge** : il ne peut pas
 * interroger PostgreSQL. Il vérifie donc le **jeton d'accès** (sans état, via
 * `jose`), ce qui suffit à bloquer un accès non authentifié.
 *
 * Le **refresh token n'est pas visible ici**, et c'est voulu : son cookie est
 * restreint à `path: /api/auth`. Une session expirée est donc traitée comme une
 * absence de session — le client la restaure via `POST /api/auth/session`, qui
 * est la seule route à recevoir ce cookie.
 *
 * Conséquence à garder en tête : ce middleware est un **filtre**, pas une
 * frontière d'autorisation. Le contrôle réel (rôle, appartenance à
 * l'organisation) se fait dans chaque route et server action, où la base est
 * accessible.
 *
 * Le découpage des routes vient de `@/lib/auth/routes` : la même source sert au
 * fournisseur d'authentification côté client, ce qui évite que les deux listes
 * divergent.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const claims = await tryVerifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);

  if (!claims && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    // La destination est dérivée du chemin courant, jamais d'un paramètre fourni
    // par le client : pas de redirection ouverte possible ici.
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (claims && isGuestOnlyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Tout sauf :
     * - `/api/*` : chaque route gère sa propre authentification (et les routes
     *   d'auth doivent rester joignables sans session) ;
     * - les ressources internes de Next ;
     * - les fichiers statiques.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|gif|webp|ico|css|js|map|woff2?|ttf)$).*)',
  ],
};
