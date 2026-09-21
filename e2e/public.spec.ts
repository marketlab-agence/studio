import { test, expect } from '@playwright/test';

/**
 * Parcours public minimal : les pages doivent se rendre sans erreur.
 * Toute erreur console est collectée et fait échouer le test — c'est le
 * principal intérêt de l'E2E par rapport aux tests unitaires.
 */
function collectConsoleErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.describe('Parcours public', () => {
  test("l'accueil se rend et affiche la proposition de valeur", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Devenez un Katalyst/i)).toBeVisible();

    expect(errors, `Erreurs console : ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('/courses se rend et liste des formations', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    const response = await page.goto('/courses');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(errors, `Erreurs console : ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('/pricing se rend', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    const response = await page.goto('/pricing');
    expect(response?.status()).toBe(200);

    expect(errors, `Erreurs console : ${errors.join(' | ')}`).toHaveLength(0);
  });
});
