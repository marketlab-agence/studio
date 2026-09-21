/**
 * Encodage Base32 (RFC 4648), sans dépendance.
 *
 * Les secrets TOTP sont conventionnellement transmis en Base32 : c'est le format
 * que comprennent les applications d'authentification (Google Authenticator,
 * Authy, 1Password…).
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Encode un tampon en Base32, sans remplissage `=`. */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      output += ALPHABET[(value >> bits) & 31];
    }

    // Ne conserver que les bits non encore consommés : sans ce masque, `value`
    // croîtrait indéfiniment et les décalages deviendraient faux.
    value &= (1 << bits) - 1;
  }

  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Décode une chaîne Base32.
 * Tolère les minuscules, les espaces et le remplissage `=` (saisie manuelle).
 */
export function base32Decode(input: string): Buffer {
  const clean = input.replace(/\s+/g, '').replace(/=+$/, '').toUpperCase();

  if (clean.length === 0) {
    throw new Error('Secret Base32 vide.');
  }

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Caractère Base32 invalide : « ${char} ».`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 0xff);
    }

    value &= (1 << bits) - 1;
  }

  return Buffer.from(output);
}
