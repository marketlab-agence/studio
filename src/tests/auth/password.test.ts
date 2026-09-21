import {
  assertPasswordPolicy,
  hashPassword,
  isUsableHash,
  MAX_PASSWORD_BYTES,
  MIN_PASSWORD_LENGTH,
  PasswordPolicyError,
  verifyPassword,
} from '@/lib/auth/password';

/**
 * Hachage des mots de passe (T4.1/T4.2, REQ-AUTH-01 : « bcrypt vérifié »).
 *
 * Les hachages bcrypt au coût 12 prennent ~290 ms : les tests en font donc un
 * nombre volontairement limité, sans sacrifier ce qui doit être prouvé.
 */

const VALID = 'un-mot-de-passe-solide-2026';

describe('politique de mot de passe', () => {
  it('accepte un mot de passe conforme', () => {
    expect(() => assertPasswordPolicy(VALID)).not.toThrow();
  });

  it('refuse un mot de passe trop court', () => {
    const tropCourt = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);

    expect(() => assertPasswordPolicy(tropCourt)).toThrow(PasswordPolicyError);
    expect(() => assertPasswordPolicy(tropCourt)).toThrow(/trop court/);
  });

  it('refuse un mot de passe dépassant ce que bcrypt exploite', () => {
    // bcrypt n'utilise que les 72 premiers OCTETS : accepter davantage
    // donnerait l'illusion d'une sécurité que le hachage n'apporte pas.
    const tropLong = 'a'.repeat(MAX_PASSWORD_BYTES + 1);

    expect(() => assertPasswordPolicy(tropLong)).toThrow(/trop long/);
  });

  it('compte les octets et non les caractères', () => {
    // 40 caractères accentués = 80 octets en UTF-8 : la limite porte sur les
    // octets, donc ce mot de passe doit être refusé malgré ses 40 caractères.
    const accentue = 'é'.repeat(40);
    expect(accentue.length).toBeLessThan(MAX_PASSWORD_BYTES);
    expect(Buffer.byteLength(accentue, 'utf8')).toBeGreaterThan(MAX_PASSWORD_BYTES);

    expect(() => assertPasswordPolicy(accentue)).toThrow(/trop long/);
  });

  it('accepte exactement la limite haute', () => {
    expect(() => assertPasswordPolicy('a'.repeat(MAX_PASSWORD_BYTES))).not.toThrow();
  });
});

describe('hachage et vérification', () => {
  it('produit un hachage bcrypt au coût configuré, et vérifie le mot de passe', async () => {
    const hash = await hashPassword(VALID);

    // Préfixe bcrypt + coût 12, sans exposer le mot de passe.
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(hash).not.toContain(VALID);

    expect(await verifyPassword(VALID, hash)).toBe(true);
    expect(await verifyPassword('mauvais-mot-de-passe-2026', hash)).toBe(false);
  }, 20_000);

  it('produit deux hachages différents pour le même mot de passe (sel aléatoire)', async () => {
    const premier = await hashPassword(VALID);
    const second = await hashPassword(VALID);

    expect(premier).not.toBe(second);
    // Les deux restent valides : le sel est inscrit dans le hachage.
    expect(await verifyPassword(VALID, premier)).toBe(true);
    expect(await verifyPassword(VALID, second)).toBe(true);
  }, 20_000);

  it('refuse de hacher un mot de passe non conforme', async () => {
    await expect(hashPassword('court')).rejects.toThrow(PasswordPolicyError);
  });

  it('retourne false, sans lever, quand le compte n’a pas de mot de passe', async () => {
    // Cas des comptes OAuth (Google) : `password_hash` est NULL.
    await expect(verifyPassword(VALID, null)).resolves.toBe(false);
  });

  it('retourne false, sans lever, sur un hachage illisible', async () => {
    // Un hachage corrompu ne doit pas produire d'erreur serveur : cela
    // révélerait l'état interne du compte.
    await expect(verifyPassword(VALID, 'pas-un-hachage-bcrypt')).resolves.toBe(false);
    await expect(verifyPassword(VALID, '')).resolves.toBe(false);
  });
});

describe('isUsableHash', () => {
  it('reconnaît un hachage exploitable', async () => {
    expect(isUsableHash(await hashPassword(VALID))).toBe(true);
  }, 20_000);

  it('rejette une valeur absente ou étrangère', () => {
    expect(isUsableHash(null)).toBe(false);
    expect(isUsableHash('')).toBe(false);
    expect(isUsableHash('$plaintext$')).toBe(false);
    // Un mot de passe en clair ne doit jamais être pris pour un hachage.
    expect(isUsableHash(VALID)).toBe(false);
  });
});
