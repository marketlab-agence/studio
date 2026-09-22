import { test, expect } from '@playwright/test';

/**
 * Parcours Google OAuth (T4.3, REQ-AUTH-02, REQ-AUTH-07).
 *
 * ⚠️ Le parcours **complet** (aller chez Google, consentement, retour) ne peut
 * pas être automatisé sans un vrai compte Google et sans franchir le mur
 * d'authentification de Google. Ce qui est vérifié ici, c'est tout ce qui se
 * passe **avant** et **après** le passage chez Google :
 *
 * - le démarrage pose un jeton d'état et redirige vers le bon domaine ;
 * - le rappel **refuse** un état absent, invalide ou absent du cookie — c'est la
 *   protection contre le CSRF sur le rappel OAuth ;
 * - un refus de consentement est traité proprement ;
 * - un échec revient sur la connexion avec un message lisible.
 *
 * Le reste est couvert par les tests du provider (`google-auth.db.test.ts`) :
 * liaison, création, conflits, levée de `must_reset_password`.
 */

test.describe('démarrage du parcours Google', () => {
  /**
   * ⚠️ Ce test est **déterministe** parce que Playwright fournit une
   * configuration Google de test (voir `playwright.config.ts`).
   *
   * Il acceptait auparavant **les deux branches** — configuré ou non — et
   * passait donc même quand Google était débranché : il ne prouvait rien. Une
   * assertion qui accepte deux issues opposées n'est pas une assertion.
   *
   * Le `client_id` attendu est celui du serveur de test, jamais un secret réel :
   * aucun appel n'est fait à Google, seul l'assemblage de l'URL est vérifié.
   */
  test('construit l’URL d’autorisation Google et pose un jeton d’état', async ({ request }) => {
    const response = await request.get('/api/auth/google', { maxRedirects: 0 });

    // Sans configuration Google, la route reviendrait sur /login avec un motif.
    // Ce n'est plus le cas : la configuration de test est fournie.
    expect(response.status()).toBe(307);

    const location = response.headers()['location'] ?? '';
    expect(
      location,
      `Google devrait être configuré sur le serveur de test, or /api/auth/google a renvoyé : ${location}`,
    ).toContain('accounts.google.com');

    const url = new URL(location);
    expect(url.searchParams.get('client_id')).toBe('test-client-id.apps.googleusercontent.com');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('redirect_uri')).toContain('/api/auth/google/callback');
    // Portées minimales : identité seule, aucune donnée métier Google.
    expect(url.searchParams.get('scope')).toBe('openid email profile');
    expect(url.searchParams.get('state')).toBeTruthy();

    // Le jeton d'état est aussi posé en cookie, pour comparaison au retour.
    const setCookie = response
      .headersArray()
      .filter((header) => header.name.toLowerCase() === 'set-cookie')
      .map((header) => header.value)
      .join('\n');

    expect(setCookie).toContain('katalyst_oauth_state=');
    expect(setCookie).toContain('HttpOnly');
  });
});

test.describe('rappel Google', () => {
  test('refuse un rappel sans jeton d’état', async ({ request }) => {
    const response = await request.get('/api/auth/google/callback?code=abc&state=xyz', {
      maxRedirects: 0,
    });

    // Sans cookie d'état, la comparaison échoue : c'est la protection contre le
    // CSRF sur le rappel OAuth (un tiers ne peut pas faire aboutir une connexion).
    expect(response.headers()['location']).toContain('error=google_etat_invalide');
  });

  test('refuse un jeton d’état qui ne correspond pas au cookie', async ({ request }) => {
    const response = await request.get('/api/auth/google/callback?code=abc&state=forge', {
      maxRedirects: 0,
      headers: { cookie: 'katalyst_oauth_state=le-vrai-jeton' },
    });

    expect(response.headers()['location']).toContain('error=google_etat_invalide');
  });

  test('traite un refus de consentement', async ({ request }) => {
    const response = await request.get('/api/auth/google/callback?error=access_denied&state=ok', {
      maxRedirects: 0,
      headers: { cookie: 'katalyst_oauth_state=ok' },
    });

    expect(response.headers()['location']).toContain('error=google_refuse');
  });

  test('refuse un rappel sans code d’autorisation', async ({ request }) => {
    const response = await request.get('/api/auth/google/callback?state=ok', {
      maxRedirects: 0,
      headers: { cookie: 'katalyst_oauth_state=ok' },
    });

    expect(response.headers()['location']).toContain('error=google_sans_code');
  });

  test('efface les cookies du parcours dans tous les cas', async ({ request }) => {
    const response = await request.get('/api/auth/google/callback?error=access_denied&state=ok', {
      maxRedirects: 0,
      headers: { cookie: 'katalyst_oauth_state=ok' },
    });

    const setCookie = response
      .headersArray()
      .filter((header) => header.name.toLowerCase() === 'set-cookie')
      .map((header) => header.value)
      .join('\n');

    // Un jeton d'état qui survivrait à un échec pourrait être rejoué.
    expect(setCookie).toContain('katalyst_oauth_state=;');
    expect(setCookie).toMatch(/Max-Age=0/i);
  });
});

test.describe('message d’erreur côté interface', () => {
  test('la page de connexion explique un échec du parcours Google', async ({ page }) => {
    await page.goto('/login?error=google_deja_rattache');

    // Sans traduction, l'utilisateur reviendrait sur une page inchangée après
    // avoir cliqué sur « Continuer avec Google », sans savoir ce qui s'est passé.
    // Restreint à `main` : le conteneur de notifications du layout porte lui
    // aussi un rôle « alert ».
    await expect(page.locator('main').getByRole('alert')).toContainText(/déjà rattaché/i);
  });

  test('la page de connexion propose le parcours Google', async ({ page }) => {
    await page.goto('/login');

    const google = page.getByRole('link', { name: /continuer avec google/i });
    await expect(google).toBeVisible();
    await expect(google).toHaveAttribute('href', /^\/api\/auth\/google/);
  });
});
