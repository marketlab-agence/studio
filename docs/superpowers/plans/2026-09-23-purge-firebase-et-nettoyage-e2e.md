# Purge Firebase et nettoyage des données de test E2E — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éliminer le couplage Firebase résiduel et faire nettoyer automatiquement par les E2E les données qu'ils créent, sans jamais toucher aux données réelles.

**Architecture:** Un module unique `e2e/helpers/purge.ts` porte toute la logique de suppression et est appelé par trois chemins (setup global, teardown global, script npm). La purge Firebase se fait en 4 vagues vérifiées, dont 3 exécutées ici ; les artefacts de déploiement sont renvoyés à une phase 8.

**Tech Stack:** TypeScript, Playwright (globalSetup/globalTeardown), `pg`, Jest (projet `db` sur `katalyst_test`), PostgreSQL 16.

**Spec:** `docs/superpowers/specs/2026-09-23-purge-firebase-et-nettoyage-e2e-design.md`

## Global Constraints

- Langue du code et des commentaires : **français**.
- Aucun commentaire décoratif : les commentaires expliquent **pourquoi**, jamais **quoi**.
- Ne jamais modifier le projet `masterplan365` (port 5432) — lecture seule.
- Ne jamais afficher ni commiter de mot de passe ni de secret.
- PostgreSQL : port **5433** (`katalyst-postgres`). Port 5432 = autre projet, interdit.
- Un seul `next dev` à la fois (EPERM sur `.next/trace`).
- Tests DB stricts : base injoignable = **échec**, jamais un report silencieux.
- La purge ne doit **jamais** supprimer : l'organisation de slug exact `katalyst`, les comptes à email réel, toute organisation sans marqueur.
- Marqueurs de test (exacts) : slugs préfixés `test-`, `formateur-e2e-`, `institut-`, `compte-connu-`, `apprenant-`, `diag-`, `invalide-`, `nouveau-`, `hors-org-` ; emails en `@e2e.local`.
- Une commande par étape, exécutable telle quelle depuis la racine du dépôt.
- Commit après chaque tâche. Arbre git propre à la fin de chaque tâche.

---

### Task 1 : Module de purge (tests d'abord)

**Files:**
- Create: `e2e/helpers/purge.ts`
- Test: `src/tests/db/purge.db.test.ts`

**Interfaces:**
- Consumes: rien (première tâche).
- Produces:
  - `export interface PurgeReport { organizations: number; orphanUsers: number }`
  - `export const TEST_ORG_SLUG_PREFIXES: readonly string[]`
  - `export const TEST_EMAIL_MARKER = '%@e2e.local'`
  - `export function assertSafeDatabase(url: string): void` — lève une `Error` si l'URL vise une base interdite
  - `export async function purgeTestData(pool: Pool): Promise<PurgeReport>`

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/tests/db/purge.db.test.ts` :

```ts
import { Pool } from 'pg';
import { pool, requireDatabaseOrSkip, TEST_DATABASE_URL } from './setup';
import { assertSafeDatabase, purgeTestData } from '../../../e2e/helpers/purge';

/**
 * Vérifie que la purge E2E supprime les données de test SANS jamais toucher
 * aux données réelles. Sur `katalyst_test` : la base est seedée, donc
 * l'organisation « katalyst » et ses comptes existent réellement.
 */
describe('purgeTestData', () => {
  const MARQUEUR_ORG = 'test-purge-fixture';
  const EMAIL_TEST = 'purge-fixture@e2e.local';

  beforeAll(async () => {
    await requireDatabaseOrSkip();
  });

  afterEach(async () => {
    await pool.query('DELETE FROM organizations WHERE slug = $1', [MARQUEUR_ORG]);
    await pool.query('DELETE FROM users WHERE email = $1', [EMAIL_TEST]);
  });

  it('supprime une organisation marquée et ses dépendances en cascade', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO organizations (name, slug) VALUES ('Purge Fixture', $1) RETURNING id`,
      [MARQUEUR_ORG],
    );
    const orgId = rows[0].id;
    await pool.query(
      `INSERT INTO users (organization_id, email, name, role, status)
       VALUES ($1, $2, 'Fixture', 'Utilisateur', 'Actif')`,
      [orgId, EMAIL_TEST],
    );

    const report = await purgeTestData(pool);

    expect(report.organizations).toBeGreaterThanOrEqual(1);
    const restantes = await pool.query('SELECT id FROM organizations WHERE id = $1', [orgId]);
    expect(restantes.rowCount).toBe(0);
    const utilisateurs = await pool.query('SELECT id FROM users WHERE email = $1', [EMAIL_TEST]);
    expect(utilisateurs.rowCount).toBe(0);
  });

  it('préserve l’organisation katalyst', async () => {
    await purgeTestData(pool);

    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM organizations WHERE slug = 'katalyst'`,
    );
    expect(rows.length).toBe(1);
  });

  it('préserve un utilisateur au vrai email', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT u.id FROM users u JOIN organizations o ON o.id = u.organization_id
       WHERE o.slug = 'katalyst' AND u.email NOT LIKE '%@e2e.local' LIMIT 1`,
    );
    expect(rows.length).toBe(1);

    await purgeTestData(pool);

    const apres = await pool.query('SELECT id FROM users WHERE id = $1', [rows[0].id]);
    expect(apres.rowCount).toBe(1);
  });

  it('supprime les utilisateurs @e2e.local orphelins rattachés à katalyst', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM organizations WHERE slug = 'katalyst'`,
    );
    await pool.query(
      `INSERT INTO users (organization_id, email, name, role, status)
       VALUES ($1, $2, 'Orphelin', 'Utilisateur', 'Actif')`,
      [rows[0].id, EMAIL_TEST],
    );

    const report = await purgeTestData(pool);

    expect(report.orphanUsers).toBeGreaterThanOrEqual(1);
    const restants = await pool.query('SELECT id FROM users WHERE email = $1', [EMAIL_TEST]);
    expect(restants.rowCount).toBe(0);
  });

  it('est idempotent : deux exécutions donnent le même état', async () => {
    await purgeTestData(pool);
    const premier = await pool.query('SELECT COUNT(*)::int AS n FROM organizations');
    await purgeTestData(pool);
    const second = await pool.query('SELECT COUNT(*)::int AS n FROM organizations');

    expect(second.rows[0].n).toBe(premier.rows[0].n);
  });

  it('refuse une base interdite (port 5432)', () => {
    expect(() =>
      assertSafeDatabase('postgresql://postgres:postgres@localhost:5432/katalyst'),
    ).toThrow(/5432/);
  });

  it('refuse une base masterplan365', () => {
    expect(() =>
      assertSafeDatabase('postgresql://postgres:postgres@localhost:5433/masterplan365'),
    ).toThrow(/masterplan365/i);
  });

  it('accepte la base de test', () => {
    expect(() => assertSafeDatabase(TEST_DATABASE_URL)).not.toThrow();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test:db -- --testPathPattern=purge`
Expected: FAIL — `Cannot find module '../../../e2e/helpers/purge'`

- [ ] **Step 3: Écrire l'implémentation minimale**

Créer `e2e/helpers/purge.ts` :

```ts
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
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test:db -- --testPathPattern=purge`
Expected: PASS — 8 tests

- [ ] **Step 5: Vérifier typecheck et lint**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

- [ ] **Step 6: Commit**

```bash
git add e2e/helpers/purge.ts src/tests/db/purge.db.test.ts
git commit -m "feat(e2e): ajouter le module de purge des donnees de test"
```

---

### Task 2 : Brancher la purge sur Playwright (setup + teardown)

**Files:**
- Create: `e2e/global-setup.ts`
- Create: `e2e/global-teardown.ts`
- Modify: `playwright.config.ts` (ajout de `globalSetup` / `globalTeardown`)
- Modify: `package.json` (ajout de `db:cleanup-e2e`)

**Interfaces:**
- Consumes: `purgeTestData`, `assertSafeDatabase` de `e2e/helpers/purge.ts` (Task 1).
- Produces: deux fonctions par défaut Playwright (`default async function (): Promise<void>`).

- [ ] **Step 1: Écrire le setup global**

Créer `e2e/global-setup.ts` :

```ts
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
```

- [ ] **Step 2: Écrire le teardown global**

Créer `e2e/global-teardown.ts` :

```ts
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
```

- [ ] **Step 3: Brancher les hooks dans la configuration Playwright**

Dans `playwright.config.ts`, ajouter deux clés au `defineConfig`, juste après la ligne `testDir: './e2e',` :

```ts
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
```

- [ ] **Step 4: Ajouter le script npm de purge manuelle**

Dans `package.json`, ajouter dans `"scripts"`, après la ligne `"db:export-content"` :

```json
    "db:cleanup-e2e": "tsx e2e/cleanup-cli.ts",
```

- [ ] **Step 5: Écrire le point d'entrée CLI réutilisant le module**

Créer `e2e/cleanup-cli.ts` :

```ts
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
```

- [ ] **Step 6: Vérifier typecheck et lint**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

- [ ] **Step 7: Commit**

```bash
git add e2e/global-setup.ts e2e/global-teardown.ts e2e/cleanup-cli.ts playwright.config.ts package.json
git commit -m "feat(e2e): purger les donnees de test avant et apres la suite"
```

---

### Task 3 : Preuve en conditions réelles sur la base de développement

**Files:**
- Modify: aucun (tâche de vérification et de nettoyage de l'existant).

**Interfaces:**
- Consumes: `npm run db:cleanup-e2e` (Task 2).
- Produces: aucun artefact de code ; produit une **preuve chiffrée**.

- [ ] **Step 1: Mesurer l'état avant**

Run: `$env:PGPASSWORD='postgres'; & docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT COUNT(*) FROM organizations WHERE slug LIKE 'test-%' OR slug LIKE 'formateur-e2e-%' OR slug LIKE 'institut-%' OR slug LIKE 'compte-connu-%' OR slug LIKE 'apprenant-%' OR slug LIKE 'diag-%' OR slug LIKE 'invalide-%' OR slug LIKE 'nouveau-%' OR slug LIKE 'hors-org-%';"`
Expected: 673 (valeur relevée le 2026-09-23)

- [ ] **Step 2: Lancer la purge réelle**

Run: `npm run db:cleanup-e2e`
Expected: `✔ Purge des données de test terminée` avec des comptes proches de 673 / 602

- [ ] **Step 3: Mesurer l'état après**

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT COUNT(*) FROM organizations WHERE slug LIKE 'test-%' OR slug LIKE 'formateur-e2e-%' OR slug LIKE 'institut-%' OR slug LIKE 'compte-connu-%' OR slug LIKE 'apprenant-%' OR slug LIKE 'diag-%' OR slug LIKE 'invalide-%' OR slug LIKE 'nouveau-%' OR slug LIKE 'hors-org-%';"`
Expected: **0**

- [ ] **Step 4: Vérifier que les données réelles survivent**

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT (SELECT COUNT(*) FROM organizations WHERE slug='katalyst') AS org, (SELECT COUNT(*) FROM users u JOIN organizations o ON o.id=u.organization_id WHERE o.slug='katalyst' AND u.email NOT LIKE '%@e2e.local') AS comptes, (SELECT COUNT(*) FROM courses) AS cours;"`
Expected: `1|11|6` — l'organisation, ses 11 comptes réels, les 6 formations

- [ ] **Step 5: Lancer la suite E2E et vérifier que la purge tient**

Run: `npm run test:e2e`
Expected: 76 passed, et les deux messages de purge (avant / après) dans la sortie

- [ ] **Step 6: Mesurer les résidus après la suite**

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT COUNT(*) FROM organizations WHERE slug LIKE 'test-%' OR slug LIKE 'formateur-e2e-%' OR slug LIKE 'institut-%';"`
Expected: **0** — c'est la preuve que le teardown fonctionne

- [ ] **Step 7: Consigner la preuve dans MEMORY**

Ajouter dans `MEMORY.md`, section des décisions, une ligne :

```markdown
- **Nettoyage E2E** : `e2e/helpers/purge.ts` + `globalSetup`/`globalTeardown`. Purge avant **et** après. Preuve 2026-09-23 : 673 organisations de test → **0**, 11 comptes réels et 6 formations intacts. `npm run db:cleanup-e2e` pour un nettoyage manuel.
```

- [ ] **Step 8: Commit**

```bash
git add MEMORY.md
git commit -m "docs(memory): consigner la preuve du nettoyage E2E"
```

---

### Task 4 : Purge Firebase — Vague 1 (les 3 orphelins)

**Files:**
- Delete: `src/lib/firebase.ts`
- Delete: `src/lib/firebase-admin.ts`
- Delete: `src/lib/local-data.ts`

**Interfaces:**
- Consumes: rien.
- Produces: rien (suppression).

- [ ] **Step 1: Contrôler qu'aucun export n'est consommé ailleurs**

Run: `grep -rn "@/lib/firebase\|@/lib/firebase-admin\|@/lib/local-data" src/ e2e/`
Expected: **aucune sortie**

Run: `grep -rn "getFirebaseAdmin\\|initializeFirebaseAdmin\\|firebaseApp\\|isFirebaseConfigured" src/ e2e/`
Expected: **aucune sortie**

Si l'une des deux commandes produit une ligne, **arrêter** et traiter ce consommateur avant de supprimer.

- [ ] **Step 2: Supprimer les trois fichiers**

Run: `git rm src/lib/firebase.ts src/lib/firebase-admin.ts src/lib/local-data.ts`

- [ ] **Step 3: Vérifier typecheck**

Run: `npm run typecheck`
Expected: 0 erreur

- [ ] **Step 4: Vérifier lint**

Run: `npm run lint`
Expected: 0 erreur

- [ ] **Step 5: Vérifier les tests unitaires**

Run: `npm test`
Expected: 27 suites, 275 tests

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor(firebase): supprimer les modules orphelins (vague 1)"
```

---

### Task 5 : Purge Firebase — Vague 2 (alias et références)

**Files:**
- Modify: `tsconfig.json` (si un alias pointe vers les fichiers supprimés)
- Modify: `jest.config.mjs` (idem)
- Modify: tout fichier contenant une mention résiduelle

**Interfaces:**
- Consumes: Task 4 (fichiers supprimés).
- Produces: rien.

- [ ] **Step 1: Chercher les alias résiduels**

Run: `grep -n "firebase|local-data" tsconfig.json jest.config.mjs`
Expected: lire la sortie et ne retirer que les entrées pointant vers les fichiers supprimés. Si aucune sortie : passer à l'étape 3.

- [ ] **Step 2: Chercher les références textuelles restantes**

Run: `grep -rn "firebase" src/ e2e/` (sensible à la casse : la prose « Firestore » n'est pas ciblée, seule la spec §6.3 fait foi)
Expected: aucune sortie (les fichiers de test peuvent mentionner Firebase dans un commentaire historique — les laisser).

- [ ] **Step 3: Vérifier typecheck**

Run: `npm run typecheck`
Expected: 0 erreur

- [ ] **Step 4: Vérifier lint**

Run: `npm run lint`
Expected: 0 erreur

- [ ] **Step 5: Commit (uniquement s'il y a eu des modifications)**

```bash
git add -A
git commit -m "refactor(firebase): retirer les alias et references residuels (vague 2)"
```

---

### Task 6 : Purge Firebase — Vague 3 (dépendances et scripts obsolètes)

**Files:**
- Delete: `src/lib/db/import-auth.ts`
- Delete: `scripts/migrate-data.js`
- Create: `docs/katalyst/migration-comptes-firebase.md`
- Modify: `package.json` (retrait de `firebase`, `firebase-admin`, `db:import-auth`, `migrate`)

**Interfaces:**
- Consumes: Task 5.
- Produces: rien.

- [ ] **Step 1: Archiver la traçabilité des comptes AVANT de supprimer le script**

Créer `docs/katalyst/migration-comptes-firebase.md` :

```markdown
# Migration des comptes Firebase Auth vers PostgreSQL

**Exécutée le** : 2026-09-21
**Script d'origine** : `src/lib/db/import-auth.ts` (supprimé en phase 7 — Firebase décommissionné)

## Ce qui a été fait

Les comptes Firebase Auth ont été lus via l'Admin SDK (`admin.auth().listUsers`, pagination de 1000)
et insérés dans la table `users` de l'organisation `katalyst`.

**Limite structurelle de Firebase** : les **mots de passe ne sont jamais exportables**. Les comptes
à mot de passe ont donc été importés avec `password_hash = NULL` et `must_reset_password = true`.
Les comptes Google se reconnectent directement via OAuth.

Le script était **idempotent** (`ON CONFLICT (email)`) : le rejouer ne dupliquait rien et ne
réécrasait ni le rôle ni la formule attribués localement.

## Résultat constaté (relevé du 2026-09-23)

**11 comptes** importés, décrits par catégories — les adresses ne sont pas reproduites ici :

| Rôle | Statut | `must_reset_password` | Nature |
|---|---|---|---|
| 1 Super Admin | Actif | non | compte Google |
| 1 Admin | Actif | oui | compte à mot de passe |
| 1 Modérateur | Actif | oui | compte à mot de passe |
| 8 Utilisateurs | 6 actifs, 2 inactifs | oui (1 Google excepté) | comptes à mot de passe |

La distribution confirme le comportement attendu : la réinitialisation forcée frappe les comptes
à mot de passe, jamais les comptes Google.

## Pourquoi le script n'existe plus

Firebase est décommissionné : le script ne peut plus s'exécuter, et conserver un import de
`firebase-admin` recréerait le couplage que la purge vise à éliminer. La trace est conservée ici.
```

- [ ] **Step 2: Supprimer les deux scripts**

Run: `git rm src/lib/db/import-auth.ts scripts/migrate-data.js`

- [ ] **Step 3: Retirer les scripts npm obsolètes**

Dans `package.json`, supprimer les deux lignes :

```json
    "db:import-auth": "tsx src/lib/db/import-auth.ts",
    "migrate": "node scripts/migrate-data.js"
```

(Attention : la dernière ligne du bloc `scripts` ne doit pas garder de virgule finale.)

- [ ] **Step 4: Désinstaller les dépendances**

Run: `npm uninstall firebase firebase-admin --legacy-peer-deps`
Expected: `removed N packages`

- [ ] **Step 5: Vérifier que les paquets ont disparu**

Run: `npm ls firebase firebase-admin`
Expected: sortie vide ou `(empty)` — **aucune** mention de `firebase` ou `firebase-admin`

- [ ] **Step 6: Vérifier typecheck**

Run: `npm run typecheck`
Expected: 0 erreur

- [ ] **Step 7: Vérifier lint**

Run: `npm run lint`
Expected: 0 erreur

- [ ] **Step 8: Vérifier TOUS les tests**

Run: `npm test`
Expected: 27 suites, 275 tests

Run: `npm run test:db`
Expected: 16 suites (15 + la nouvelle suite `purge`), tests verts

- [ ] **Step 9: Vérifier le grep final — 0 occurrence dans le code**

Run: `grep -rn "firebase\|firestore" src/ scripts/ e2e/`
Expected: aucune sortie

Run: `grep -n "firebase" jest.config.mjs`
Expected: aucune sortie — `ESM_DEPS` contenait `'firebase'` et `'@firebase'` (lignes 18-19), devenus morts après la désinstallation. `jest.config.mjs` n'était pas couvert par le grep ci-dessus : sans cette seconde commande, ces deux lignes survivraient silencieusement.

- [ ] **Step 10: Retirer les entrées mortes de `jest.config.mjs`**

Si l'étape 9 en a trouvé, supprimer `'firebase'` et `'@firebase'` du tableau `ESM_DEPS` dans `jest.config.mjs`.

⚠️ Ne retirer que ces deux entrées : les autres (`jose`, `otplib`…) sont toujours nécessaires, et `jest.config.mjs` est commenté pour expliquer pourquoi chacune existe.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor(firebase): retirer les dependances et les scripts obsoletes (vague 3)"
```

---

### Task 7 : Retirer les variables d'environnement Firebase et purger la documentation obsolète

**Files:**
- Modify: `.env.local` (retrait des `FIREBASE_*`)
- Modify: `.env.example` (retrait des mêmes clés, si présentes)
- Modify: `AGENTS.md` (8 références cassées)
- Modify: `MEMORY.md` (2 références cassées)
- Modify: `dev-spec/firebase-admin-guideline.md` (documente un fichier supprimé)

**Interfaces:**
- Consumes: Task 6.
- Produces: rien.

- [ ] **Step 1: Lister les variables Firebase présentes**

⚠️ **Les références obsolètes découvertes en revue de Task 6 doivent être corrigées ici.** Elles ne sont pas seulement des variables d'environnement : la vague 3 a supprimé des scripts et des modules que la documentation annonce encore.

Run: `grep -n "FIREBASE_" .env.local .env.example`
Expected: lire la sortie. Si aucune : passer à l'étape 3.

- [ ] **Step 2: Retirer les lignes `FIREBASE_*`**

Éditer les fichiers concernés pour supprimer `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` et toute autre clé `FIREBASE_*`.

⚠️ **Ne jamais afficher la valeur de `FIREBASE_PRIVATE_KEY`** : éditer par nom de clé uniquement.

- [ ] **Step 3: Purger `AGENTS.md`**

Retirer :
- ligne 6 : la mention « Firebase: Firestore (Admin SDK server-side, Web SDK client-side), Firebase Auth » de la section Stack (remplacée par PostgreSQL + auth JWT, déjà en place depuis la phase 3)
- ligne 20 : `npm run migrate` (script supprimé en Task 6)
- lignes 28-41 : le bloc entier « ## Firebase setup » (`src/lib/firebase-admin.ts` et `src/lib/firebase.ts` n'existent plus)
- ligne 46 : « fetch data directly from Firestore via `getFirebaseAdmin()` » → remplacer par la réalité (providers PostgreSQL)
- ligne 60 : « migratable to Firestore via `npm run migrate` » → retirer
- ligne 62 : la ligne `scripts/migrate-data.js` du tableau (fichier supprimé)
- ligne 77 : « Deployment is via Firebase App Hosting » → **laisser** : c'est la phase 8 qui tranche le déploiement, pas cette phase

- [ ] **Step 4: Purger `MEMORY.md`**

- ligne 35 : `npm run db:import-auth` (script supprimé) **et** le compte « (12) » → la valeur réelle est **11**
- ligne 31-32 : `db:migrate` / `db:migrate:test` → **laisser** (scripts existants)

- [ ] **Step 5: Vérifier qu'aucun code ne réclame les variables**

Run: `grep -n "FIREBASE_" src/ e2e/ scripts/`
Expected: aucune sortie (si `scripts/` n'existe plus, la commande le signale — sans conséquence)

- [ ] **Step 6: Vérifier typecheck**

Run: `npm run typecheck`
Expected: 0 erreur

- [ ] **Step 7: Commit (`.env.example` seulement — `.env.local` est ignoré par git)**

```bash
git add .env.example AGENTS.md MEMORY.md
git commit -m "chore(docs): purger les references Firebase obsoletes et les variables"
```

---

### Task 8 : Vérification finale de non-régression

**Files:**
- Modify: `.kiro/specs/katalyst/tasks.md` (cocher la phase 7)
- Modify: `memory/decisions-architecturales.md` (ajouter la décision 47)

**Interfaces:**
- Consumes: Tasks 1 à 7.
- Produces: aucun code.

- [ ] **Step 1: Vérification complète**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

Run: `npm test`
Expected: 275 tests

Run: `npm run test:db`
Expected: tests verts (dont la suite `purge`)

Run: `npm run test:e2e`
Expected: 76 passed

Run: `npm run audit:content`
Expected: **6/6 formations conformes**

- [ ] **Step 2: Consigner la décision 47**

Ajouter à la fin de `memory/decisions-architecturales.md` :

```markdown
47. **Phase 7 — purge Firebase et nettoyage E2E.** Le nettoyage des données de test est **automatique et bilatéral** : `globalSetup` purge avant la suite, `globalTeardown` après. Nettoyer seulement après ne suffit pas — un passage interrompu laisserait des résidus jusqu'à un arrêt normal qui peut ne jamais venir ; nettoyer avant rend le dispositif **auto-réparant**. Un module unique (`e2e/helpers/purge.ts`) sert les trois chemins (setup, teardown, script manuel), pour qu'une seule liste de marqueurs soit à maintenir. Le garde-fou `assertSafeDatabase` refuse de purger si l'URL vise le port 5432 ou `masterplan365` : un nettoyage automatique ne doit jamais pouvoir viser la mauvaise base. Toutes les FK vers `organizations` étant en `ON DELETE CASCADE`, une seule instruction suffit et garantit l'atomicité. Preuve : 673 organisations de test → 0, 11 comptes réels et 6 formations intacts. Pour Firebase : `import-auth.ts` **lisait réellement** Firebase (données non embarquées), donc l'archiver en documentation était la seule issue honnête — le dégrader en constante aurait exigé d'inventer des comptes, ce que la méthode interdit.
```

- [ ] **Step 3: Cocher la phase 7 dans `tasks.md`**

Ajouter une entrée `- [x] T7.*` récapitulant les tâches 1-7 et la preuve obtenue.

- [ ] **Step 4: Vérifier l'arbre git**

Run: `git status --short`
Expected: propre (hors fichiers ignorés)

- [ ] **Step 5: Commit**

```bash
git add memory/decisions-architecturales.md .kiro/specs/katalyst/tasks.md
git commit -m "docs(phase7): consigner la purge Firebase et le nettoyage E2E"
```

---

## Annexe — Phase 8 proposée (hors périmètre)

| Élément | Raison du report |
|---|---|
| `.firebaserc` | Change la cible de déploiement — décision d'infrastructure |
| `firebase.json` | Idem |
| `apphosting.yaml` | Idem (Firebase App Hosting est la méthode de déploiement documentée) |

Une purge de code et un changement de cible de déploiement sont deux décisions distinctes. Les traiter ensemble rendrait tout retour arrière inutilisable.
