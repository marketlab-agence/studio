import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE } from '@/lib/auth/cookies';
import { tryVerifyAccessToken } from '@/lib/auth/jwt';
import { canAccessAdminUi, isAdminPath, isGuestOnlyPath, isProtectedPath } from '@/lib/auth/routes';
import { routing } from '@/i18n/routing';

const handleI18n = createMiddleware(routing);

/**
 * Retire le préfixe de locale d'un chemin, s'il est présent.
 *
 * ⚠️ **Indispensable, et c'est le piège de cette phase.** Les listes de routes de
 * `@/lib/auth/routes` (`PROTECTED_PREFIXES`, `ADMIN_PREFIXES`, `GUEST_ONLY_PREFIXES`)
 * sont écrites **sans** locale : `/dashboard`, `/admin`. Depuis que les routes sont
 * localisées, le chemin reçu est `/fr/dashboard`. Sans ce retrait, `isProtectedPath`
 * retournerait `false` et **la protection des pages privées tomberait** — un défaut
 * de sécurité silencieux, puisqu'aucune erreur ne serait levée.
 *
 * ⚠️ **Le test d'appartenance exige `/<locale>/` ou l'égalité exacte**, jamais un
 * simple `startsWith('/fr')` : `/frite` commence par `/fr` sans être une route
 * française. Le séparateur est ce qui distingue les deux.
 */
export function sansLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

/**
 * Protection des routes privées (T4.6, REQ-AUTH-09) et localisation (T8.3).
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
 *
 * ⚠️ **Ordre des opérations** : les contrôles d'authentification portent sur le
 * chemin **sans locale** (`cheminMetier`), et `handleI18n` n'est appelé qu'en
 * dernier. L'inverser ferait porter les contrôles sur un chemin déjà transformé
 * par next-intl, donc sur le mauvais chemin.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cheminMetier = sansLocale(pathname);

  const claims = await tryVerifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);

  if (!claims && isProtectedPath(cheminMetier)) {
    const url = request.nextUrl.clone();
    // La cible porte un préfixe de locale : la redirection traverse `handleI18n`
    // sans être réécrite. Le chemin mémorisé, lui, reste **sans locale**, pour
    // que le retour post-connexion le re-localise.
    url.pathname = `/${routing.defaultLocale}/login`;
    url.search = '';
    // La destination est dérivée du chemin courant, jamais d'un paramètre fourni
    // par le client : pas de redirection ouverte possible ici.
    url.searchParams.set('redirect', cheminMetier);
    return NextResponse.redirect(url);
  }

  if (claims && isGuestOnlyPath(cheminMetier)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}/dashboard`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Barrière de rôle sur l'interface d'administration.
  //
  // ⚠️ C'est un CONFORT, pas la sécurité : le rôle provient du jeton et peut
  // refléter une situation périmée (rétrogradation il y a moins de 15 minutes).
  // Le contrôle qui fait foi est dans les server actions (`@/lib/auth/server`),
  // seuls endroits où l'organisation et la base sont accessibles. Ici, on évite
  // surtout à un apprenant de tomber sur une page admin en erreur.
  if (claims && isAdminPath(cheminMetier) && !canAccessAdminUi(claims.role)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}/dashboard`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Dernier : `handleI18n` réécrit/redirige selon la locale. L'appeler avant les
  // contrôles aurait fait porter ceux-ci sur un chemin déjà transformé.
  return handleI18n(request);
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
