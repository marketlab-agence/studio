/**
 * Constantes de la politique de mot de passe.
 *
 * ⚠️ Module **sans dépendance** : il est importé par des composants clients
 * (formulaires d'inscription, de réinitialisation) pour afficher les contraintes
 * à l'utilisateur. Importer `password.ts` à leur place embarquerait `bcryptjs`
 * dans le bundle navigateur — une bibliothèque de hachage n'a rien à y faire.
 */

/** Longueur minimale exigée pour un mot de passe. */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Longueur maximale, en **octets**.
 *
 * bcrypt n'exploite que les 72 premiers octets : au-delà, l'entrée est tronquée
 * sans avertissement. La limite porte donc sur les octets et non les caractères
 * (40 caractères accentués occupent 80 octets).
 */
export const MAX_PASSWORD_BYTES = 72;
