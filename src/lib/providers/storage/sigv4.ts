import { createHash, createHmac } from 'node:crypto';

/**
 * Signature AWS Signature Version 4 (SigV4), sans SDK.
 *
 * Isolée dans un module pur et synchrone : c'est la seule partie délicate de
 * l'accès S3 sans SDK, et elle est vérifiable contre les vecteurs de test
 * officiels d'AWS (voir `src/tests/providers/sigv4.test.ts`).
 *
 * Référence : « Signature Version 4 test suite » (get-vanilla).
 */

export interface SigV4Input {
  method: string;
  /** Chemin canonique, déjà encodé (ex. `/bucket/cle%20fichier.png`). */
  canonicalUri: string;
  /** Chaîne de requête canonique, triée, sans le `?`. Vide si aucune. */
  canonicalQuery: string;
  /** En-têtes à signer : nom **en minuscules** → valeur (espaces normalisés). */
  headers: Record<string, string>;
  /** Corps de la requête ; haché pour `x-amz-content-sha256`. */
  payload?: Buffer | string;
  accessKey: string;
  secretKey: string;
  region: string;
  service: string;
  /** Horodatage compact `YYYYMMDDTHHMMSSZ`. */
  amzDate: string;
}

export function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

/**
 * Normalise les noms d'en-têtes en minuscules.
 *
 * Indispensable : les noms d'en-têtes HTTP sont **insensibles à la casse**,
 * mais l'accès aux propriétés d'un objet JavaScript ne l'est pas. Sans cette
 * étape, un appelant passant `Host` ou `X-Amz-Date` verrait ses en-têtes
 * ignorés de la signature (valeur `undefined`).
 */
export function normalizeHeaderNames(headers: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    normalized[name.toLowerCase()] = value;
  }
  return normalized;
}

/**
 * Construit la requête canonique.
 * Les en-têtes sont triés par nom et leurs valeurs sont « trimées » avec les
 * espaces internes compactés — exigence explicite de la spécification.
 */
export function buildCanonicalRequest(input: SigV4Input, payloadHash: string): string {
  const headers = normalizeHeaderNames(input.headers);
  const names = Object.keys(headers).sort();

  const canonicalHeaders = names
    .map((name) => `${name}:${headers[name].trim().replace(/\s+/g, ' ')}\n`)
    .join('');

  const signedHeaders = names.join(';');

  return [
    input.method.toUpperCase(),
    input.canonicalUri,
    input.canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
}

/** Construit la chaîne à signer (`StringToSign`). */
export function buildStringToSign(
  amzDate: string,
  scope: string,
  canonicalRequestHash: string,
): string {
  return ['AWS4-HMAC-SHA256', amzDate, scope, canonicalRequestHash].join('\n');
}

/** Dérive la clé de signature par la chaîne HMAC imposée par AWS. */
export function deriveSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

export interface SigV4Result {
  authorization: string;
  signedHeaders: string;
  payloadHash: string;
}

/** Calcule l'en-tête `Authorization` d'une requête SigV4. */
export function signRequest(input: SigV4Input): SigV4Result {
  const payloadHash = sha256Hex(input.payload ?? '');

  // Les en-têtes sont signés **tels que fournis** : ce module n'en ajoute aucun.
  // C'est ce qui permet de le confronter tel quel aux vecteurs officiels AWS.
  // Les en-têtes obligatoires (`host`, `x-amz-date`, `x-amz-content-sha256`)
  // relèvent de l'appelant — voir `s3.ts`.
  const canonicalRequest = buildCanonicalRequest(input, payloadHash);
  const canonicalRequestHash = sha256Hex(canonicalRequest);

  const dateStamp = input.amzDate.slice(0, 8);
  const scope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
  const stringToSign = buildStringToSign(input.amzDate, scope, canonicalRequestHash);

  const signingKey = deriveSigningKey(input.secretKey, dateStamp, input.region, input.service);
  const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

  const signedHeaders = Object.keys(normalizeHeaderNames(input.headers)).sort().join(';');

  return {
    authorization:
      `AWS4-HMAC-SHA256 Credential=${input.accessKey}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    signedHeaders,
    payloadHash,
  };
}
