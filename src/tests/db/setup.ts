import { afterAll } from '@jest/globals';
import { Pool } from 'pg';

/**
 * URL de la base de test. Par défaut, la base créée par docker/init/01-init.sql.
 * Voir .env.example (TEST_DATABASE_URL).
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/katalyst_test';

export const pool = new Pool({ connectionString: TEST_DATABASE_URL });

/**
 * Indique si la base de test est joignable.
 * Permet un report gracieux en développement quand Docker n'est pas lancé.
 */
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
 * Garde-fou : si REQUIRE_DB=1 (CI), l'absence de base est une erreur.
 * Sinon, les tests concernés se reportent avec un avertissement explicite.
 */
export async function requireDatabaseOrSkip(): Promise<boolean> {
  const available = await isDatabaseAvailable();
  if (available) return true;

  const message =
    'PostgreSQL indisponible — lancer « docker compose -f docker-compose.dev.yml up -d ».';

  if (process.env.REQUIRE_DB === '1') {
    throw new Error(message);
  }

  console.warn(`⚠ ${message} Test reporté.`);
  return false;
}

afterAll(async () => {
  await pool.end();
});
