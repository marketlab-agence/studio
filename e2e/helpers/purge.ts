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
 * ⚠️ **Pourquoi une liste de préfixes ET une liste de formes exactes.**
 * Un nettoyage qui supprimerait « tout sauf l'organisation principale » pourrait
 * effacer une organisation créée légitimement à la main. Le relevé de la base de
 * développement le prouve : `khalipha-ababacar-ndiaye-fbc564` est une organisation
 * réelle, créée hors des tests.
 *
 * ⚠️ **Le suffixe aléatoire ne protège pas.** L'application en pose un sur
 * *toute* organisation (`jwt.ts:216`) : une organisation réelle « Institut
 * National » devient `institut-national-<hex6>`, indiscernable d'une fixture
 * par son suffixe. Le seul critère valable est donc **le nom lui-même** : est
 * retenu ce qu'aucun organisme réel ne s'appellerait (voir les deux listes).
 */

/**
 * Préfixes de slug utilisés par les tests E2E. Observés en base, non supposés.
 *
 * ⚠️ **Chaque préfixe doit être un nom qu'une organisation réelle ne porterait
 * pas.** C'est le critère de sélection, et il est plus strict qu'il n'y paraît :
 * l'application génère elle-même un suffixe aléatoire pour **toute**
 * organisation (`jwt.ts:216`, `slugify(nom)-<hex6>`). Le suffixe ne protège
 * donc rien — une organisation réelle « Institut National » deviendrait
 * `institut-national-<hex6>` et serait indistinguable d'une fixture par son
 * seul suffixe.
 *
 * Sont retenus les préfixes qui sont des **noms de fixture** : aucun organisme
 * réel ne s'appelle « test », « diag », « invalide », « compte connu » ou
 * « apprenant iso-a ». Sont écartés ceux qui sont des **débuts de nom
 * plausibles** : `institut-` (Institut National), `nouveau-` (Nouveau Projet),
 * ainsi que `persistant-`, `reprise-`, `decoche-`, qui n'étaient que des
 * variantes déjà couvertes par `apprenant-` et élargissaient la surface sans
 * bénéfice.
 */
export const TEST_ORG_SLUG_PREFIXES: readonly string[] = [
  'test-',
  'formateur-e2e-',
  'compte-connu-',
  'hors-org-',
  'apprenant-',
  'diag-',
  'invalide-',
];

/**
 * Noms d'organisation littéraux des fixtures, préfixés par leur slug.
 *
 * ⚠️ **Pourquoi une liste distincte.** `institut-e2e`, `institut-liste`,
 * `institut-page`, `institut-expire`, `institut-parcours` viennent de
 * `e2e/invitation.spec.ts`, où les noms sont **codés en dur** (`'Institut E2E'`,
 * `'Institut Parcours'`…). Le préfixe `institut-` seul serait dangereux
 * (« Institut National ») ; ces cinq formes ne le sont pas. Les citer
 * explicitement garde la protection et reste honnête sur ce qui est purgé.
 */
export const TEST_ORG_SLUG_EXACT_FIXTURES: readonly string[] = [
  'institut-e2e',
  'institut-liste',
  'institut-page',
  'institut-expire',
  'institut-parcours',
];


/** Domaine réservé aux comptes E2E — aucun compte réel ne le porte. */
export const TEST_EMAIL_MARKER = '%@e2e.local';

/**
 * Plafond de suppressions par exécution.
 *
 * ⚠️ **Pourquoi un plafond, alors que les motifs sont déjà stricts.**
 * Les marqueurs sont volontairement précis, mais ils reposent sur des noms :
 * une faute de frappe dans la liste (`test-` devenu `t-`), ou un futur spec qui
 * crée 500 organisations, transformerait une purge légitime en suppression de
 * masse sans que personne ne le voie. Le plafond est le dernier filet : au-delà,
 * on **préfère échouer bruyamment** plutôt que de continuer à supprimer.
 *
 * ⚠️ La valeur est **le double** du plus gros volume observé (une exécution
 * complète de la suite crée ~35 organisations, cf. mesure du 2026-09-23). Elle
 * laisse donc une marge confortable sans jamais devenir un permis de tout effacer.
 */
export const MAX_PURGE_ORGANIZATIONS = 700;

export interface PurgeReport {
  organizations: number;
  orphanUsers: number;
}

/** Options internes — le plafond est injectable pour être réellement testable. */
export interface PurgeOptions {
  /** Plafond de suppressions ; par défaut `MAX_PURGE_ORGANIZATIONS`. */
  maxOrganizations?: number;
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
export async function purgeTestData(pool: Pool, options: PurgeOptions = {}): Promise<PurgeReport> {
  const plafond = options.maxOrganizations ?? MAX_PURGE_ORGANIZATIONS;

  // Toutes les FK vers `organizations` sont en ON DELETE CASCADE : une seule
  // instruction suffit pour l'organisation et toutes ses dépendances.
  const prefixes = TEST_ORG_SLUG_PREFIXES.map((prefixe) => `${prefixe}%`);
  const fixtures = TEST_ORG_SLUG_EXACT_FIXTURES.map((nom) => `${nom}-%`);

  // ⚠️ On **compte d'abord**, on supprime ensuite. Un `DELETE` ne rend le nombre
  // de lignes touchées qu'après coup : le plafond serait alors vérifié trop tard,
  // une fois les données perdues. Le comptage préalable rend le garde-fou
  // réellement protecteur.
  const { rows: compte } = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM organizations
     WHERE slug LIKE ANY($1::text[]) OR slug LIKE ANY($2::text[])`,
    [prefixes, fixtures],
  );

  if (compte[0].n > plafond) {
    throw new Error(
      `Purge refusée : ${compte[0].n} organisations correspondent aux marqueurs, ` +
        `au-delà du plafond de ${plafond}. C'est le signe probable d'un marqueur ` +
        'trop large. Vérifier TEST_ORG_SLUG_PREFIXES avant de relancer.',
    );
  }

  const organisations = await pool.query(
    `DELETE FROM organizations
     WHERE slug LIKE ANY($1::text[]) OR slug LIKE ANY($2::text[])`,
    [prefixes, fixtures],
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
