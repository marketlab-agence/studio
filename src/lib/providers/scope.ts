import { query } from '@/lib/db/pool';
import { assertScope, type OrgScope } from './types';

/**
 * Résout le scope d'organisation de la requête courante.
 *
 * ⚠️ PONT TEMPORAIRE (phase 3)
 * L'authentification n'est pas encore migrée : elle l'est en **phase 4**
 * (JWT + cookie de session). En attendant, l'application ne comporte qu'une
 * organisation (celle du seed), et c'est elle qui est retournée.
 *
 * En phase 4, cette fonction lira l'utilisateur et son organisation depuis la
 * session — **aucun appelant n'aura à changer**, puisque tous passent déjà par
 * elle. C'est précisément l'intérêt de la passer par une fonction dédiée plutôt
 * que de coder une organisation en dur dans les providers.
 */

const FALLBACK_ROLE = 'Super Admin' as const;

let cachedScope: OrgScope | null = null;

export async function getRequestScope(): Promise<OrgScope> {
  if (cachedScope) return cachedScope;

  const { rows } = await query<{ organization_id: string; user_id: string; role: string }>(
    `SELECT o.id AS organization_id, u.id AS user_id, u.role
     FROM organizations o
     JOIN users u ON u.organization_id = o.id
     ORDER BY
       -- Privilégier un compte d'administration pour le scope par défaut.
       CASE u.role WHEN 'Super Admin' THEN 0 WHEN 'Propriétaire' THEN 1 WHEN 'Admin' THEN 2 ELSE 3 END,
       o.created_at
     LIMIT 1`,
  );

  if (rows.length === 0) {
    throw new Error(
      "Aucune organisation en base : exécuter `npm run db:migrate` puis `npm run db:seed`.",
    );
  }

  cachedScope = assertScope({
    organizationId: rows[0].organization_id,
    userId: rows[0].user_id,
    role: (rows[0].role as OrgScope['role']) ?? FALLBACK_ROLE,
  });

  return cachedScope;
}

/** Réinitialise le cache (tests, changement de session). */
export function resetRequestScope(): void {
  cachedScope = null;
}
