import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getStorageProvider, resetProviders, sanitizeKey } from '@/lib/providers';
import { LocalStorageProvider } from '@/lib/providers/storage/local';
import { S3StorageProvider } from '@/lib/providers/storage/s3';
import { sha256Hex } from '@/lib/providers/storage/sigv4';

/**
 * StorageProvider (T3.6).
 *
 * Le transport `local` est vérifié par un **vrai aller-retour sur disque** dans
 * un répertoire temporaire. Le transport `s3` est vérifié **structurellement**
 * (forme d'URL, en-têtes signés, empreinte du corps) : le calcul de signature
 * lui-même est prouvé séparément contre le vecteur officiel AWS
 * (`sigv4.test.ts`), faute de bucket réel sur lequel émettre.
 */

describe('sanitizeKey — frontière de sécurité', () => {
  it('accepte une clé normale et normalise les séparateurs', () => {
    expect(sanitizeKey('cours/chapitre-1/lecon.pdf')).toBe('cours/chapitre-1/lecon.pdf');
    expect(sanitizeKey('cours\\chapitre-1\\lecon.pdf')).toBe('cours/chapitre-1/lecon.pdf');
    expect(sanitizeKey('  espaces/autour.txt  ')).toBe('espaces/autour.txt');
    expect(sanitizeKey('double//barre.txt')).toBe('double/barre.txt');
  });

  it('refuse la remontée de répertoire', () => {
    expect(() => sanitizeKey('../secret.txt')).toThrow(/\.\./);
    expect(() => sanitizeKey('dossier/../../secret.txt')).toThrow(/\.\./);
    // Variante Windows : le filtre de la référence ne l'attrapait pas.
    expect(() => sanitizeKey('..\\secret.txt')).toThrow(/\.\./);
  });

  it('refuse un chemin absolu', () => {
    expect(() => sanitizeKey('/etc/passwd')).toThrow(/absolue/);
  });

  it('refuse une clé vide', () => {
    expect(() => sanitizeKey('')).toThrow(/vide/);
    expect(() => sanitizeKey('   ')).toThrow(/vide/);
  });
});

describe('LocalStorageProvider', () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'katalyst-storage-'));
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('fait un aller-retour complet sur disque', async () => {
    const provider = new LocalStorageProvider(root);
    const content = Buffer.from('contenu du support de leçon');

    const url = await provider.upload('cours/lecon-1.txt', content, 'text/plain');

    expect(await provider.exists('cours/lecon-1.txt')).toBe(true);
    expect((await provider.download('cours/lecon-1.txt')).toString()).toBe(content.toString());
    expect(url).toBe('/api/files/cours/lecon-1.txt');

    await provider.delete('cours/lecon-1.txt');
    expect(await provider.exists('cours/lecon-1.txt')).toBe(false);
  });

  it('crée les sous-répertoires manquants', async () => {
    const provider = new LocalStorageProvider(root);

    await provider.upload('a/b/c/profond.txt', Buffer.from('x'), 'text/plain');

    expect((await provider.download('a/b/c/profond.txt')).toString()).toBe('x');
  });

  it('échoue avec un message clair sur un fichier absent', async () => {
    const provider = new LocalStorageProvider(root);

    await expect(provider.download('inexistant.txt')).rejects.toThrow(/introuvable/);
  });

  it('est idempotent à la suppression', async () => {
    const provider = new LocalStorageProvider(root);

    await expect(provider.delete('jamais-cree.txt')).resolves.toBeUndefined();
  });

  it('refuse d’écrire hors du répertoire de stockage', async () => {
    const provider = new LocalStorageProvider(root);

    await expect(provider.upload('../evasion.txt', Buffer.from('x'), 'text/plain')).rejects.toThrow();
    await expect(provider.download('../../etc/passwd')).rejects.toThrow();
  });

  it('encode les segments d’URL sans casser les séparateurs', () => {
    const provider = new LocalStorageProvider(root);

    expect(provider.getUrl('cours/leçon 1.pdf')).toBe('/api/files/cours/le%C3%A7on%201.pdf');
  });

  it('n’est pas dupe d’un préfixe de répertoire voisin', async () => {
    // Un contrôle naïf par `startsWith` sans séparateur accepterait
    // `<root>-ailleurs`, qui est un répertoire DIFFÉRENT.
    const provider = new LocalStorageProvider(path.join(root, 'medias'));

    await expect(
      provider.upload('../medias-ailleurs/fuite.txt', Buffer.from('x'), 'text/plain'),
    ).rejects.toThrow();
  });
});

describe('S3StorageProvider', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  const validConfig = {
    S3_ENDPOINT: 'https://s3.eu-west-3.amazonaws.com',
    S3_REGION: 'eu-west-3',
    S3_BUCKET: 'katalyst-docs',
    S3_ACCESS_KEY: 'AKIDEXAMPLE',
    S3_SECRET_KEY: 'secret-de-test',
  };

  beforeEach(() => {
    for (const name of Object.keys(validConfig)) delete process.env[name];
    delete process.env.STORAGE_PROVIDER;
    resetProviders();
  });

  afterAll(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    resetProviders();
  });

  function provider(): S3StorageProvider {
    // Horodatage figé : la signature doit être reproductible.
    return new S3StorageProvider(() => new Date('2026-09-21T15:30:00.000Z'));
  }

  it('est choisi par STORAGE_PROVIDER=s3', () => {
    process.env.STORAGE_PROVIDER = 's3';
    resetProviders();
    expect(getStorageProvider()).toBeInstanceOf(S3StorageProvider);
  });

  it('utilise local par défaut et rejette une valeur inconnue', () => {
    expect(getStorageProvider()).toBeInstanceOf(LocalStorageProvider);

    process.env.STORAGE_PROVIDER = 'gcs';
    resetProviders();
    expect(() => getStorageProvider()).toThrow(/STORAGE_PROVIDER inconnu.*local, s3/);
  });

  it('refuse de travailler avec une configuration incomplète', async () => {
    process.env.S3_ENDPOINT = validConfig.S3_ENDPOINT;

    // Le message doit nommer les variables d'environnement manquantes.
    await expect(provider().upload('a.txt', Buffer.from('x'), 'text/plain')).rejects.toThrow(
      /S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY manquant/,
    );
    // S3_ENDPOINT étant renseigné, il ne doit PAS être listé.
    await expect(provider().upload('a.txt', Buffer.from('x'), 'text/plain')).rejects.not.toThrow(
      /S3_ENDPOINT manquant/,
    );
  });

  it('envoie un PUT signé, en adressage path-style', async () => {
    Object.assign(process.env, validConfig);

    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;

    const body = Buffer.from('support de leçon');
    await provider().upload('cours/leçon 1.pdf', body, 'application/pdf');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://s3.eu-west-3.amazonaws.com/katalyst-docs/cours/le%C3%A7on%201.pdf');
    expect(init.method).toBe('PUT');
    expect(init.headers['Content-Type']).toBe('application/pdf');

    // Horodatage compact, tel qu'exigé par SigV4.
    expect(init.headers['x-amz-date']).toBe('20260921T153000Z');
    // L'empreinte couvre le corps réellement transmis.
    expect(init.headers['x-amz-content-sha256']).toBe(sha256Hex(body));

    expect(init.headers.Authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20260921\/eu-west-3\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
    // `host` est signé mais non envoyé : fetch le pose lui-même.
    expect(init.headers.host).toBeUndefined();
  });

  it('télécharge et supprime en signant aussi les requêtes sans corps', async () => {
    Object.assign(process.env, validConfig);

    const emptyHash = sha256Hex('');
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer })
      .mockResolvedValueOnce({ ok: true, status: 204 });
    global.fetch = fetchMock as unknown as typeof fetch;

    const providerInstance = provider();

    expect(Array.from(await providerInstance.download('a.txt'))).toEqual([1, 2, 3]);
    await expect(providerInstance.delete('a.txt')).resolves.toBeUndefined();

    expect(fetchMock.mock.calls[0][1].method).toBe('GET');
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
    // Une requête sans corps signe l'empreinte de la chaîne vide.
    expect(fetchMock.mock.calls[0][1].headers['x-amz-content-sha256']).toBe(emptyHash);
    expect(fetchMock.mock.calls[1][1].headers['x-amz-content-sha256']).toBe(emptyHash);
  });

  it('sonde l’existence par HEAD, sans télécharger le fichier', async () => {
    Object.assign(process.env, validConfig);

    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await provider().exists('a.txt')).toBe(true);
    expect(fetchMock.mock.calls[0][1].method).toBe('HEAD');
  });

  it('tolère une suppression sur un objet déjà absent (404)', async () => {
    Object.assign(process.env, validConfig);

    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 404, text: async () => 'NoSuchKey' }) as unknown as typeof fetch;

    await expect(provider().delete('a.txt')).resolves.toBeUndefined();
  });

  it('expose le motif de refus du stockage', async () => {
    Object.assign(process.env, validConfig);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '<Error><Code>SignatureDoesNotMatch</Code></Error>',
    }) as unknown as typeof fetch;

    await expect(provider().upload('a.txt', Buffer.from('x'), 'text/plain')).rejects.toThrow(
      /HTTP 403[\s\S]*SignatureDoesNotMatch/,
    );
  });

  it('donne l’URL publique d’un objet', () => {
    Object.assign(process.env, validConfig);

    expect(provider().getUrl('cours/leçon 1.pdf')).toBe(
      'https://s3.eu-west-3.amazonaws.com/katalyst-docs/cours/le%C3%A7on%201.pdf',
    );
  });
});
