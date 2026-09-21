import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { base32Decode, base32Encode } from './base32';

/**
 * TOTP — mots de passe à usage unique fondés sur le temps (RFC 6238),
 * construits sur HOTP (RFC 4226). Sans dépendance.
 *
 * L'implémentation est confrontée aux **vecteurs de test publiés par la RFC
 * 6238** (annexe B) : c'est la seule preuve sérieuse qu'un calcul
 * cryptographique écrit à la main est correct.
 */

export type TotpAlgorithm = 'sha1' | 'sha256' | 'sha512';

export interface TotpOptions {
  /** Nombre de chiffres du code. Défaut 6 (usage courant). */
  digits?: number;
  /** Durée de validité d'un code, en secondes. Défaut 30. */
  period?: number;
  algorithm?: TotpAlgorithm;
}

/** Taille du secret recommandée par la RFC 4226 (160 bits). */
export const TOTP_SECRET_BYTES = 20;

/** Durée de validité d'un code, en secondes. */
export const TOTP_PERIOD_SECONDS = 30;

/** Nombre de chiffres produit pour l'authentification à deux facteurs. */
export const TOTP_DIGITS = 6;

/** Génère un secret aléatoire, encodé en Base32 (prêt à être présenté à l'utilisateur). */
export function generateTotpSecret(bytes: number = TOTP_SECRET_BYTES): string {
  return base32Encode(randomBytes(bytes));
}

/**
 * HOTP (RFC 4226) : tronque dynamiquement un HMAC.
 * Fonction de base du TOTP, exposée pour être testable isolément.
 */
export function hotp(
  secret: Buffer,
  counter: number,
  options: TotpOptions = {},
): string {
  const digits = options.digits ?? TOTP_DIGITS;
  const algorithm = options.algorithm ?? 'sha1';

  if (!Number.isSafeInteger(counter) || counter < 0) {
    throw new Error(`Compteur HOTP invalide : ${counter}.`);
  }

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac(algorithm, secret).update(counterBuffer).digest();

  // « Troncature dynamique » (RFC 4226 §5.3) : les 4 bits de poids faible du
  // dernier octet donnent l'offset des 4 octets à extraire.
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];

  return (binary % 10 ** digits).toString().padStart(digits, '0');
}

/** Compteur de pas de temps pour un instant donné. */
export function timeStep(timestampSeconds: number, period: number = TOTP_PERIOD_SECONDS): number {
  return Math.floor(timestampSeconds / period);
}

/** Code TOTP attendu pour un instant donné. */
export function totp(
  secretBase32: string,
  timestampSeconds: number = Math.floor(Date.now() / 1000),
  options: TotpOptions = {},
): string {
  const period = options.period ?? TOTP_PERIOD_SECONDS;
  return hotp(base32Decode(secretBase32), timeStep(timestampSeconds, period), options);
}

/**
 * Vérifie un code TOTP en tolérant une dérive d'horloge.
 *
 * `window` = nombre de pas acceptés de part et d'autre de l'instant courant.
 * La valeur par défaut (1) couvre ±30 s : c'est le réglage usuel, qui absorbe
 * une horloge légèrement décalée sans ouvrir une fenêtre exploitable.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  options: TotpOptions & { timestampSeconds?: number; window?: number } = {},
): boolean {
  const digits = options.digits ?? TOTP_DIGITS;
  const period = options.period ?? TOTP_PERIOD_SECONDS;
  const window = options.window ?? 1;

  // Un code de mauvaise longueur est refusé avant tout calcul.
  if (!new RegExp(`^\\d{${digits}}$`).test(code)) return false;

  const secret = base32Decode(secretBase32);
  const currentStep = timeStep(options.timestampSeconds ?? Math.floor(Date.now() / 1000), period);

  // Tous les pas sont évalués : la comparaison n'est pas court-circuitée, ce qui
  // évite de révéler par le temps de réponse lequel des pas correspond.
  let matched = false;
  for (let offset = -window; offset <= window; offset++) {
    const step = currentStep + offset;
    if (step < 0) continue;

    const candidate = Buffer.from(hotp(secret, step, { ...options, digits }), 'utf8');
    const provided = Buffer.from(code, 'utf8');
    if (candidate.length === provided.length && timingSafeEqual(candidate, provided)) {
      matched = true;
    }
  }

  return matched;
}

/**
 * URI `otpauth://` à encoder en QR code pour l'application d'authentification.
 * Voir https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 */
export function buildTotpUri(params: {
  secretBase32: string;
  accountName: string;
  issuer: string;
  options?: TotpOptions;
}): string {
  const digits = params.options?.digits ?? TOTP_DIGITS;
  const period = params.options?.period ?? TOTP_PERIOD_SECONDS;
  const algorithm = (params.options?.algorithm ?? 'sha1').toUpperCase();

  const label = encodeURIComponent(`${params.issuer}:${params.accountName}`);
  const query = new URLSearchParams({
    secret: params.secretBase32,
    issuer: params.issuer,
    algorithm,
    digits: String(digits),
    period: String(period),
  });

  return `otpauth://totp/${label}?${query.toString()}`;
}
