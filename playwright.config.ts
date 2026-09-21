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
  //
  // ⚠️ PIÈGE : `reuseExistingServer` réutilise N'IMPORTE QUEL serveur déjà à
  // l'écoute sur le port. Si ce serveur a été démarré AVANT l'ajout d'une
  // variable d'environnement (ici RATE_LIMIT_MULTIPLIER), il ne la connaît pas,
  // et les tests échouent avec des « 429 » déroutants au lieu d'une erreur
  // explicite. En cas d'échecs 429 inattendus : arrêter les `next dev` en cours
  // avant de relancer.
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
          // ⚠️ Playwright REMPLACE l'environnement du serveur par cet objet, il
          // ne le complète pas : sans la recopie de `process.env`, le serveur
          // perdrait PATH, NODE_ENV et les variables de `.env.local`, et la
          // limite de débit retomberait à sa valeur stricte (5 inscriptions par
          // heure) — les tests échoueraient alors en 429 sans explication.
          ...process.env,
          // Les tests E2E s'exécutent tous depuis la même adresse IP : la limite
          // d'inscription serait atteinte par les tests eux-mêmes. Les limites
          // restent actives, mais élargies. Cette variable est **ignorée en
          // production** (voir src/lib/rate-limit.ts).
          RATE_LIMIT_MULTIPLIER: '200',
        },
      },
});
