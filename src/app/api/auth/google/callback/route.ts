import { NextResponse, type NextRequest } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { GoogleOAuthError, resolveGoogleProfile } from '@/lib/auth/google';
import {
  clearOAuthFlowCookies,
  OAUTH_REDIRECT_COOKIE,
  OAUTH_STATE_COOKIE,
  setSessionCookies,
} from '@/lib/auth/cookies';
import { safeRedirectPath } from '@/lib/auth/redirect';

/**
 * GET /api/auth/google/callback — retour de Google (REQ-AUTH-02, REQ-AUTH-07).
 *
 * C'est ce parcours qui permet aux **2 comptes Google importés** de se
 * reconnecter : ils n'ont pas de mot de passe local, la connexion Google est
 * donc leur seule voie d'accès sans réinitialisation.
 *
 * Ordre des vérifications, volontairement strict :
 *
 * 1. **État** (`state`) comparé au cookie posé au départ → protège du CSRF ;
 * 2. **Code** échangé auprès de Google, puis **signature du jeton d'identité
 *    vérifiée** contre le JWKS de Google → on ne fait jamais confiance à une
 *    valeur venue du navigateur ;
 * 3. **Adresse vérifiée** par Google → lier une adresse non vérifiée permettrait
 *    de prendre la main sur le compte existant portant cette adresse ;
 * 4. Liaison ou création du compte, puis ouverture de session.
 *
 * Les cookies du parcours sont effacés dans **tous** les cas : un `state` qui
 * survivrait à un échec pourrait être rejoué.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const fail = (reason: string, detail?: unknown): NextResponse => {
    if (detail) {
      // Même distinction que sur le démarrage du parcours : un refus de Google
      // ou un jeton invalide est une situation prévue, pas une panne.
      if (detail instanceof GoogleOAuthError) {
        console.warn(`[auth] callback Google — ${reason} : ${detail.message}`);
      } else {
        console.error(`[auth] callback Google — ${reason} :`, detail);
      }
    }

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('error', reason);

    return clearOAuthFlowCookies(NextResponse.redirect(url));
  };

  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const destination = safeRedirectPath(
    request.cookies.get(OAUTH_REDIRECT_COOKIE)?.value,
    '/dashboard',
  );

  // --- 1. État --------------------------------------------------------------
  const state = params.get('state');
  if (!expectedState || !state || state !== expectedState) {
    return fail('google_etat_invalide');
  }

  // Google signale un refus de consentement par `error`, sans code.
  if (params.get('error')) {
    return fail('google_refuse');
  }

  const code = params.get('code');
  if (!code) {
    return fail('google_sans_code');
  }

  // --- 2. Échange et vérification -------------------------------------------
  let profile;
  try {
    profile = await resolveGoogleProfile(code);
  } catch (error) {
    return fail(
      error instanceof GoogleOAuthError ? 'google_jeton_invalide' : 'google_erreur',
      error,
    );
  }

  // --- 3 et 4. Liaison ou création, puis session ----------------------------
  try {
    const session = await getAuthProvider().loginWithGoogle({
      subject: profile.subject,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    });

    const url = request.nextUrl.clone();
    url.pathname = destination;
    url.search = '';

    return setSessionCookies(clearOAuthFlowCookies(NextResponse.redirect(url)), session);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    // Un compte désactivé ou un conflit de rattachement n'est pas une panne : on
    // le signale distinctement pour que l'utilisateur sache à qui s'adresser.
    if (/désactivé/.test(message)) return fail('compte_desactive', error);
    if (/déjà rattaché/.test(message)) return fail('google_deja_rattache', error);

    return fail('google_connexion_impossible', error);
  }
}
