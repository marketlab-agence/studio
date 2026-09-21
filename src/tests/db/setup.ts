import { afterAll } from '@jest/globals';
import { Pool } from 'pg';

/**
 * URL de la base de test.
 * Port 5433 : évite le conflit avec les autres projets locaux sur 5432.
 * Voir .env.example (TEST_DATABASE_URL).
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5433/katalyst_test';

export const pool = new Pool({ connectionString: TEST_DATABASE_URL });

// Les providers applicatifs lisent DATABASE_URL. En test, ils doivent viser la
// base de test — jamais la base de développement.
process.env.DATABASE_URL ??= TEST_DATABASE_URL;

/** Indique si la base de test est joignable. */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch {
    return false;
  }
}

/**
 * Exige une base joignable avant d'exécuter le test.
 *
 * Échoue par défaut — volontairement : un test qui n'interroge jamais la base
 * ne prouve rien. Un « vert » doit signifier « la base a réellement été testée ».
 *
 * `SKIP_DB_IF_UNAVAILABLE=1` autorise un report, toujours annoncé explicitement
 * (jamais silencieux) : le test passe alors sans rien vérifier.
 */
export async function requireDatabaseOrSkip(): Promise<boolean> {
  if (await isDatabaseAvailable()) return true;

  const message =
    'PostgreSQL de test injoignable.\n' +
    '  Démarrer la base : docker compose -f docker-compose.dev.yml up -d\n' +
    '  (port 5433 — voir DATABASE_URL/TEST_DATABASE_URL)';

  if (process.env.SKIP_DB_IF_UNAVAILABLE === '1') {
    console.warn(`⚠ ${message}\n  → Test REPORTÉ (non exécuté) : ce n'est PAS une preuve de bon fonctionnement.`);
    return false;
  }

  throw new Error(message);
}

afterAll(async () => {
  await pool.end();
});
