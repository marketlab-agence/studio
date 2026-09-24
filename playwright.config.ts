import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration des tests de bout en bout (E2E).
 *
 * Exécutés après chaque phase d'implémentation, en complément de `npm test`
 * (unitaire, jsdom) et `npm run test:db` (intégration, PostgreSQL).
 *
 * Le serveur est démarré automatiquement, sauf si `E2E_BASE_URL` est fourni
 * (utile pour viser un environnement déjà en ligne).
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: BASE_URL,
    // ⚠️ **`locale` est OBLIGATOIRE depuis l'internationalisation (phase 8).**
    //
    // `next-intl` négocie la locale depuis l'en-tête `Accept-Language`. Playwright
    // envoie `en-US` par défaut : une navigation vers `/reset-password` (sans
    // préfixe) était donc redirigée vers `/en/reset-password`, et les tests qui
    // cherchent du texte français échouaient — alors que le code était correct.
    //
    // La suite de tests est **française** : elle doit se déclarer française. Un
    // test i18n dédié couvre explicitement la version anglaise.
    locale: 'fr-FR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Pas de serveur à démarrer si l'on vise une URL existante.
  //
  // ⚠️ `reuseExistingServer: false` VOLONTAIREMENT, y compris en local.
  //
  // La réutilisation d'un serveur déjà à l'écoute produit des **résultats faux
  // silencieux** : un serveur démarré avant l'ajout d'une variable
  // d'environnement (ici RATE_LIMIT_MULTIPLIER) ne la connaît pas, la limite de
  // débit retombe à sa valeur stricte, et les tests échouent en « 429 » sans que
  // rien n'indique la cause. C'est arrivé quatre fois.
  //
  // Avec `false`, un serveur déjà présent provoque une erreur explicite
  // (« port déjà utilisé ») : on perd quelques secondes de démarrage, on gagne
  // des diagnostics justes. Arrêter les `next dev` en cours avant de lancer.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev:turbo',
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
        env: {
          // ⚠️ Playwright REMPLACE l'environnement du serveur par cet objet, il
          // ne le complète pas : sans la recopie de `process.env`, le serveur
          // perdrait PATH, NODE_ENV et les variables de `.env.local`.
          ...process.env,
          // Les tests E2E s'exécutent tous depuis la même adresse IP : la limite
          // d'inscription serait atteinte par les tests eux-mêmes. Les limites
          // restent actives, mais élargies. Cette variable est **ignorée en
          // production** (voir src/lib/rate-limit.ts).
          RATE_LIMIT_MULTIPLIER: '200',

          // Configuration Google **factice mais présente**, pour que le test du
          // parcours OAuth soit DÉTERMINISTE.
          //
          // Sans elle, le test dépendait de la configuration locale du
          // développeur : il acceptait les deux branches (configuré ou non) et
          // passait donc même quand Google était débranché — il ne prouvait
          // rien. Ces valeurs ne servent qu'à vérifier la CONSTRUCTION de l'URL
          // d'autorisation ; aucun appel n'est fait à Google.
          GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
          GOOGLE_CLIENT_SECRET: 'test-client-secret',
          GOOGLE_REDIRECT_URI: `${BASE_URL}/api/auth/google/callback`,
        },
      },
});
