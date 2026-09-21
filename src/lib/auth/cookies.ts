import type { NextResponse } from 'next/server';
import type { Session } from '@/lib/providers/auth';

/**
 * Cookies de session (design.md §4, REQ-AUTH-09).
 *
 * Deux cookies plutôt qu'un :
 *
 * - le **jeton d'accès** est envoyé à chaque requête (`path: /`) ;
 * - le **refresh token** est restreint à `path: /api/auth` : il n'est donc
 *   transmis que là où il sert. Un refresh token volé par une requête de page
 *   ordinaire ne l'est plus, puisqu'il n'y circule jamais.
 *
 * Les deux sont `httpOnly` : aucun script de la page ne peut les lire, ce qui
 * neutralise le vol par XSS.
 */

export const ACCESS_COOKIE = 'katalyst_access';
export const REFRESH_COOKIE = 'katalyst_refresh';

/** Chemin du refresh token : uniquement les routes d'authentification. */
export const REFRESH_COOKIE_PATH = '/api/auth';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function accessCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    // `secure` en production seulement : en développement le serveur est en
    // HTTP, et un cookie `secure` ne serait jamais posé.
    secure: isProduction(),
    // `lax` et non `strict` : le jeton d'accès doit accompagner la navigation
    // de premier niveau (arrivée sur une page protégée depuis un lien).
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

function refreshCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    // `strict` : le refresh token n'a aucune raison de voyager depuis un autre
    // site. C'est la première barrière contre le CSRF sur cette route.
    sameSite: 'strict' as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeSeconds,
  };
}

/** Pose les deux cookies de session sur une réponse. */
export function setSessionCookies<T extends NextResponse>(response: T, session: Session): T {
  response.cookies.set(ACCESS_COOKIE, session.accessToken, accessCookieOptions(session.accessTokenExpiresIn));
  // Durée du cookie de refresh : volontairement généreuse (le jeton en base
  // porte sa propre expiration, qui fait foi).
  response.cookies.set(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions(60 * 60 * 24 * 30));
  return response;
}

/** Efface les deux cookies de session. */
export function clearSessionCookies<T extends NextResponse>(response: T): T {
  response.cookies.set(ACCESS_COOKIE, '', { ...accessCookieOptions(0), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...refreshCookieOptions(0), maxAge: 0 });
  return response;
}
