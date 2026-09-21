import { base32Decode, base32Encode } from '@/lib/auth/base32';
import { buildTotpUri, generateTotpSecret, hotp, totp, verifyTotp } from '@/lib/auth/totp';

/**
 * TOTP / HOTP (T4.4, REQ-AUTH-04).
 *
 * L'implémentation est confrontée aux **vecteurs de test publiés par les RFC** :
 * RFC 4226 annexe D pour HOTP, RFC 6238 annexe B pour TOTP. Un calcul
 * cryptographique écrit à la main n'est crédible qu'à ce prix.
 */

describe('Base32 (RFC 4648)', () => {
  it('reproduit les vecteurs publiés', () => {
    // Sans remplissage `=` : c'est le format des secrets TOTP.
    const vectors: [string, string][] = [
      ['f', 'MY'],
      ['fo', 'MZXQ'],
      ['foo', 'MZXW6'],
      ['foob', 'MZXW6YQ'],
      ['fooba', 'MZXW6YTB'],
      ['foobar', 'MZXW6YTBOI'],
    ];

    for (const [decoded, encoded] of vectors) {
      expect(base32Encode(Buffer.from(decoded))).toBe(encoded);
      expect(base32Decode(encoded).toString()).toBe(decoded);
    }
  });

  it('fait un aller-retour sur des données binaires', () => {
    const bytes = Buffer.from(Array.from({ length: 64 }, (_, i) => i * 3 % 256));

    expect(base32Decode(base32Encode(bytes)).equals(bytes)).toBe(true);
  });

  it('tolère minuscules, espaces et remplissage', () => {
    expect(base32Decode('mzxw 6ytb oi').toString()).toBe('foobar');
    expect(base32Decode('MZXW6YTB').toString()).toBe('fooba');
  });

  it('refuse un caractère hors alphabet', () => {
    // 1, 0, 8 et 9 sont exclus de l'alphabet Base32 (confusion avec I/O/B).
    expect(() => base32Decode('MZXW1')).toThrow(/invalide/);
    expect(() => base32Decode('')).toThrow(/vide/);
  });
});

describe('HOTP (RFC 4226, annexe D)', () => {
  // Secret ASCII « 12345678901234567890 », codes à 6 chiffres.
  const secret = Buffer.from('12345678901234567890', 'ascii');

  it('reproduit les dix vecteurs publiés', () => {
    const expected = [
      '755224', '287082', '359152', '969429', '338314',
      '254676', '287922', '162583', '399871', '520489',
    ];

    expected.forEach((code, counter) => {
      expect(hotp(secret, counter, { digits: 6 })).toBe(code);
    });
  });

  it('conserve les zéros de tête', () => {
    // Le compteur 1 du vecteur TOTP donne « 07081804 » : la mise en forme sur
    // le nombre de chiffres est essentielle, sinon le code serait invalide.
    expect(hotp(Buffer.from('12345678901234567890', 'ascii'), 37037036, { digits: 8 })).toHaveLength(8);
  });

  it('refuse un compteur négatif ou non entier', () => {
    expect(() => hotp(secret, -1)).toThrow(/Compteur HOTP invalide/);
    expect(() => hotp(secret, 1.5)).toThrow(/Compteur HOTP invalide/);
  });
});

describe('TOTP (RFC 6238, annexe B)', () => {
  const secretBase32 = base32Encode(Buffer.from('12345678901234567890', 'ascii'));

  it('reproduit les six vecteurs publiés (SHA-1, 8 chiffres)', () => {
    const vectors: [number, string][] = [
      [59, '94287082'],
      [1_111_111_109, '07081804'],
      [1_111_111_111, '14050471'],
      [1_234_567_890, '89005924'],
      [2_000_000_000, '69279037'],
      [20_000_000_000, '65353130'],
    ];

    for (const [timestamp, expected] of vectors) {
      expect(totp(secretBase32, timestamp, { digits: 8, algorithm: 'sha1' })).toBe(expected);
    }
  });

  it('accepte un code valide dans la fenêtre de dérive', () => {
    const now = 1_234_567_890;
    const code = totp(secretBase32, now);

    expect(verifyTotp(secretBase32, code, { timestampSeconds: now })).toBe(true);
    // Un pas avant / un pas après : horloge légèrement décalée.
    expect(verifyTotp(secretBase32, code, { timestampSeconds: now - 30 })).toBe(true);
    expect(verifyTotp(secretBase32, code, { timestampSeconds: now + 30 })).toBe(true);
  });

  it('refuse un code hors de la fenêtre', () => {
    const now = 1_234_567_890;
    const code = totp(secretBase32, now);

    expect(verifyTotp(secretBase32, code, { timestampSeconds: now - 120 })).toBe(false);
    expect(verifyTotp(secretBase32, code, { timestampSeconds: now + 120 })).toBe(false);
  });

  it('accepte une fenêtre élargie si on l’autorise explicitement', () => {
    const now = 1_234_567_890;
    const code = totp(secretBase32, now);

    expect(verifyTotp(secretBase32, code, { timestampSeconds: now + 120, window: 5 })).toBe(true);
  });

  it('refuse un code mal formé sans calculer', () => {
    const now = 1_234_567_890;

    expect(verifyTotp(secretBase32, '12345', { timestampSeconds: now })).toBe(false);
    expect(verifyTotp(secretBase32, 'abcdef', { timestampSeconds: now })).toBe(false);
    expect(verifyTotp(secretBase32, '', { timestampSeconds: now })).toBe(false);
  });

  it('refuse le code d’un autre secret', () => {
    const now = 1_234_567_890;
    const autre = generateTotpSecret();

    expect(verifyTotp(autre, totp(secretBase32, now), { timestampSeconds: now })).toBe(false);
  });

  it('produit un code à six chiffres par défaut', () => {
    expect(totp(secretBase32)).toMatch(/^\d{6}$/);
  });
});

describe('génération de secret et URI', () => {
  it('génère un secret Base32 de 160 bits par défaut', () => {
    const secret = generateTotpSecret();

    // 20 octets → 32 caractères Base32, sans remplissage.
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(secret)).toHaveLength(20);
  });

  it('génère des secrets distincts', () => {
    const secrets = new Set(Array.from({ length: 50 }, () => generateTotpSecret()));
    expect(secrets.size).toBe(50);
  });

  it('construit une URI otpauth exploitable', () => {
    const secret = generateTotpSecret();
    const uri = buildTotpUri({
      secretBase32: secret,
      accountName: 'formateur@katalyst.test',
      issuer: 'Katalyst',
    });

    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    // Le libellé est encodé : les « : » et « @ » ne doivent pas casser l'URI.
    expect(uri).toContain('Katalyst%3Aformateur%40katalyst.test');

    const query = new URLSearchParams(uri.split('?')[1]);
    expect(query.get('secret')).toBe(secret);
    expect(query.get('issuer')).toBe('Katalyst');
    expect(query.get('digits')).toBe('6');
    expect(query.get('period')).toBe('30');
    expect(query.get('algorithm')).toBe('SHA1');
  });
});
