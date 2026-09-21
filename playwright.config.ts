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
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Pas de serveur à démarrer si l'on vise une URL existante.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev:turbo',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
        env: {
          // Les tests E2E s'exécutent tous depuis la même adresse IP : la limite
          // d'inscription (5 par heure) serait atteinte par les tests eux-mêmes.
          // Les limites restent actives, mais élargies. Cette variable est
          // **ignorée en production** (voir src/lib/rate-limit.ts).
          RATE_LIMIT_MULTIPLIER: '200',
        },
      },
});
