import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Connexion Google (OAuth 2.0 « Authorization Code », REQ-AUTH-02).
 *
 * Deux précautions structurent ce module :
 *
 * 1. **Le jeton d'identité est vérifié, pas décodé.** Google renvoie un JWT
 *    signé ; on valide sa signature contre le **JWKS publié par Google**, ainsi
 *    que l'émetteur et l'audience. Se contenter de décoder le JWT reviendrait à
 *    faire confiance à une valeur fournie par le navigateur — n'importe qui
 *    pourrait alors forger une identité.
 * 2. **L'adresse doit être vérifiée par Google.** Une adresse non vérifiée
 *    permettrait de créer un compte Google avec l'email d'autrui et de prendre
 *    la main sur son compte existant, puisque la liaison se fait par email.
 */

const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const JWKS_URL = new URL('https://www.googleapis.com/oauth2/v3/certs');

/** Portées demandées : identité seule, aucune donnée métier Google. */
const SCOPES = ['openid', 'email', 'profile'];

export class GoogleOAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleOAuthError';
  }
}

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Lit la configuration, ou échoue avec un message actionnable.
 *
 * On refuse d'échouer silencieusement : une connexion Google mal configurée doit
 * le dire, sinon l'utilisateur voit un bouton qui ne fait rien.
 */
export function googleConfig(): GoogleConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const missing = [
    ['GOOGLE_CLIENT_ID', clientId],
    ['GOOGLE_CLIENT_SECRET', clientSecret],
    ['GOOGLE_REDIRECT_URI', redirectUri],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new GoogleOAuthError(
      `Connexion Google mal configurée : ${missing.join(', ')} manquant(s).`,
    );
  }

  return { clientId: clientId!, clientSecret: clientSecret!, redirectUri: redirectUri! };
}

/** Indique si la connexion Google est configurée, sans lever. */
export function isGoogleConfigured(): boolean {
  try {
    googleConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Construit l'URL de consentement Google.
 *
 * `state` est un jeton aléatoire que l'appelant doit conserver puis comparer au
 * retour : sans lui, un tiers pourrait faire aboutir une connexion à l'insu de
 * l'utilisateur (CSRF sur le rappel OAuth).
 */
export function buildGoogleAuthUrl(state: string, options: { prompt?: string } = {}): string {
  const { clientId, redirectUri } = googleConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    state,
    // `prompt=select_account` laisse choisir le compte plutôt que de réutiliser
    // silencieusement la session Google en cours — utile sur un poste partagé.
    ...(options.prompt ? { prompt: options.prompt } : {}),
    // Indispensable pour obtenir un refresh token côté Google ; sans usage ici,
    // mais évite un second consentement si on en a besoin plus tard.
    access_type: 'online',
  });

  return `${AUTHORIZATION_ENDPOINT}?${params.toString()}`;
}

export interface GoogleProfile {
  /** Identifiant **stable** du compte Google. */
  subject: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

/** Échange le code d'autorisation contre un jeton d'identité. */
async function exchangeCodeForIdToken(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = googleConfig();

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    // Le corps d'erreur de Google aide au diagnostic ; il ne contient ni le
    // secret ni le code.
    throw new GoogleOAuthError(
      `Google a refusé l’échange de code (HTTP ${response.status}) : ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as { id_token?: string };
  if (!payload.id_token) {
    throw new GoogleOAuthError('Google n’a pas renvoyé de jeton d’identité.');
  }

  return payload.id_token;
}

/**
 * Vérifie le jeton d'identité et en extrait le profil.
 *
 * La signature est validée contre le JWKS de Google, ainsi que l'émetteur et
 * l'audience : un jeton émis pour une **autre application** est donc rejeté.
 */
async function verifyIdToken(idToken: string): Promise<GoogleProfile> {
  const { clientId } = googleConfig();

  const jwks = createRemoteJWKSet(JWKS_URL);

  let payload: Record<string, unknown>;
  try {
    ({ payload } = await jwtVerify(idToken, jwks, {
      issuer: ISSUERS,
      audience: clientId,
    }));
  } catch (error) {
    throw new GoogleOAuthError(
      `Jeton d’identité Google invalide : ${error instanceof Error ? error.message : 'signature non vérifiable'}.`,
    );
  }

  const subject = payload.sub;
  const email = payload.email;
  const emailVerified = payload.email_verified;

  if (typeof subject !== 'string' || !subject) {
    throw new GoogleOAuthError('Jeton d’identité dépourvu d’identifiant de compte.');
  }

  if (typeof email !== 'string' || !email) {
    throw new GoogleOAuthError(
      'Google n’a pas fourni d’adresse email. Vérifier que la portée « email » est autorisée.',
    );
  }

  if (emailVerified !== true) {
    // Refus explicite : lier une adresse non vérifiée permettrait de prendre la
    // main sur le compte existant portant cette adresse.
    throw new GoogleOAuthError(
      'L’adresse Google n’est pas vérifiée : connexion refusée par précaution.',
    );
  }

  return {
    subject,
    email: email.toLowerCase(),
    emailVerified: true,
    name: typeof payload.name === 'string' && payload.name ? payload.name : email,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  };
}

/** Exécute le rappel complet : échange du code, puis vérification du jeton. */
export async function resolveGoogleProfile(code: string): Promise<GoogleProfile> {
  return verifyIdToken(await exchangeCodeForIdToken(code));
}
