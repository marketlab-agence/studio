import { sanitizeKey, type StorageProvider } from '../storage';
import { sha256Hex, signRequest } from './sigv4';

/**
 * Stockage compatible S3 (AWS S3, GCP Cloud Storage, Azure Blob, MinIO,
 * Scaleway, OVH…), **sans SDK** : tout passe par `fetch` et une signature
 * SigV4 calculée localement (`./sigv4.ts`).
 *
 * Adressage « path-style » (`endpoint/bucket/clé`) : c'est la forme que
 * comprennent aussi bien S3 qu'un MinIO auto-hébergé. L'adressage « virtual
 * hosted style » (`bucket.endpoint`) exigerait un DNS par bucket.
 *
 * Le `Host` n'est **pas** posé à la main : la signature couvre l'hôte de
 * l'endpoint, et `fetch` enverra exactement celui-là. Forcer l'en-tête `Host`
 * est interdit par la spécification Fetch.
 *
 * Variables : `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`,
 * `S3_SECRET_KEY`.
 */

interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}

export class S3StorageProvider implements StorageProvider {
  private readonly now: () => Date;

  /** `now` est injectable pour rendre l'horodatage signé déterministe en test. */
  constructor(now: () => Date = () => new Date()) {
    this.now = now;
  }

  private config(): S3Config {
    const endpoint = (process.env.S3_ENDPOINT ?? '').replace(/\/+$/, '');
    const region = process.env.S3_REGION ?? '';
    const bucket = process.env.S3_BUCKET ?? '';
    const accessKey = process.env.S3_ACCESS_KEY ?? '';
    const secretKey = process.env.S3_SECRET_KEY ?? '';

    // Le message doit nommer les **variables d'environnement** à renseigner,
    // pas les champs internes : c'est ce que l'exploitant a sous les yeux.
    const missing = [
      ['S3_ENDPOINT', endpoint],
      ['S3_REGION', region],
      ['S3_BUCKET', bucket],
      ['S3_ACCESS_KEY', accessKey],
      ['S3_SECRET_KEY', secretKey],
    ]
      .filter(([, value]) => value === '')
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        `Stockage S3 mal configuré : ${missing.join(', ')} manquant(s). ` +
          'Renseigner ces variables, ou choisir STORAGE_PROVIDER=local.',
      );
    }

    return { endpoint, region, bucket, accessKey, secretKey };
  }

  /** Horodatage compact `YYYYMMDDTHHMMSSZ` attendu par SigV4. */
  private amzDate(): string {
    return this.now().toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  private objectUrl(config: S3Config, key: string): string {
    const encoded = sanitizeKey(key).split('/').map(encodeURIComponent).join('/');
    return `${config.endpoint}/${config.bucket}/${encoded}`;
  }

  /**
   * Émet une requête signée.
   * Renvoie la réponse brute : chaque appelant décide du traitement d'erreur.
   */
  private async signedFetch(
    method: 'GET' | 'PUT' | 'DELETE' | 'HEAD',
    key: string,
    body?: Buffer,
    contentType?: string,
  ): Promise<Response> {
    const config = this.config();
    const amzDate = this.amzDate();
    const payloadHash = sha256Hex(body ?? '');

    // En-têtes signés : triés, en minuscules, sans le `Host` (posé par fetch).
    const headers: Record<string, string> = {
      host: new URL(config.endpoint).host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    const { authorization } = signRequest({
      method,
      canonicalUri: `/${config.bucket}/${sanitizeKey(key).split('/').map(encodeURIComponent).join('/')}`,
      canonicalQuery: '',
      headers,
      payload: body,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
      service: 's3',
      amzDate,
    });

    // `host` est volontairement retiré des en-têtes envoyés : fetch le pose.
    const { host: _host, ...unsigned } = headers;

    return fetch(this.objectUrl(config, key), {
      method,
      headers: {
        ...unsigned,
        Authorization: authorization,
        ...(contentType ? { 'Content-Type': contentType } : {}),
      },
      body: body ? new Uint8Array(body) : undefined,
    });
  }

  private static async explainFailure(action: string, response: Response): Promise<Error> {
    const detail = await response.text().catch(() => '');
    return new Error(
      `S3 ${action} refusé (HTTP ${response.status}) : ${detail.slice(0, 300) || 'sans détail'}`,
    );
  }

  async upload(key: string, data: Buffer, mimeType: string): Promise<string> {
    const response = await this.signedFetch('PUT', key, data, mimeType);
    if (!response.ok) throw await S3StorageProvider.explainFailure('upload', response);
    return this.getUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.signedFetch('GET', key);
    if (!response.ok) throw await S3StorageProvider.explainFailure('download', response);
    return Buffer.from(await response.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    const response = await this.signedFetch('DELETE', key);
    // 404 : l'objet est déjà absent, la suppression est idempotente.
    if (!response.ok && response.status !== 404) {
      throw await S3StorageProvider.explainFailure('delete', response);
    }
  }

  /**
   * `HEAD` plutôt que `GET` : sur un stockage objet, `GET` transférerait tout le
   * fichier juste pour répondre par un booléen.
   */
  async exists(key: string): Promise<boolean> {
    const response = await this.signedFetch('HEAD', key);
    return response.ok;
  }

  getUrl(key: string): string {
    return this.objectUrl(this.config(), key);
  }
}
