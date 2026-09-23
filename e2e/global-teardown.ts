import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { assertSafeDatabase, purgeTestData } from './helpers/purge';

/**
 * Purge APRÈS la suite : la base de développement est laissée dans l'état où
 * les tests l'ont trouvée, aux données réelles près.
 */
export default async function globalTeardown(): Promise<void> {
  loadEnv({ path: '.env.local' });
  loadEnv({ path: '.env' });

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL absent : la purge E2E ne peut pas déterminer sa cible.');
  }
  assertSafeDatabase(url);

  const pool = new Pool({ connectionString: url });
  try {
    const rapport = await purgeTestData(pool);
    console.log(
      `  Purge après E2E : ${rapport.organizations} organisation(s) de test, ` +
        `${rapport.orphanUsers} utilisateur(s) orphelin(s).`,
    );
  } finally {
    await pool.end();
  }
}
