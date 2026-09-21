/**
 * Stockage de fichiers (REQ-LRN-04) : supports de leçon, pièces jointes,
 * documents de la base documentaire.
 *
 * Le choix du transport est fait par `STORAGE_PROVIDER` : `local` (défaut,
 * système de fichiers) ou `s3` (tout service compatible S3, **sans SDK**).
 */

export interface StorageProvider {
  /**
   * Écrit un fichier et retourne son URL publique.
   * Écrase silencieusement un fichier existant de même clé (l'appelant choisit
   * une clé unique s'il veut éviter l'écrasement).
   */
  upload(key: string, data: Buffer, mimeType: string): Promise<string>;
  /** Lit un fichier. Lève si la clé est absente. */
  download(key: string): Promise<Buffer>;
  /** Supprime un fichier. Sans effet si la clé est déjà absente (idempotent). */
  delete(key: string): Promise<void>;
  /** Indique si une clé existe. */
  exists(key: string): Promise<boolean>;
  /** URL à laquelle le fichier est servi. Ne vérifie pas son existence. */
  getUrl(key: string): string;
}

/**
 * Normalise une clé de stockage et **interdit toute remontée de répertoire**.
 *
 * Une clé provient souvent d'un nom de fichier fourni par l'utilisateur : sans
 * ce filtre, une clé `../../.env` permettrait d'écrire ou de lire hors du
 * répertoire de stockage.
 */
export function sanitizeKey(key: string): string {
  const normalized = key.replace(/\\/g, '/').trim();

  if (normalized.length === 0) {
    throw new Error('Clé de stockage vide.');
  }
  if (normalized.startsWith('/')) {
    throw new Error(`Clé de stockage absolue refusée : "${key}".`);
  }
  if (normalized.split('/').some((segment) => segment === '..')) {
    throw new Error(`Clé de stockage contenant ".." refusée : "${key}".`);
  }

  return normalized.replace(/\/{2,}/g, '/');
}
