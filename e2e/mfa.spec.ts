import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { Pool } from 'pg';

/**
 * Double authentification de bout en bout (T4.4, REQ-AUTH-04).
 *
 * Le test joue le rôle de l'application d'authentification : il lit le secret
 * dans la réponse de `/api/auth/mfa/setup` et **calcule lui-même** le code TOTP.
 * Le parcours HTTP, le chiffrement du secret, la vérification et la base sont
 * ainsi réellement traversés.
 *
 * ⚠️ Le code TOTP est recalculé ici, indépendamment de `src/lib/auth/totp.ts` :
 * le tester avec sa propre implémentation ne prouverait rien. Cette copie
 * minimale (RFC 6238) est confrontée aux vecteurs officiels dans
 * `src/tests/auth/totp.test.ts`.
 */

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/katalyst';

/** Connexion directe à la base, pour vérifier que le secret est bien chiffré. */
const pool = new Pool({ connectionString: DATABASE_URL });

const RUN = Date.now().toString(36);
const EMAIL = `mfa-${RUN}@e2e.local`;
const PASSWORD = 'un-mot-de-passe-e2e-2026';

/** Base32 → octets (RFC 4648). */
function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.replace(/=+$/, '').toUpperCase();

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index === -1) throw new Error(`Caractère Base32 invalide : ${char}`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
    value &= (1 << bits) - 1;
  }

  return Buffer.from(bytes);
}

/** Code TOTP courant (RFC 6238, SHA-1, 6 chiffres, pas de 30 s). */
function currentTotp(secretBase32: string): string {
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac('sha1', base32Decode(secretBase32)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];

  return (binary % 1_000_000).toString().padStart(6, '0');
}

/** En-tête `Cookie` à partir des `Set-Cookie` d'une réponse. */
function cookieHeader(response: { headersArray(): { name: string; value: string }[] }): string {
  return response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === 'set-cookie')
    .map((header) => header.value.split(';')[0])
    .join('; ');
}

test.describe('double authentification', () => {
  test('exige une session pour consulter l’état', async ({ request }) => {
    expect((await request.get('/api/auth/mfa/status')).status()).toBe(401);
  });

  test('exige une session pour préparer l’activation', async ({ request }) => {
    expect((await request.post('/api/auth/mfa/setup')).status()).toBe(401);
  });

  test('exige une session pour désactiver', async ({ request }) => {
    const response = await request.post('/api/auth/mfa/disable', {
      data: { password: PASSWORD },
    });
    expect(response.status()).toBe(401);
  });

  test('refuse une méthode non autorisée', async ({ request }) => {
    expect((await request.get('/api/auth/mfa/challenge')).status()).toBe(405);
    expect((await request.get('/api/auth/mfa/verify')).status()).toBe(405);
  });

  test('refuse un code mal formé', async ({ request }) => {
    const response = await request.post('/api/auth/mfa/challenge', {
      data: { challengeToken: 'x', code: 'abc' },
    });

    // Rejeté par la validation Zod, avant toute vérification cryptographique.
    expect(response.status()).toBe(400);
  });

  test('parcours complet : activation, connexion à deux facteurs, désactivation', async ({ request }) => {
    // 1. Un compte, puis activation de la double authentification.
    const registered = await request.post('/api/auth/register', {
      data: { email: EMAIL, password: PASSWORD, name: 'Test MFA' },
    });
    expect(registered.status()).toBe(201);
    const cookie = cookieHeader(registered);

    // 2. État initial
    const initial = await request.get('/api/auth/mfa/status', { headers: { cookie } });
    expect(await initial.json()).toEqual({ configured: false, enabled: false });

    // 3. Préparation : un secret est fourni, mais rien n'est encore actif.
    const setup = await request.post('/api/auth/mfa/setup', { headers: { cookie } });
    expect(setup.status()).toBe(200);

    const { secret, uri } = await setup.json();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(uri).toContain('otpauth://totp/');

    const afterSetup = await request.get('/api/auth/mfa/status', { headers: { cookie } });
    expect(await afterSetup.json()).toEqual({ configured: true, enabled: false });

    // 4. Un code invalide n'active rien.
    const mauvaisCode = await request.post('/api/auth/mfa/verify', {
      headers: { cookie },
      data: { code: '000000' },
    });
    expect(mauvaisCode.status()).toBe(401);

    // 5. Un code valide active.
    const verify = await request.post('/api/auth/mfa/verify', {
      headers: { cookie },
      data: { code: currentTotp(secret) },
    });
    expect(verify.status()).toBe(200);

    const afterVerify = await request.get('/api/auth/mfa/status', { headers: { cookie } });
    expect(await afterVerify.json()).toEqual({ configured: true, enabled: true });

    // 6. La connexion ne retourne PLUS de session : un défi est exigé.
    const login = await request.post('/api/auth/login', {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(login.status()).toBe(200);

    const challenge = await login.json();
    expect(challenge.mfaRequired).toBe(true);
    expect(challenge.challengeToken).toBeTruthy();
    expect(challenge.accessToken).toBeUndefined();

    // Aucun cookie de session ne doit avoir été posé à cette étape.
    expect(cookieHeader(login)).not.toContain('katalyst_access=');

    // 7. Le mot de passe seul ne suffit pas : sans code, la session reste fermée.
    const sansCode = await request.post('/api/auth/mfa/challenge', {
      data: { challengeToken: challenge.challengeToken },
    });
    expect(sansCode.status()).toBe(400);

    // 8. Avec le code, la session s'ouvre.
    const completed = await request.post('/api/auth/mfa/challenge', {
      data: { challengeToken: challenge.challengeToken, code: currentTotp(secret) },
    });
    expect(completed.status()).toBe(200);
    expect(cookieHeader(completed)).toContain('katalyst_access=');

    // 9. Désactivation : le mot de passe est exigé.
    const mauvaisMotDePasse = await request.post('/api/auth/mfa/disable', {
      headers: { cookie: cookieHeader(completed) },
      data: { password: 'mauvais-mot-de-passe-e2e' },
    });
    expect(mauvaisMotDePasse.status()).toBe(401);

    const disabled = await request.post('/api/auth/mfa/disable', {
      headers: { cookie: cookieHeader(completed) },
      data: { password: PASSWORD },
    });
    expect(disabled.status()).toBe(200);

    // 10. La connexion redevient simple.
    const simple = await request.post('/api/auth/login', {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect((await simple.json()).mfaRequired).toBeUndefined();
    expect(cookieHeader(simple)).toContain('katalyst_access=');
  });

  test('le secret est stocké chiffré, jamais en clair', async ({ request }) => {
    const email = `mfa-stockage-${RUN}@e2e.local`;

    const registered = await request.post('/api/auth/register', {
      data: { email, password: PASSWORD, name: 'Test Stockage' },
    });
    const cookie = cookieHeader(registered);

    const setup = await request.post('/api/auth/mfa/setup', { headers: { cookie } });
    const { secret } = await setup.json();

    const { rows } = await pool.query<{ two_factor_secret: string }>(
      `SELECT two_factor_secret FROM users WHERE email = $1`,
      [email],
    );

    // Une fuite de la base ne doit pas permettre de générer des codes valides.
    expect(rows[0].two_factor_secret).not.toContain(secret);
    expect(rows[0].two_factor_secret.startsWith('v1:')).toBe(true);
  });
});
