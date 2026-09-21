import { config as loadEnv } from 'dotenv';
import admin from 'firebase-admin';
import { getPool, closePool } from './pool';

// Un script autonome ne bénéficie pas du chargement automatique de Next.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

if (process.argv.includes('--test')) {
  if (!process.env.TEST_DATABASE_URL) {
    console.error('✖ --test demandé mais TEST_DATABASE_URL est absent.');
    process.exit(1);
  }
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

/**
 * Importe les comptes Firebase Auth dans PostgreSQL (T2.5).
 *
 * ⚠️ CE QUI EST POSSIBLE ET CE QUI NE L'EST PAS
 *   ✅ L'Admin SDK expose la liste des comptes (uid, email, nom, fournisseurs)
 *      — sans facturation.
 *   ❌ Les **mots de passe ne sont jamais exportables** par Firebase.
 *
 * Conséquence : les comptes à mot de passe sont importés avec
 * `password_hash = NULL` et `must_reset_password = true` — l'utilisateur devra
 * définir un nouveau mot de passe à sa première connexion (flux de la phase 4).
 * Les comptes Google se reconnectent directement (aucun mot de passe local).
 *
 * Idempotent : `ON CONFLICT (email)` — rejouer ne duplique rien et ne réécrase
 * ni le rôle ni la formule déjà attribués localement.
 *
 * Usage : npm run db:import-auth
 */

interface ImportedAccount {
  email: string;
  name: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  disabled: boolean;
  lastSignIn: string | null;
}

function initializeAdmin(): void {
  if (admin.apps.length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Identifiants Firebase Admin absents (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).',
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

/** Récupère tous les comptes, en paginant (l'API limite à 1000 par page). */
async function listAccounts(): Promise<ImportedAccount[]> {
  const accounts: ImportedAccount[] = [];
  let pageToken: string | undefined;

  do {
    const page = await admin.auth().listUsers(1000, pageToken);

    for (const user of page.users) {
      if (!user.email) continue;

      const providers = (user.providerData ?? []).map((provider) => provider.providerId);

      accounts.push({
        email: user.email,
        name: user.displayName ?? user.email,
        hasPassword: providers.includes('password'),
        hasGoogle: providers.includes('google.com'),
        disabled: user.disabled,
        lastSignIn: user.metadata?.lastSignInTime ?? null,
      });
    }

    pageToken = page.pageToken;
  } while (pageToken);

  return accounts;
}

async function run(): Promise<void> {
  initializeAdmin();

  const accounts = await listAccounts();
  if (accounts.length === 0) {
    console.log('ℹ Aucun compte Firebase Auth à importer.');
    return;
  }

  const client = await getPool().connect();
  let inserted = 0;
  let updated = 0;

  try {
    await client.query('BEGIN');

    const { rows: orgRows } = await client.query<{ id: string }>(
      'SELECT id FROM organizations ORDER BY created_at LIMIT 1',
    );
    if (orgRows.length === 0) {
      throw new Error("Aucune organisation : lancer d'abord `npm run db:seed`.");
    }
    const organizationId = orgRows[0].id;

    for (const account of accounts) {
      // Fournisseur Google : pas de mot de passe local, pas de réinitialisation.
      // Mot de passe Firebase : hachage non exportable → réinitialisation forcée.
      const requireReset = account.hasPassword && !account.hasGoogle;

      const result = await client.query(
        `INSERT INTO users (
           organization_id, email, name, role, plan_id, status, last_login, must_reset_password
         )
         VALUES ($1, $2, $3, 'Utilisateur', 'free', $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           -- On ne touche ni au rôle ni à la formule : ils sont gérés localement.
           name = EXCLUDED.name,
           last_login = COALESCE(EXCLUDED.last_login, users.last_login),
           must_reset_password = users.must_reset_password OR EXCLUDED.must_reset_password
         RETURNING (xmax = 0) AS inserted`,
        [
          organizationId,
          account.email,
          account.name,
          account.disabled ? 'Inactif' : 'Actif',
          account.lastSignIn ? new Date(account.lastSignIn) : null,
          requireReset,
        ],
      );

      if (result.rows[0]?.inserted) inserted += 1;
      else updated += 1;
    }

    await client.query('COMMIT');

    const withPassword = accounts.filter((a) => a.hasPassword && !a.hasGoogle).length;
    const withGoogle = accounts.filter((a) => a.hasGoogle).length;

    console.log('✔ Import Firebase Auth terminé');
    console.log(`  comptes lus       : ${accounts.length}`);
    console.log(`  insérés           : ${inserted}`);
    console.log(`  mis à jour        : ${updated}`);
    console.log(`  réinit. mot passe : ${withPassword} (hachages non exportables par Firebase)`);
    console.log(`  reconnexion Google: ${withGoogle}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

run().catch((error) => {
  console.error('✖ Échec de l’import Firebase Auth :', error);
  process.exit(1);
});
