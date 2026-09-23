import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { assertSafeDatabase, purgeTestData } from './helpers/purge';

/**
 * Purge manuelle (`npm run db:cleanup-e2e`) — réutilise le module des hooks.
 * Utile quand la base est déjà polluée sans vouloir lancer toute la suite E2E.
 */
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

async function run(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL absent : la purge ne peut pas déterminer sa cible.');
  }
  assertSafeDatabase(url);

  const pool = new Pool({ connectionString: url });
  try {
    const rapport = await purgeTestData(pool);
    console.log('✔ Purge des données de test terminée');
    console.log(`  organisations supprimées : ${rapport.organizations}`);
    console.log(`  utilisateurs orphelins   : ${rapport.orphanUsers}`);
  } finally {
    await pool.end();
  }
}

run().catch((erreur) => {
  console.error('✖ Échec de la purge :', erreur);
  process.exit(1);
});
