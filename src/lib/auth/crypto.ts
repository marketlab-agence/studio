import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Chiffrement des secrets au repos (AES-256-GCM).
 *
 * **Pourquoi chiffrer le secret TOTP ?** C'est un secret *partagé et durable* :
 * quiconque le lit peut générer des codes valides indéfiniment. Stocké en clair,
 * une fuite de la base — sauvegarde égarée, réplique mal configurée, injection
 * SQL — suffirait à annuler le second facteur, silencieusement et durablement.
 * La clé vivant hors de la base (variable d'environnement), une fuite de la
 * seule base ne compromet plus les secrets.
 *
 * AES-256-**GCM** et non CBC : GCM authentifie le message. Une valeur modifiée
 * en base est **rejetée** au déchiffrement au lieu de produire un secret
 * silencieusement corrompu — ce qui, pour un secret TOTP, se traduirait par des
 * codes invalides impossibles à diagnostiquer.
 *
 * Format versionné `v1:<iv>:<chiffré>:<étiquette>`, pour pouvoir changer
 * d'algorithme plus tard sans casser les valeurs existantes.
 */

const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96 bits : taille recommandée pour GCM
const KEY_BYTES = 32; // 256 bits

export class EncryptionKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionKeyError';
  }
}

/** Levée quand une valeur ne peut pas être déchiffrée (altérée, mauvaise clé, format inconnu). */
export class DecryptionError extends Error {
  constructor(message = 'Valeur chiffrée illisible ou altérée.') {
    super(message);
    this.name = 'DecryptionError';
  }
}

function encryptionKey(): Buffer {
  const raw = process.env.MFA_ENCRYPTION_KEY;

  if (!raw) {
    throw new EncryptionKeyError(
      'MFA_ENCRYPTION_KEY est absent : impossible de chiffrer les secrets. ' +
        'Générer une clé de 32 octets : ' +
        '`node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"`.',
    );
  }

  // Base64 ou hexadécimal selon la façon dont la clé a été produite.
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');

  if (key.length !== KEY_BYTES) {
    throw new EncryptionKeyError(
      `MFA_ENCRYPTION_KEY invalide : ${key.length} octet(s) décodé(s), ${KEY_BYTES} attendus.`,
    );
  }

  return key;
}

/** Indique si le chiffrement est configuré, sans lever. */
export function isEncryptionConfigured(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

/** Chiffre une chaîne. Chaque appel produit un résultat différent (IV aléatoire). */
export function encryptSecret(plaintext: string): string {
  const key = encryptionKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString('base64'), ciphertext.toString('base64'), tag.toString('base64')].join(
    ':',
  );
}

/**
 * Déchiffre une valeur produite par `encryptSecret`.
 * Lève `DecryptionError` si la valeur a été altérée ou si la clé ne correspond pas.
 */
export function decryptSecret(payload: string): string {
  const parts = payload.split(':');

  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new DecryptionError(`Format de valeur chiffrée inconnu : « ${payload.slice(0, 12)}… ».`);
  }

  const [, ivPart, ciphertextPart, tagPart] = parts;

  try {
    const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivPart, 'base64'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    if (error instanceof EncryptionKeyError) throw error;
    // Étiquette d'authentification invalide, ou clé différente : on ne devine pas.
    throw new DecryptionError();
  }
}

/** Indique si une valeur a le format d'une valeur chiffrée (sans la déchiffrer). */
export function looksEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(`${VERSION}:`);
}
