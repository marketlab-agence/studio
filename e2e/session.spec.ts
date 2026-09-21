import { test, expect } from '@playwright/test';

/**
 * Amorçage de session (T4.9/T4.10, REQ-AUTH-08).
 *
 * `POST /api/auth/session` remplace l'écouteur Firebase dont la fuite était
 * signalée. Deux propriétés sont vérifiées ici :
 *
 * 1. **Il répond toujours 200**, y compris sans session. Un 401 ferait
 *    apparaître une requête en échec dans la console de **chaque visiteur
 *    anonyme**, sur toutes les pages publiques.
 * 2. Il restaure une session à partir du cookie de rafraîchissement, sans que
 *    l'appelant ait à interpréter un code d'erreur.
 */

const RUN = Date.now().toString(36);
const EMAIL = `session-${RUN}@e2e.local`;
const PASSWORD = 'un-mot-de-passe-e2e-2026';

function cookieHeader(response: { headersArray(): { name: string; value: string }[] }): string {
  return response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === 'set-cookie')
    .map((header) => header.value.split(';')[0])
    .join('; ');
}

test.describe('amorçage de session', () => {
  test('répond 200 avec « personne » pour un visiteur anonyme', async ({ request }) => {
    const response = await request.post('/api/auth/session');

    // 200 et non 401 : « qui suis-je ? » → « personne » n'est pas une erreur.
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ user: null });
  });

  test('refuse la méthode GET', async ({ request }) => {
    // POST et non GET : l'opération peut faire tourner le refresh token.
    expect((await request.get('/api/auth/session')).status()).toBe(405);
  });

  test('retourne l’utilisateur après connexion', async ({ request }) => {
    const registered = await request.post('/api/auth/register', {
      data: { email: EMAIL, password: PASSWORD, name: 'Test Session' },
    });
    expect(registered.status()).toBe(201);

    const session = await request.post('/api/auth/session', {
      headers: { cookie: cookieHeader(registered) },
    });

    expect(session.status()).toBe(200);
    const body = await session.json();
    expect(body.user.email).toBe(EMAIL);
    expect(body.user.mustResetPassword).toBe(false);
    // Le hachage du mot de passe ne doit jamais franchir la frontière HTTP.
    expect(JSON.stringify(body)).not.toContain('password');
  });

  test('restaure la session avec le seul cookie de rafraîchissement', async ({ request }) => {
    const email = `restaure-${RUN}@e2e.local`;
    const registered = await request.post('/api/auth/register', {
      data: { email, password: PASSWORD, name: 'Test Restauration' },
    });

    const refreshCookie = cookieHeader(registered)
      .split('; ')
      .find((cookie) => cookie.startsWith('katalyst_refresh='));

    // On ne présente QUE le refresh token : c'est la situation d'un jeton
    // d'accès expiré, cas très courant après 15 minutes.
    const session = await request.post('/api/auth/session', {
      headers: { cookie: refreshCookie! },
    });

    expect(session.status()).toBe(200);
    expect((await session.json()).user.email).toBe(email);

    // La session restaurée pose un nouveau cookie d'accès.
    expect(cookieHeader(session)).toContain('katalyst_access=');
  });

  test('répond « personne » pour un refresh token inconnu, sans erreur', async ({ request }) => {
    const session = await request.post('/api/auth/session', {
      headers: { cookie: 'katalyst_refresh=jeton-invente' },
    });

    // Session irrécupérable ≠ panne : on répond « personne » et on nettoie.
    expect(session.status()).toBe(200);
    expect(await session.json()).toEqual({ user: null });
  });

  test('les pages publiques ne produisent aucune erreur console', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    for (const path of ['/', '/courses', '/pricing']) {
      await page.goto(path);
    }

    // L'ancien amorçage produisait deux 401 dans la console de chaque visiteur
    // anonyme, sur chaque page publique.
    expect(errors, `Erreurs console : ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('les pages publiques s’affichent sans attendre le réseau', async ({ page }) => {
    // Le contenu ne doit pas être retenu derrière un écran de chargement le
    // temps de l'aller-retour d'amorçage.
    const response = await page.goto('/courses');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
