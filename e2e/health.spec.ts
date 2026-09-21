import { test, expect } from '@playwright/test';

/**
 * Vérifie la pile de bout en bout : navigateur → Next → provider → PostgreSQL.
 * C'est la suite qui prouve que le Walking Skeleton (phase 0.5) tient réellement.
 */
test.describe('Diagnostic de la plateforme', () => {
  test('/health affiche la connexion PostgreSQL et les paramètres lus en base', async ({ page }) => {
    const response = await page.goto('/health');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { name: /Diagnostic/i })).toBeVisible();
    await expect(page.getByText('Connectée')).toBeVisible();
    // Sélecteur précis : « PostgreSQL » seul matche aussi le paragraphe d'intro.
    await expect(page.getByText(/^PostgreSQL \d/)).toBeVisible();
    await expect(page.getByText('Alex Dubois')).toBeVisible();
  });

  test("l'API versionnée renvoie les paramètres au format JSON", async ({ request }) => {
    const response = await request.get('/api/v1/settings');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('instructorName');
    expect(typeof body.instructorName).toBe('string');
    expect(body.instructorName.length).toBeGreaterThan(0);
  });
});
