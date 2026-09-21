import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

/**
 * Jetons JWT (REQ-AUTH-03, REQ-AUTH-09, ADR 0002).
 *
 * `jose` et **non** `jsonwebtoken` : le middleware Next.js s'exécute dans le
 * runtime **Edge**, où les API Node (`crypto` natif, `Buffer`) ne sont pas
 * disponibles. `jose` s'appuie sur Web Crypto et fonctionne donc aussi bien
 * dans le middleware que dans les route handlers — un seul code de vérification
 * pour les deux.
 */

/** Durée de vie du jeton d'accès, en secondes. Défaut 15 minutes. */
export const ACCESS_TTL_SECONDS = Number(process.env.JWT_ACCESS_TTL ?? 900);

/** Durée de vie du refresh token, en secondes. Défaut 30 jours. */
export const REFRESH_TTL_SECONDS = Number(process.env.JWT_REFRESH_TTL ?? 2_592_000);

/** Émetteur et audience attendus : un jeton d'une autre application est rejeté. */
const ISSUER = 'katalyst';
const AUDIENCE = 'katalyst-app';

/** Contenu du jeton d'accès. */
export interface AccessTokenClaims {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET est absent. Générer une valeur aléatoire : ' +
        '`node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"`.',
    );
  }

  if (secret.length < 32) {
    throw new Error(
      `JWT_SECRET trop court (${secret.length} caractères) : 32 minimum pour HS256.`,
    );
  }

  // `jose` valide la clé par `instanceof Uint8Array`. Recopier les octets dans
  // un `Uint8Array` du realm courant évite un échec lorsque `TextEncoder`
  // provient d'un autre contexte d'exécution (cas de jsdom sous Jest) : les
  // deux objets portent les mêmes octets mais pas le même prototype.
  return new Uint8Array(new TextEncoder().encode(secret));
}

/** Signe un jeton d'accès. */
export async function signAccessToken(
  claims: AccessTokenClaims,
  options: { ttlSeconds?: number } = {},
): Promise<string> {
  const ttl = options.ttlSeconds ?? ACCESS_TTL_SECONDS;

  return new SignJWT({ ...claims } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
}

/**
 * Vérifie un jeton d'accès et retourne ses informations.
 * Lève si le jeton est expiré, mal signé, ou destiné à une autre application.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['HS256'],
  });

  const { userId, organizationId, role, email } = payload as unknown as AccessTokenClaims;

  if (!userId || !organizationId) {
    throw new Error('Jeton valide mais dépourvu d’identifiant d’utilisateur ou d’organisation.');
  }

  return { userId, organizationId, role, email };
}

/**
 * Vérifie un jeton sans lever d'exception.
 * Utile au middleware, où un jeton absent ou expiré est un cas normal.
 */
export async function tryVerifyAccessToken(
  token: string | undefined | null,
): Promise<AccessTokenClaims | null> {
  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}
