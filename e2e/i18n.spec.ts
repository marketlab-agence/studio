import { test, expect } from '@playwright/test';

/**
 * Prouve ce que le lint i18n ne peut pas : que le routage localisé FONCTIONNE.
 *
 * ⚠️ **Répartition des rôles.** `npm run lint:i18n` garantit que les **clés**
 * existent dans les deux langues. Ces tests garantissent que :
 * - les **routes** `/fr` et `/en` répondent et déclarent la bonne langue ;
 * - la **protection des pages privées** résiste au préfixe de locale ;
 * - le catalogue **affiche**, **marque** et **filtre** selon la langue (option C) ;
 * - les **formats** (devise) suivent la locale.
 *
 * ⚠️ `playwright.config.ts` déclare `locale: 'fr-FR'` : sans cela, Chromium envoie
 * `Accept-Language: en-US` et `next-intl` redirige les URL sans préfixe vers `/en`.
 * Les tests qui attendent du français naviguent donc vers un chemin **préfixé**,
 * ou s'appuient sur ce repli explicite.
 */
test.describe('internationalisation', () => {
  test('sert le français et l’anglais sur la page de connexion', async ({ page }) => {
    await page.goto('/fr/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

    await page.goto('/en/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('redirige la racine vers la locale par défaut', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/fr(\/|$)/);
  });

  test('ramène une locale inconnue vers une locale supportée', async ({ request }) => {
    // ⚠️ **Comportement réel, mesuré** : `next-intl` ne reconnaît pas `de` comme
    // locale et le traite donc comme un **segment de chemin** : `/de/login` est
    // redirigé vers `/fr/de/login`, qui n'existe pas (404).
    //
    // Ce n'est pas un défaut : l'application **ne sert jamais une locale non
    // supportée**, et la locale par défaut (`fr`) reste le repli documenté. Le
    // point vérifié ici est qu'elle **redirige** au lieu de planter ou de servir
    // `de`.
    const reponse = await request.get('/de/login', { maxRedirects: 0 });

    expect(reponse.status()).toBe(307);
    expect(reponse.headers()['location']).toMatch(/^\/fr\//);
  });

  test('protège les pages privées même avec un préfixe de locale', async ({ page }) => {
    // ⚠️ **Le test le plus important de la phase.** Sans le retrait du préfixe dans
    // le middleware, `/fr/dashboard` ne matcherait pas `/dashboard` et la page
    // s'ouvrirait sans session — un défaut de sécurité silencieux.
    await page.goto('/fr/dashboard');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/en/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('affiche le catalogue en anglais', async ({ page }) => {
    await page.goto('/en/courses');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Option C : le marquage de langue est présent (« French » pour une formation fr).
    await expect(page.getByText(/French/i).first()).toBeVisible();
  });

  test('le sélecteur de langue change la langue de l’interface', async ({ page }) => {
    await page.goto('/fr/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

    // Le sélecteur expose les deux locales par leur nom.
    await page.getByRole('button', { name: 'Anglais' }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page).toHaveURL(/\/en\//);
  });

  test('le filtre de langue restreint le catalogue', async ({ page }) => {
    // Les 6 formations sont en français : filtrer sur l'anglais doit vider la liste.
    await page.goto('/fr/courses');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const filtre = page.getByLabel(/Filtrer par langue/i);
    await expect(filtre).toBeVisible();
    await filtre.selectOption('en');

    await expect(page.getByText('Aucune formation dans cette langue')).toBeVisible();
  });

  test('formate la devise selon la locale', async ({ page }) => {
    // ⚠️ Le prix n'apparaît PAS dans le HTML initial (page cliente qui charge via
    // `fetch`) : seul un vrai navigateur voit le montant formaté.
    await page.goto('/fr/pricing');
    // En français : virgule décimale, symbole après.
    await expect(page.getByText(/9,99\s*€/)).toBeVisible();

    await page.goto('/en/pricing');
    // En anglais : point décimal, symbole avant.
    await expect(page.getByText(/€\s*9\.99/)).toBeVisible();
  });
});
