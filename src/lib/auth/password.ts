import bcrypt from 'bcryptjs';

/**
 * Hachage des mots de passe (REQ-AUTH-01 : « bcrypt vérifié »).
 *
 * `bcryptjs` est une implémentation **JavaScript pure** : aucune compilation
 * native, donc pas de risque d'échec d'installation (les antécédents de
 * `node_modules` corrompu sur ce projet plaident pour ce choix). Le surcoût en
 * temps de calcul est acceptable : le hachage ne se produit qu'à la connexion.
 */

/**
 * Coût bcrypt.
 *
 * Mesuré sur ce projet avec `bcryptjs` 3 (Node 20, Windows) : 91 ms au coût 10,
 * 175 ms au coût 11, **287 ms au coût 12**. Le coût 12 est retenu : c'est
 * l'ordre de grandeur usuel (~250-300 ms), assez lent pour décourager une
 * attaque par force brute sans dégrader la connexion.
 *
 * La valeur est inscrite dans chaque hachage : l'augmenter plus tard n'invalide
 * pas les mots de passe existants.
 */
export const BCRYPT_COST = 12;

/** Longueur maximale acceptée par bcrypt (au-delà, l'entrée est tronquée). */
export const MAX_PASSWORD_BYTES = 72;

/** Longueur minimale exigée pour un mot de passe. */
export const MIN_PASSWORD_LENGTH = 12;

export class PasswordPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordPolicyError';
  }
}

/**
 * Vérifie qu'un mot de passe respecte la politique.
 *
 * bcrypt n'utilise que les **72 premiers octets** : un mot de passe plus long
 * serait silencieusement tronqué, donnant l'illusion d'une sécurité supérieure.
 * On refuse donc explicitement au-delà, plutôt que de tronquer sans le dire.
 */
export function assertPasswordPolicy(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new PasswordPolicyError(
      `Mot de passe trop court : ${password.length} caractère(s), ${MIN_PASSWORD_LENGTH} minimum.`,
    );
  }

  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new PasswordPolicyError(
      `Mot de passe trop long : bcrypt n’exploite que les ${MAX_PASSWORD_BYTES} premiers octets.`,
    );
  }
}

/** Hache un mot de passe. Le coût est inclus dans le résultat. */
export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Vérifie un mot de passe contre un hachage.
 *
 * Retourne `false` (et ne lève pas) si le hachage est absent ou illisible :
 * les comptes OAuth n'ont pas de mot de passe, et un hachage corrompu ne doit
 * pas produire d'erreur serveur révélant son état.
 */
export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;

  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Indique si un hachage est exploitable (diagnostic, sans exposer sa valeur). */
export function isUsableHash(hash: string | null): boolean {
  return typeof hash === 'string' && /^\$2[aby]?\$\d{2}\$/.test(hash);
}
