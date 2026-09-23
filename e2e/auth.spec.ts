import { test, expect } from '@playwright/test';

/**
 * Protection des routes et parcours d'authentification de bout en bout
 * (T4.2, T4.6, T4.7 — REQ-AUTH-01, REQ-AUTH-03, REQ-AUTH-09).
 *
 * Ces tests s'exécutent contre le **vrai** serveur, avec la **vraie** base :
 * c'est la seule façon de prouver que le middleware Edge, les route handlers et
 * le provider PostgreSQL fonctionnent ensemble.
 *
 * ⚠️ Les comptes créés ici sont nettoyés **automatiquement** depuis la phase 7 :
 * `e2e/global-teardown.ts` purge les organisations de test et les comptes
 * `@e2e.local` après chaque suite (et `e2e/global-setup.ts` avant, pour réparer
 * un passage interrompu). Plus rien à supprimer à la main.
 */

/** Identifiant unique par exécution : deux passages ne se marchent pas dessus. */
const RUN = Date.now().toString(36);
const EMAIL = `formateur-${RUN}@e2e.local`;
const PASSWORD = 'un-mot-de-passe-e2e-2026';

test.describe('routes privées', () => {
  test('redirige vers /login avec la destination demandée', async ({ page }) => {
    await page.goto('/admin/courses');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fcourses/);
  });

  test('redirige le tableau de bord quand aucune session n’existe', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
  });

  test('laisse les pages publiques accessibles', async ({ page }) => {
    for (const path of ['/', '/courses', '/pricing', '/login']) {
      const response = await page.goto(path);
      expect(response?.status(), `statut de ${path}`).toBe(200);
    }
  });
});

test.describe('API d’authentification', () => {
  test('refuse une connexion avec un mot de passe erroné', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: EMAIL, password: 'mauvais-mot-de-passe-e2e' },
    });

    expect(response.status()).toBe(401);
    expect((await response.json()).message).toBeTruthy();
  });

  test('refuse une inscription dont le mot de passe est trop court', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: { email: `court-${RUN}@e2e.local`, password: 'court', name: 'Test E2E' },
    });

    expect(response.status()).toBe(400);
  });

  test('refuse une inscription sans email valide', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: { email: 'pas-un-email', password: PASSWORD, name: 'Test E2E' },
    });

    expect(response.status()).toBe(400);
  });

  test('refuse une méthode non autorisée', async ({ request }) => {
    const response = await request.get('/api/auth/login');
    expect(response.status()).toBe(405);
  });

  test('ne renvoie jamais le mot de passe ni le refresh token dans le corps', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: { email: `fuite-${RUN}@e2e.local`, password: PASSWORD, name: 'Test Fuite' },
    });

    expect(response.status()).toBe(201);

    const body = await response.text();
    expect(body).not.toContain(PASSWORD);
    // Le refresh token ne doit exister que dans un cookie httpOnly.
    expect(body).not.toContain('refreshToken');
  });

  test('pose les cookies de session en httpOnly', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: { email: `cookies-${RUN}@e2e.local`, password: PASSWORD, name: 'Test Cookies' },
    });

    const cookies = response
      .headersArray()
      .filter((header) => header.name.toLowerCase() === 'set-cookie')
      .map((header) => header.value);
    const joined = cookies.join('\n');

    expect(joined).toContain('katalyst_access=');
    expect(joined).toContain('katalyst_refresh=');
    expect(joined).toContain('HttpOnly');
    // Le refresh token est restreint aux routes d'authentification.
    expect(joined).toMatch(/katalyst_refresh=[^;]*;[^\n]*Path=\/api\/auth/i);
  });
});

test.describe('parcours complet', () => {
  test('inscription, accès à une page privée, déconnexion', async ({ page, request }) => {
    // 1. Inscription
    const registered = await request.post('/api/auth/register', {
      data: { email: EMAIL, password: PASSWORD, name: 'Formateur E2E' },
    });
    expect(registered.status()).toBe(201);

    const session = await registered.json();
    expect(session.user.email).toBe(EMAIL);
    // Inscription libre-service : l'inscrit devient Propriétaire (REQ-ORG-04).
    expect(session.user.role).toBe('Propriétaire');
    expect(session.user.mustResetPassword).toBe(false);

    // 2. Le navigateur reçoit ces cookies : la page privée devient accessible.
    //    On réutilise les en-têtes du client API pour le contexte du navigateur.
    const cookies = responseCookies(registered);
    await page.context().addCookies(cookies);

    const dashboard = await page.goto('/dashboard');
    expect(dashboard?.status()).toBe(200);

    // 3. Déconnexion : le refresh token est révoqué en base.
    const loggedOut = await request.post('/api/auth/logout', {
      headers: { cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; ') },
    });
    expect(loggedOut.status()).toBe(204);

    // 4. Les cookies sont effacés côté client.
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('le jeton de session est rotatif', async ({ request }) => {
    const registered = await request.post('/api/auth/register', {
      data: { email: `rotation-${RUN}@e2e.local`, password: PASSWORD, name: 'Test Rotation' },
    });
    expect(registered.status()).toBe(201);

    const initial = responseCookies(registered).find((c) => c.name === 'katalyst_refresh');
    expect(initial).toBeTruthy();

    const refreshed = await request.post('/api/auth/refresh', {
      headers: { cookie: `katalyst_refresh=${initial!.value}` },
    });
    expect(refreshed.status()).toBe(200);

    const rotated = responseCookies(refreshed).find((c) => c.name === 'katalyst_refresh');
    expect(rotated).toBeTruthy();
    // Rotation : le nouveau jeton diffère de celui présenté.
    expect(rotated!.value).not.toBe(initial!.value);
  });
});

/** Extrait les cookies de session d'une réponse, au format attendu par Playwright. */
function responseCookies(response: {
  headersArray(): { name: string; value: string }[];
}): { name: string; value: string; domain: string; path: string }[] {
  const setCookies = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === 'set-cookie')
    .map((header) => header.value);

  const parsed: { name: string; value: string; domain: string; path: string }[] = [];

  for (const header of setCookies) {
    const [pair, ...attributes] = header.split(';');
    const index = pair.indexOf('=');
    if (index === -1) continue;

    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    const pathAttribute = attributes.find((a) => a.trim().toLowerCase().startsWith('path='));

    parsed.push({
      name,
      value,
      domain: 'localhost',
      path: pathAttribute ? pathAttribute.split('=')[1].trim() : '/',
    });
  }

  return parsed;
}
