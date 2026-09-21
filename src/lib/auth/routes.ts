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
