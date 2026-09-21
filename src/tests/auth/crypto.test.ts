/**
 * @jest-environment node
 *
 * Chiffrement des secrets au repos (T4.4).
 */
import {
  decryptSecret,
  encryptSecret,
  EncryptionKeyError,
  isEncryptionConfigured,
  looksEncrypted,
} from '@/lib/auth/crypto';

const KEY = Buffer.alloc(32, 3).toString('base64');

describe('chiffrement des secrets au repos', () => {
  const original = process.env.MFA_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.MFA_ENCRYPTION_KEY = KEY;
  });

  afterAll(() => {
    if (original === undefined) delete process.env.MFA_ENCRYPTION_KEY;
    else process.env.MFA_ENCRYPTION_KEY = original;
  });

  it('fait un aller-retour sur un secret', () => {
    const secret = 'JBSWY3DPEHPK3PXP';

    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it('produit un résultat différent à chaque appel (IV aléatoire)', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const premier = encryptSecret(secret);
    const second = encryptSecret(secret);

    // Deux chiffrements du même secret ne doivent pas être identiques : sinon,
    // comparer deux lignes de la base révélerait qu'elles portent le même secret.
    expect(premier).not.toBe(second);
    expect(decryptSecret(premier)).toBe(secret);
    expect(decryptSecret(second)).toBe(secret);
  });

  it('ne laisse jamais le secret en clair dans le résultat', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptSecret(secret);

    expect(encrypted).not.toContain(secret);
    expect(encrypted.startsWith('v1:')).toBe(true);
  });

  it('gère les caractères non ASCII et les chaînes longues', () => {
    const secret = `clé-accents-éàü-${'x'.repeat(500)}`;

    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it('rejette une valeur altérée', () => {
    // GCM authentifie le message : une modification doit être DÉTECTÉE, pas
    // produire un secret silencieusement corrompu (ce qui donnerait des codes
    // invalides impossibles à diagnostiquer).
    const encrypted = encryptSecret('JBSWY3DPEHPK3PXP');
    const parts = encrypted.split(':');

    const alteredCiphertext = [...parts];
    alteredCiphertext[2] = Buffer.from('autre chose').toString('base64');

    expect(() => decryptSecret(alteredCiphertext.join(':'))).toThrow(/illisible ou altérée/);

    const alteredTag = [...parts];
    alteredTag[3] = Buffer.alloc(16, 0).toString('base64');

    expect(() => decryptSecret(alteredTag.join(':'))).toThrow(/illisible ou altérée/);
  });

  it('rejette une valeur chiffrée avec une autre clé', () => {
    const encrypted = encryptSecret('JBSWY3DPEHPK3PXP');

    process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');

    expect(() => decryptSecret(encrypted)).toThrow(/illisible ou altérée/);
  });

  it('rejette un format inconnu', () => {
    for (const value of ['', 'clair', 'v2:a:b:c', 'v1:a:b', 'v1:a:b:c:d']) {
      expect(() => decryptSecret(value)).toThrow();
    }
  });

  describe('configuration de la clé', () => {
    it('refuse de chiffrer sans clé, avec un message actionnable', () => {
      delete process.env.MFA_ENCRYPTION_KEY;

      expect(() => encryptSecret('x')).toThrow(EncryptionKeyError);
      expect(() => encryptSecret('x')).toThrow(/MFA_ENCRYPTION_KEY est absent/);
      // Le message doit indiquer comment produire la clé.
      expect(() => encryptSecret('x')).toThrow(/randomBytes\(32\)/);
    });

    it('refuse une clé de mauvaise taille', () => {
      process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString('base64');

      expect(() => encryptSecret('x')).toThrow(/16 octet\(s\) décodé\(s\), 32 attendus/);
    });

    it('accepte une clé en hexadécimal comme en base64', () => {
      const hex = Buffer.alloc(32, 5).toString('hex');

      process.env.MFA_ENCRYPTION_KEY = hex;
      const encrypted = encryptSecret('secret-hex');

      process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 5).toString('base64');
      expect(decryptSecret(encrypted)).toBe('secret-hex');
    });

    it('signale si le chiffrement est configuré, sans lever', () => {
      expect(isEncryptionConfigured()).toBe(true);

      delete process.env.MFA_ENCRYPTION_KEY;
      expect(isEncryptionConfigured()).toBe(false);
    });
  });

  describe('looksEncrypted', () => {
    it('reconnaît une valeur chiffrée', () => {
      expect(looksEncrypted(encryptSecret('x'))).toBe(true);
    });

    it('rejette un secret en clair', () => {
      // Un secret TOTP Base32 ne doit jamais être pris pour une valeur chiffrée.
      expect(looksEncrypted('JBSWY3DPEHPK3PXP')).toBe(false);
      expect(looksEncrypted(null)).toBe(false);
      expect(looksEncrypted(undefined)).toBe(false);
      expect(looksEncrypted('')).toBe(false);
    });
  });
});
