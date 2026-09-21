import { Pool } from 'pg';

/**
 * Pool PostgreSQL singleton.
 *
 * En développement, Next recharge les modules à chaud : sans référence
 * globale, chaque rechargement créerait un pool supplémentaire jusqu'à
 * épuiser les connexions disponibles. Le pool est donc conservé sur
 * `globalThis`, qui survit au rechargement des modules.
 *
 * Accès : toujours passer par `getPool()` ou `query()`.
 */

const globalForPool = globalThis as unknown as { __katalystPool?: Pool };

/** Retourne le pool partagé, en le créant à la première utilisation. */
export function getPool(): Pool {
  if (!globalForPool.__katalystPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL est absent. Copier `.env.example` en `.env.local` et renseigner la connexion PostgreSQL.',
      );
    }

    globalForPool.__katalystPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return globalForPool.__katalystPool;
}

/** Exécute une requête sur le pool partagé. */
export function query<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}

/** Ferme le pool (tests, arrêt propre). */
export async function closePool(): Promise<void> {
  if (globalForPool.__katalystPool) {
    await globalForPool.__katalystPool.end();
    globalForPool.__katalystPool = undefined;
  }
}
