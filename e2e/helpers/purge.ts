import type { Pool } from 'pg';

/**
 * Suppression des données créées par les tests E2E.
 *
 * ⚠️ **Pourquoi un module partagé.**
 * Les E2E écrivent dans la base de développement (via `DATABASE_URL`) et ne
 * nettoyaient rien : 673 organisations de test et 602 utilisateurs fantômes
 * s'y étaient accumulés. La logique est donc centralisée ici, appelée par le
 * setup global, le teardown global et un script npm — un seul code à maintenir.
 *
 * ⚠️ **Pourquoi des marqueurs stricts.**
 * Un nettoyage qui supprimerait « tout sauf l'organisation principale » pourrait
 * effacer une organisation créée légitimement à la main. Seuls des marqueurs
 * explicites et observables sont retenus : la purge ne peut pas, par
 * construction, viser une donnée réelle.
 */

/** Préfixes de slug utilisés par les tests E2E. Observés en base, non supposés. */
export const TEST_ORG_SLUG_PREFIXES: readonly string[] = [
  'test-',
  'formateur-e2e-',
  'institut-',
  'compte-connu-',
  'apprenant-',
  'diag-',
  'invalide-',
  'nouveau-',
  'hors-org-',
];

/** Domaine réservé aux comptes E2E — aucun compte réel ne le porte. */
export const TEST_EMAIL_MARKER = '%@e2e.local';

export interface PurgeReport {
  organizations: number;
  orphanUsers: number;
}

/**
 * Refuse de purger une base qui n'est pas celle du développement.
 *
 * ⚠️ Un nettoyage est destructeur par nature : viser la mauvaise base par une
 * variable d'environnement mal réglée effacerait des données réelles. Le port
 * 5432 héberge un autre projet (lecture seule) ; `masterplan365` n'est jamais
 * une cible légitime.
 */
export function assertSafeDatabase(url: string): void {
  if (url.includes(':5432')) {
    throw new Error(
      `Purge refusée : l'URL vise le port 5432 (autre projet). Attendu : 5433. URL reçue : ${url.replace(/:[^:@]*@/, ':***@')}`,
    );
  }
  if (/masterplan365/i.test(url)) {
    throw new Error(
      `Purge refusée : l'URL vise masterplan365 (lecture seule). URL reçue : ${url.replace(/:[^:@]*@/, ':***@')}`,
    );
  }
}

/** Supprime les données de test. Idempotent. */
export async function purgeTestData(pool: Pool): Promise<PurgeReport> {
  // Toutes les FK vers `organizations` sont en ON DELETE CASCADE : une seule
  // instruction suffit et garantit l'atomicité (aucun état intermédiaire).
  const slugs = TEST_ORG_SLUG_PREFIXES.map((prefixe) => `${prefixe}%`);
  const organisations = await pool.query(
    `DELETE FROM organizations WHERE slug LIKE ANY($1::text[])`,
    [slugs],
  );

  // Second passage nécessaire : `e2e/progress.spec.ts` réaffecte explicitement
  // des comptes de test à la première organisation, ils survivent donc à la
  // cascade. Aucun compte au vrai email ne porte ce marqueur.
  const orphelins = await pool.query(`DELETE FROM users WHERE email LIKE $1`, [TEST_EMAIL_MARKER]);

  return {
    organizations: organisations.rowCount ?? 0,
    orphanUsers: orphelins.rowCount ?? 0,
  };
}
