/**
 * Découpage des routes selon l'authentification.
 *
 * Source **unique**, partagée par le middleware (qui redirige) et par le
 * fournisseur d'authentification côté client (qui décide s'il doit attendre la
 * session avant de rendre la page). Deux listes séparées finiraient par
 * diverger, et une route protégée d'un côté ne le serait plus de l'autre.
 */

/** Préfixes exigeant une session. */
export const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/account',
  '/certificate',
  '/ai-assistant',
  '/subscribe',
  '/tutorial',
] as const;

/** Pages réservées aux visiteurs : un utilisateur connecté n'y a rien à faire. */
export const GUEST_ONLY_PREFIXES = ['/login', '/signup'] as const;

/**
 * Préfixes exigeant un rôle d'administration.
 *
 * Cette barrière est un **confort**, pas la sécurité : le middleware tourne en
 * Edge et ne lit que le jeton. Elle évite à un apprenant d'atteindre une page
 * admin et d'y voir une erreur. Le contrôle qui fait foi est dans les server
 * actions et les routes (`@/lib/auth/server`), seuls endroits où l'organisation
 * et la base sont accessibles.
 */
export const ADMIN_PREFIXES = ['/admin'] as const;

/** Rôles autorisés à atteindre l'interface d'administration. */
export const ADMIN_ROLES = ['Super Admin', 'Propriétaire', 'Admin', 'Modérateur'] as const;

function matches(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Indique si un chemin exige une session. */
export function isProtectedPath(pathname: string): boolean {
  return matches(pathname, PROTECTED_PREFIXES);
}

/** Indique si un chemin est réservé aux visiteurs non connectés. */
export function isGuestOnlyPath(pathname: string): boolean {
  return matches(pathname, GUEST_ONLY_PREFIXES);
}

/** Indique si un chemin relève de l'interface d'administration. */
export function isAdminPath(pathname: string): boolean {
  return matches(pathname, ADMIN_PREFIXES);
}

/** Indique si un rôle peut atteindre l'interface d'administration. */
export function canAccessAdminUi(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}
