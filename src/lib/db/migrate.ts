import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { getPool, closePool } from './pool';

// Un script autonome ne bénéficie pas du chargement automatique de Next :
// on charge explicitement .env.local (prioritaire) puis .env.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

/**
 * Applique les migrations SQL non encore exécutées.
 *
 * - Les fichiers sont lus dans `src/lib/db/migrations/`, triés par nom.
 * - Chaque migration s'exécute dans une transaction : échec = rollback complet.
 * - La table `migrations` garde la trace de ce qui a été appliqué (idempotence).
 *
 * Usage : npm run db:migrate
 */

const MIGRATIONS_DIR = join(process.cwd(), 'src', 'lib', 'db', 'migrations');

async function run(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query<{ name: string }>('SELECT name FROM migrations');
    const applied = new Set(rows.map((row) => row.name));

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const pending = files.filter((file) => !applied.has(file));

    if (pending.length === 0) {
      console.log('✔ Aucune migration en attente.');
      return;
    }

    for (const file of pending) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');

      console.log(`→ ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log(`✔ ${pending.length} migration(s) appliquée(s).`);
  } finally {
    client.release();
    await closePool();
  }
}

run().catch((error) => {
  console.error('✖ Échec des migrations :', error);
  process.exit(1);
});
