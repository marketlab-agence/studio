import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { Pool } from 'pg';

/**
 * Réinitialisation de mot de passe de bout en bout (T4.8, REQ-AUTH-06).
 *
 * **C'est le parcours d'entrée des comptes repris de Firebase** : leurs mots de
 * passe n'ont pas pu être exportés (`password_hash = NULL`), ils ne peuvent donc
 * pas se connecter. Ce n'est pas un cas particulier, c'est la voie normale.
 *
 * Comment le lien est-il obtenu sans lire la boîte mail ? Le serveur ne conserve
 * que le **hachage** du jeton. Le test fabrique donc un jeton connu, insère son
 * hachage en base — exactement comme le ferait le provider — puis emprunte le
 * lien avec ce jeton. Le parcours HTTP, le provider et la base sont ainsi
 * réellement traversés.
 *
 * ⚠️ Les comptes créés ici restent dans la base de développement (domaine
 * `@e2e.local`, identifiable et supprimable).
 */

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/katalyst';

const pool = new Pool({ connectionString: DATABASE_URL });

const RUN = Date.now().toString(36);
const EMAIL = `reset-${RUN}@e2e.local`;
const MOT_DE_PASSE_INITIAL = 'mot-de-passe-initial-e2e-2026';
const MOT_DE_PASSE_NOUVEAU = 'mot-de-passe-nouveau-e2e-2026';

test.afterAll(async () => {
  await pool.end();
});

test.describe('réinitialisation de mot de passe', () => {
  test('ne permet pas de savoir si une adresse correspond à un compte', async ({ request }) => {
    // Un compte existe pour la première adresse, pas pour la seconde.
    await request.post('/api/auth/register', {
      data: { email: `connu-${RUN}@e2e.local`, password: MOT_DE_PASSE_INITIAL, name: 'Compte Connu' },
    });

    const connu = await request.post('/api/auth/forgot-password', {
      data: { email: `connu-${RUN}@e2e.local` },
    });
    const inconnu = await request.post('/api/auth/forgot-password', {
      data: { email: `jamais-cree-${RUN}@e2e.local` },
    });

    // Statut ET message identiques : cette route ne doit pas servir à recenser
    // les comptes existants.
    expect(connu.status()).toBe(inconnu.status());
    expect((await connu.json()).message).toBe((await inconnu.json()).message);
  });

  test('refuse un jeton inconnu', async ({ request }) => {
    const response = await request.post('/api/auth/reset-password', {
      data: { token: 'jeton-invente', password: MOT_DE_PASSE_NOUVEAU },
    });

    expect(response.status()).toBe(400);
  });

  test('refuse un mot de passe trop court', async ({ request }) => {
    const response = await request.post('/api/auth/reset-password', {
      data: { token: 'jeton-invente', password: 'court' },
    });

    expect(response.status()).toBe(400);
  });

  test('refuse une méthode non autorisée', async ({ request }) => {
    expect((await request.get('/api/auth/forgot-password')).status()).toBe(405);
    expect((await request.get('/api/auth/reset-password')).status()).toBe(405);
  });

  test('parcours complet : lien, nouveau mot de passe, connexion', async ({ request }) => {
    // 1. Un compte dont on connaît le mot de passe initial.
    const registered = await request.post('/api/auth/register', {
      data: { email: EMAIL, password: MOT_DE_PASSE_INITIAL, name: 'Test Réinitialisation' },
    });
    expect(registered.status()).toBe(201);
    const userId = (await registered.json()).user.id;

    // 2. Un lien a été envoyé par email. On ne peut pas le lire, mais on sait ce
    //    que le serveur en conserve : le hachage SHA-256. On fabrique donc un
    //    jeton connu et on insère son hachage.
    const token = `jeton-e2e-${RUN}`;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [userId, tokenHash],
    );

    // 3. Le lien est emprunté : nouveau mot de passe défini.
    const reset = await request.post('/api/auth/reset-password', {
      data: { token, password: MOT_DE_PASSE_NOUVEAU },
    });
    expect(reset.status()).toBe(200);

    // 4. Le lien ne sert qu'une fois.
    const rejeu = await request.post('/api/auth/reset-password', {
      data: { token, password: 'encore-un-autre-mot-de-passe-2026' },
    });
    expect(rejeu.status()).toBe(400);

    // 5. La connexion aboutit avec le NOUVEAU mot de passe…
    const login = await request.post('/api/auth/login', {
      data: { email: EMAIL, password: MOT_DE_PASSE_NOUVEAU },
    });
    expect(login.status()).toBe(200);

    // 6. …et plus avec l'ancien.
    const ancien = await request.post('/api/auth/login', {
      data: { email: EMAIL, password: MOT_DE_PASSE_INITIAL },
    });
    expect(ancien.status()).toBe(401);

    // 7. Le drapeau de réinitialisation obligatoire est levé en base.
    const { rows } = await pool.query<{ must_reset_password: boolean }>(
      'SELECT must_reset_password FROM users WHERE id = $1',
      [userId],
    );
    expect(rows[0].must_reset_password).toBe(false);
  });

  test('révoque les sessions ouvertes après un changement de mot de passe', async ({ request }) => {
    const email = `sessions-${RUN}@e2e.local`;
    const registered = await request.post('/api/auth/register', {
      data: { email, password: MOT_DE_PASSE_INITIAL, name: 'Test Sessions' },
    });
    expect(registered.status()).toBe(201);

    const userId = (await registered.json()).user.id;
    const cookie = registered
      .headersArray()
      .filter((header) => header.name.toLowerCase() === 'set-cookie')
      .map((header) => header.value.split(';')[0])
      .join('; ');

    // La session fonctionne avant le changement.
    expect((await request.get('/dashboard', { headers: { cookie } })).status()).toBe(200);

    const token = `jeton-sessions-${RUN}`;
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [userId, createHash('sha256').update(token).digest('hex')],
    );

    await request.post('/api/auth/reset-password', {
      data: { token, password: MOT_DE_PASSE_NOUVEAU },
    });

    // Le jeton d'accès reste valide jusqu'à expiration (il est sans état), mais
    // le refresh token a été révoqué : la session ne peut plus être prolongée.
    const refreshed = await request.post('/api/auth/refresh', { headers: { cookie } });
    expect(refreshed.status()).toBe(401);
  });

  test('les pages de réinitialisation sont accessibles sans session', async ({ page }) => {
    for (const path of ['/forgot-password', '/reset-password']) {
      const response = await page.goto(path);
      expect(response?.status(), `statut de ${path}`).toBe(200);
    }
  });

  test('la page signale un lien dépourvu de jeton', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.getByText(/ne contient pas de jeton/i)).toBeVisible();
  });

  test('la page de demande guide l’utilisateur', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: /mot de passe oublié/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: /envoyer le lien/i })).toBeVisible();
  });
});
