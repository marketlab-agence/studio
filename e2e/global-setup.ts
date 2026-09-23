import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { assertSafeDatabase, purgeTestData } from './helpers/purge';

/**
 * Purge AVANT la suite : c'est ce qui rend le dispositif auto-réparant.
 *
 * ⚠️ Un passage interrompu (Ctrl+C, plantage) laisse forcément des résidus.
 * Nettoyer seulement après ne suffirait pas : les résidus du passage raté
 * s'accumuleraient jusqu'au prochain arrêt normal, qui peut ne jamais venir.
 * Nettoyer avant garantit qu'aucun résidu ne survit à plus d'une exécution.
 */
export default async function globalSetup(): Promise<void> {
  // Playwright n'exécute pas Next : `.env.local` doit être chargé explicitement.
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
      `  Purge avant E2E : ${rapport.organizations} organisation(s) de test, ` +
        `${rapport.orphanUsers} utilisateur(s) orphelin(s).`,
    );
  } finally {
    // ⚠️ Fermer le pool est obligatoire : sans cela, Playwright ne rend pas la
    // main et le processus est tué de force après un avertissement.
    await pool.end();
  }
}
