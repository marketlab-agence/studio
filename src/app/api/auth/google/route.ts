import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { buildGoogleAuthUrl, googleConfig, GoogleOAuthError } from '@/lib/auth/google';
import { clearOAuthFlowCookies, setOAuthFlowCookies } from '@/lib/auth/cookies';
import { safeRedirectPath } from '@/lib/auth/redirect';

/**
 * GET /api/auth/google — démarre la connexion Google (REQ-AUTH-02).
 *
 * Un **jeton d'état** aléatoire est posé dans un cookie `httpOnly` avant la
 * redirection. Google le renverra tel quel ; le rappel vérifie qu'il correspond.
 * Sans cette comparaison, un tiers pourrait faire aboutir une connexion à
 * l'insu de l'utilisateur (CSRF sur le rappel OAuth).
 *
 * La destination demandée (`?redirect=`) est également conservée en cookie
 * plutôt que transmise à Google : elle n'a aucune raison de transiter par un
 * tiers, et cela évite qu'elle soit altérée en chemin.
 */
export async function GET(request: NextRequest) {
  try {
    // Échoue tôt et clairement si la configuration manque, plutôt que de
    // rediriger vers un Google qui refusera.
    googleConfig();

    const state = randomBytes(32).toString('base64url');
    const destination = safeRedirectPath(request.nextUrl.searchParams.get('redirect'), '/dashboard');

    const response = NextResponse.redirect(buildGoogleAuthUrl(state));

    return setOAuthFlowCookies(response, state, destination);
  } catch (error) {
    // Une configuration absente est un état attendu en développement, pas une
    // panne : on le signale en une ligne, sans pile d'appels. Une pile complète
    // ferait croire à un plantage et noierait les vraies erreurs.
    if (error instanceof GoogleOAuthError) {
      console.warn(`[auth] GET /api/auth/google — ${error.message}`);
    } else {
      console.error('[auth] GET /api/auth/google — échec inattendu :', error);
    }

    // Un parcours OAuth à moitié commencé ne doit pas laisser de cookies.
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('error', 'google_indisponible');

    return clearOAuthFlowCookies(NextResponse.redirect(url));
  }
}
