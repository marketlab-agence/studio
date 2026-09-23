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
 * ⚠️ **Pourquoi deux marqueurs combinés, et pas un seul.**
 * Un nettoyage qui supprimerait « tout sauf l'organisation principale » pourrait
 * effacer une organisation créée légitimement à la main. Le relevé de la base de
 * développement le prouve : `khalipha-ababacar-ndiaye-fbc564` est une organisation
 * réelle, créée hors des tests. Un préfixe seul serait insuffisant — les tests
 * utilisent `institut-`, `nouveau-`, `apprenant-`, qui sont des débuts de nom
 * parfaitement plausibles pour une organisation réelle (`institut-national`).
 * Un suffixe aléatoire seul serait insuffisant aussi : l'organisation réelle
 * citée en porte un.
 *
 * **Un résidu de test est donc identifié par la conjonction** : un préfixe
 * connu **ET** le suffixe aléatoire à 6 caractères hexadécimaux posé par
 * `RUN` (`Date.now().toString(36)` + identifiant). `institut-national` est
 * préservé ; `institut-e2e-027393` est purgé.
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
  'persistant-',
  'reprise-',
  'decoche-',
];

/**
 * Suffixe aléatoire à 6 caractères hexadécimaux, en fin de slug.
 *
 * ⚠️ **Indispensable en plus du préfixe.** Sans lui, `institut-national` — une
 * organisation réelle — serait supprimée. Vérifié le 2026-09-23 : les 677
 * organisations de test le portent, sans exception.
 */
export const TEST_ORG_SLUG_SUFFIX = '-[0-9a-f]{6}$';

/** Domaine réservé aux comptes E2E — aucun compte réel ne le porte. */
export const TEST_EMAIL_MARKER = '%@e2e.local';

export interface PurgeReport {
  organizations: number;
  orphanUsers: number;
}

/**
 * Refuse de purger une base qui n'est pas celle du développement.
 *
 * ⚠️ **Liste blanche, pas liste noire.** Exclure seulement le port 5432
 * laisserait passer n'importe quelle autre cible — une base distante, une
 * préproduction. La règle du projet est que la purge vise **le port 5433**
 * (`katalyst-postgres`) et rien d'autre : c'est donc la présence de `:5433`
 * qui est exigée, pas l'absence d'un port connu.
 *
 * ⚠️ Un nettoyage est destructeur par nature : viser la mauvaise base par une
 * variable d'environnement mal réglée effacerait des données réelles.
 */
export function assertSafeDatabase(url: string): void {
  const urlMasquee = masquerMotDePasse(url);

  if (/masterplan365/i.test(url)) {
    throw new Error(
      `Purge refusée : l'URL vise masterplan365 (lecture seule). URL reçue : ${urlMasquee}`,
    );
  }

  if (!/[:@]5433\b/.test(url)) {
    throw new Error(
      `Purge refusée : l'URL ne vise pas le port 5433 (base autorisée). URL reçue : ${urlMasquee}`,
    );
  }
}

/**
 * Masque le mot de passe pour qu'il ne soit jamais écrit dans un journal.
 *
 * ⚠️ **Un remplacement naïf ne suffit pas.** Une expression comme
 * `/:[^:@]*@/` s'arrête au premier `:` du mot de passe : `u:pa:ss@h` devient
 * `u:pa:***@h`, et `pa` fuit. On s'appuie donc sur le parseur d'URL, qui
 * connaît la structure réelle de la chaîne.
 */
function masquerMotDePasse(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    // URL non analysable : ne rien afficher plutôt que risquer une fuite.
    return '<URL illisible>';
  }
}

/** Supprime les données de test. Idempotent. */
export async function purgeTestData(pool: Pool): Promise<PurgeReport> {
  // Toutes les FK vers `organizations` sont en ON DELETE CASCADE : une seule
  // instruction suffit pour l'organisation et toutes ses dépendances.
  const prefixes = TEST_ORG_SLUG_PREFIXES.map((prefixe) => `${prefixe}%`);
  const organisations = await pool.query(
    `DELETE FROM organizations
     WHERE slug LIKE ANY($1::text[]) AND slug ~ $2`,
    [prefixes, TEST_ORG_SLUG_SUFFIX],
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
