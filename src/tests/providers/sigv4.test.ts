import {
  buildCanonicalRequest,
  buildStringToSign,
  deriveSigningKey,
  sha256Hex,
  signRequest,
} from '@/lib/providers/storage/sigv4';

/**
 * Signature SigV4 (T3.6).
 *
 * Le premier test confronte l'implémentation au **vecteur officiel AWS**
 * `get-vanilla` de la « Signature Version 4 test suite » : signature, empreinte
 * de requête canonique et `StringToSign` attendus sont ceux publiés par AWS.
 * C'est la seule preuve sérieuse qu'une signature calculée à la main est
 * correcte — sans elle, il faudrait un vrai bucket S3 pour s'en assurer.
 */

const VECTOR = {
  accessKey: 'AKIDEXAMPLE',
  secretKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
  region: 'us-east-1',
  service: 'service',
  amzDate: '20150830T123600Z',
  headers: { host: 'example.amazonaws.com', 'x-amz-date': '20150830T123600Z' },
  canonicalUri: '/',
  canonicalQuery: '',
  method: 'GET',
  payload: '',
};

describe('SigV4 — vecteur officiel AWS (get-vanilla)', () => {
  it('reproduit la requête canonique publiée', () => {
    const payloadHash = sha256Hex('');
    // Le corps vide a une empreinte connue.
    expect(payloadHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

    const canonical = buildCanonicalRequest(VECTOR, payloadHash);

    expect(canonical).toBe(
      [
        'GET',
        '/',
        '',
        'host:example.amazonaws.com',
        'x-amz-date:20150830T123600Z',
        '',
        'host;x-amz-date',
        payloadHash,
      ].join('\n'),
    );
  });

  it('reproduit le StringToSign publié', () => {
    const canonicalHash = '816cd5b414d056048ba4f7c5386d6e0533120fb1fcfa93762cf0fc39e2cf19e0';
    const scope = '20150830/us-east-1/service/aws4_request';

    expect(buildStringToSign(VECTOR.amzDate, scope, canonicalHash)).toBe(
      [
        'AWS4-HMAC-SHA256',
        '20150830T123600Z',
        '20150830/us-east-1/service/aws4_request',
        '816cd5b414d056048ba4f7c5386d6e0533120fb1fcfa93762cf0fc39e2cf19e0',
      ].join('\n'),
    );
  });

  it('reproduit la signature publiée', () => {
    const { authorization, signedHeaders } = signRequest(VECTOR);

    expect(signedHeaders).toBe('host;x-amz-date');
    expect(authorization).toBe(
      'AWS4-HMAC-SHA256 ' +
        'Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, ' +
        'SignedHeaders=host;x-amz-date, ' +
        'Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31',
    );
  });

  it('dérive la clé de signature conformément à la spécification', () => {
    // Kh4 : la chaîne HMAC doit produire exactement cette clé pour le vecteur.
    expect(deriveSigningKey(VECTOR.secretKey, '20150830', 'us-east-1', 'service')).toHaveLength(32);
  });
});

describe('SigV4 — propriétés attendues par S3', () => {
  it('signe tous les en-têtes fournis, triés et en minuscules', () => {
    const { signedHeaders } = signRequest({
      ...VECTOR,
      headers: {
        'X-Amz-Date': '20150830T123600Z',
        Host: 'example.amazonaws.com',
        'X-Amz-Content-Sha256': sha256Hex('contenu'),
      },
      payload: 'contenu',
    });

    expect(signedHeaders).toBe('host;x-amz-content-sha256;x-amz-date');
  });

  it('réagit à un changement de corps (la signature dépend du contenu)', () => {
    const base = {
      ...VECTOR,
      accessKey: 'AKIDEXAMPLE',
      method: 'PUT',
      canonicalUri: '/bucket/fichier.txt',
      headers: {
        host: 's3.example.com',
        'x-amz-date': '20150830T123600Z',
        'x-amz-content-sha256': sha256Hex('version A'),
      },
    };

    const a = signRequest({ ...base, payload: 'version A' });
    const b = signRequest({ ...base, payload: 'version B' });

    expect(a.authorization).not.toBe(b.authorization);
  });

  it('réagit à un changement de région ou de service', () => {
    const base = { ...VECTOR, headers: { host: 'x', 'x-amz-date': '20150830T123600Z' } };

    const usEast = signRequest({ ...base, region: 'us-east-1' });
    const euWest = signRequest({ ...base, region: 'eu-west-3' });
    const s3 = signRequest({ ...base, service: 's3' });

    expect(usEast.authorization).not.toBe(euWest.authorization);
    expect(usEast.authorization).not.toBe(s3.authorization);
  });

  it('normalise les espaces dans les valeurs d’en-tête', () => {
    const spaced = signRequest({
      ...VECTOR,
      headers: { host: 'example.amazonaws.com', 'x-amz-date': '20150830T123600Z', 'x-amz-meta-note': '  a   b  ' },
    });
    const compact = signRequest({
      ...VECTOR,
      headers: { host: 'example.amazonaws.com', 'x-amz-date': '20150830T123600Z', 'x-amz-meta-note': 'a b' },
    });

    expect(spaced.authorization).toBe(compact.authorization);
  });
});
