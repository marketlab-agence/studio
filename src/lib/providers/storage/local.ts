import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sanitizeKey, type StorageProvider } from '../storage';

/**
 * Stockage sur le système de fichiers (défaut).
 *
 * `mimeType` est **ignoré** : le système de fichiers ne conserve pas le type
 * MIME. Le service qui sert les fichiers le déduit de l'extension. Les
 * stockages objet (S3) l'utilisent, eux, pour poser `Content-Type`.
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly rootDir: string;

  constructor(rootDir = process.env.STORAGE_LOCAL_DIR ?? path.join(process.cwd(), '.storage')) {
    this.rootDir = path.resolve(rootDir);
  }

  /**
   * Résout la clé en chemin absolu et **vérifie que le résultat reste dans le
   * répertoire de stockage**. `sanitizeKey` filtre déjà `..` et les chemins
   * absolus ; ce second contrôle est la ceinture et les bretelles, car c'est la
   * frontière de sécurité réelle.
   */
  private resolve(key: string): string {
    const target = path.resolve(this.rootDir, sanitizeKey(key));

    if (target !== this.rootDir && !target.startsWith(this.rootDir + path.sep)) {
      throw new Error(`Clé de stockage hors du répertoire autorisé : "${key}".`);
    }

    return target;
  }

  async upload(key: string, data: Buffer, _mimeType: string): Promise<string> {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
    return this.getUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const target = this.resolve(key);

    try {
      return await readFile(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Fichier introuvable : "${key}".`);
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    // `force: true` : supprimer un fichier absent n'est pas une erreur.
    await rm(this.resolve(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await stat(this.resolve(key))).isFile();
    } catch {
      return false;
    }
  }

  /**
   * URL servie par la route `/api/files/[...key]`.
   * Chaque segment est encodé séparément pour que les `/` restent des
   * séparateurs de chemin.
   */
  getUrl(key: string): string {
    const prefix = process.env.STORAGE_URL_PREFIX ?? '/api/files/';
    const encoded = sanitizeKey(key).split('/').map(encodeURIComponent).join('/');
    return `${prefix}${encoded}`;
  }
}
