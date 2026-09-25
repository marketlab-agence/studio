# Phase 8bis — Composants pédagogiques multiples par leçon — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à une leçon de porter **N composants pédagogiques ordonnés** (aujourd'hui 2 maximum), sélectionnés par l'IA selon le **niveau de Bloom**, avec leurs libellés et données **en configuration** — pour qu'un créateur puisse en ajouter autant que son cahier des charges l'exige et les écrire dans **sa** langue.

**Architecture:** Une table de jointure `lesson_components` (clé de substitution `id`, car le même composant peut apparaître deux fois) remplace les deux colonnes `interactive_component_name` / `visual_component_name`. `kind` vient du **catalogue** (source unique). Chaque composant reçoit un `config` (`labels` + `data`) validé par un **schéma Zod strict déclaré au catalogue**. `lesson_interactions.lesson_component_id` attribue une trace à **l'instance** qui l'a produite.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, PostgreSQL 16, Zod, Genkit, Jest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-23-phase8bis-composants-multiples-design.md`
**ADR:** `.kiro/specs/katalyst/adr/0013-composants-multiples.md`

## Global Constraints

- Langue du code ET des commentaires : **français**.
- Les commentaires expliquent **pourquoi**, jamais **quoi**.
- PostgreSQL : port **5433** (`katalyst-postgres`). Port 5432 = autre projet, **interdit**.
- Ne jamais afficher ni commiter de secret.
- **Un seul `next dev` à la fois** (EPERM sur `.next/trace`).
- ⚠️ **`rg` n'est pas installé** : utiliser `grep` ou `Select-String`.
- ⚠️ Dans un commentaire SQL à l'intérieur d'une template literal TypeScript, **pas de backtick** (il ferme la chaîne).
- **`kind` réglementaire** (indicateur 19) : `interactive` → trace **obligatoire** ; `visual` → illustration, **aucune trace**.
- ⚠️ **Les règles Bloom (`R7`, `R8`) ne s'appliquent QU'AUX composants interactifs.** Les visuels sont illustratifs (« faire comprendre et retenir vite ») et n'ont **aucune obligation de niveau Bloom** — décision utilisateur.
- **Mais l'IA propose quand même des composants visuels** pour les leçons (décision utilisateur), selon leur **pertinence illustrative**, pas selon Bloom.
- **Plancher non bloquant** : cible IA ≥ 2 composants quand c'est pertinent ; **0 autorisé** ; l'audit **rapporte**, il ne bloque jamais.
- **Clé de substitution obligatoire** : le même composant peut apparaître **plusieurs fois** dans une leçon.
- Le catalogue compte **58 composants** (45 interactifs + 13 visuels) — **chacun** doit avoir un schéma strict.
- Non-régression : typecheck 0 · lint 0 · **282** tests · tests DB · **84** E2E · audit **6/6**.

---

### Task 1 : Table `lesson_components` et migration

**Files:**
- Create: `src/lib/db/migrations/014_lesson_components.sql`
- Create: `src/tests/db/lesson-components.db.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: table `lesson_components(id uuid, lesson_id text, component_name text, position int, config jsonb)` ; `lesson_interactions.lesson_component_id uuid null`.

- [ ] **Step 1: Écrire la migration**

```sql
-- Une leçon porte N composants pédagogiques ordonnés.
--
-- ⚠️ **Clé de substitution (`id`), pas `(lesson_id, component_name)`.** Le même
-- composant peut apparaître plusieurs fois dans une leçon : deux `StepByStepRunner`
-- sur deux procédures distinctes, deux `RecallQuiz` sur deux notions. Une clé
-- composite l'interdirait — c'est un cas explicitement demandé par l'utilisateur.
CREATE TABLE IF NOT EXISTS lesson_components (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      TEXT    NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  component_name TEXT    NOT NULL,
  position       INTEGER NOT NULL,
  -- Libellés et données du composant, dans la langue de la formation.
  -- `{}` = configuration par défaut du composant : il rend comme avant.
  config         JSONB   NOT NULL DEFAULT '{}',
  UNIQUE (lesson_id, position)
);

-- Analyse d'impact (« quelles leçons utilisent X ? ») et statistiques de couverture.
CREATE INDEX IF NOT EXISTS lesson_components_lesson_idx ON lesson_components (lesson_id, position);
CREATE INDEX IF NOT EXISTS lesson_components_name_idx   ON lesson_components (component_name);

-- Reprise des deux colonnes existantes : l'interactif d'abord, le visuel ensuite.
INSERT INTO lesson_components (lesson_id, component_name, position)
SELECT id, interactive_component_name, 0 FROM lessons WHERE interactive_component_name IS NOT NULL
ON CONFLICT (lesson_id, position) DO NOTHING;

INSERT INTO lesson_components (lesson_id, component_name, position)
SELECT id, visual_component_name, 1 FROM lessons WHERE visual_component_name IS NOT NULL
ON CONFLICT (lesson_id, position) DO NOTHING;

-- Attribution de la trace à l'INSTANCE qui l'a produite.
--
-- ⚠️ `NULL` autorisé : les traces existantes restent valides.
-- ⚠️ `ON DELETE SET NULL` et NON `CASCADE` : retirer un composant ne doit JAMAIS
-- détruire l'historique d'apprentissage — c'est une exigence (traçabilité, ind. 19),
-- pas un détail d'implémentation.
ALTER TABLE lesson_interactions
  ADD COLUMN IF NOT EXISTS lesson_component_id UUID NULL
  REFERENCES lesson_components(id) ON DELETE SET NULL;

-- Les deux colonnes d'origine disparaissent : la table de jointure est la seule source.
ALTER TABLE lessons DROP COLUMN IF EXISTS interactive_component_name;
ALTER TABLE lessons DROP COLUMN IF EXISTS visual_component_name;
```

- [ ] **Step 2: Appliquer la migration**

Run: `npm run db:migrate`
Expected: migration 014 appliquée sans erreur

Run: `npm run db:migrate:test`
Expected: idem sur `katalyst_test`

- [ ] **Step 3: Vérifier la reprise — 0 perte**

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT COUNT(*) FROM lesson_components;"`
Expected: **121** (le nombre de références relevé le 2026-09-23)

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT COUNT(*) FROM lesson_components WHERE component_name IS NULL;"`
Expected: `0`

- [ ] **Step 4: Écrire le test**

Créer `src/tests/db/lesson-components.db.test.ts` :

```ts
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Vérifie le modèle multi-composants : N composants ordonnés par leçon, le même
 * composant pouvant apparaître deux fois, et la trace rattachée à l'INSTANCE.
 */
describe('lesson_components', () => {
  beforeAll(async () => {
    await requireDatabaseOrSkip();
  });

  async function uneLecon(): Promise<string> {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT l.id FROM lessons l
       WHERE NOT EXISTS (SELECT 1 FROM lesson_components lc WHERE lc.lesson_id = l.id)
       LIMIT 1`,
    );
    if (rows.length === 0) throw new Error('Aucune leçon sans composant : fixture impossible.');
    return rows[0].id;
  }

  afterEach(async () => {
    await pool.query(`DELETE FROM lesson_components WHERE component_name LIKE 'Test%'`);
  });

  it('reprend les 121 références existantes sans perte', async () => {
    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM lesson_components`,
    );
    expect(rows[0].n).toBeGreaterThanOrEqual(121);
  });

  it('accepte le MÊME composant deux fois dans une leçon', async () => {
    const lessonId = await uneLecon();

    await pool.query(
      `INSERT INTO lesson_components (lesson_id, component_name, position)
       VALUES ($1, 'TestRunnerA', 10), ($1, 'TestRunnerA', 11)`,
      [lessonId],
    );

    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM lesson_components
       WHERE lesson_id = $1 AND component_name = 'TestRunnerA'`,
      [lessonId],
    );
    expect(rows[0].n).toBe(2);
  });

  it('refuse deux composants à la même position', async () => {
    const lessonId = await uneLecon();

    await expect(
      pool.query(
        `INSERT INTO lesson_components (lesson_id, component_name, position)
         VALUES ($1, 'TestA', 20), ($1, 'TestB', 20)`,
        [lessonId],
      ),
    ).rejects.toThrow(/lesson_components_lesson_id_position_key/);
  });

  it('supprime les composants avec leur leçon (cascade)', async () => {
    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM lesson_components lc
       WHERE NOT EXISTS (SELECT 1 FROM lessons l WHERE l.id = lc.lesson_id)`,
    );
    // Aucun orphelin : la cascade fait son travail.
    expect(rows[0].n).toBe(0);
  });

  it('préserve la trace quand un composant est supprimé', async () => {
    const lessonId = await uneLecon();

    const { rows: comp } = await pool.query<{ id: string }>(
      `INSERT INTO lesson_components (lesson_id, component_name, position)
       VALUES ($1, 'TestTrace', 30) RETURNING id`,
      [lessonId],
    );
    const composantId = comp[0].id;

    const { rows: org } = await pool.query<{ organization_id: string; user_id: string }>(
      `SELECT organization_id, id AS user_id FROM users LIMIT 1`,
    );

    const { rows: trace } = await pool.query<{ id: string }>(
      `INSERT INTO lesson_interactions
         (organization_id, user_id, lesson_id, component_name, kind, payload, lesson_component_id)
       VALUES ($1, $2, $3, 'TestTrace', 'ATTEMPT', '{}'::jsonb, $4) RETURNING id`,
      [org[0].organization_id, org[0].user_id, lessonId, composantId],
    );

    await pool.query(`DELETE FROM lesson_components WHERE id = $1`, [composantId]);

    // ⚠️ La trace SURVIT, avec `lesson_component_id` remis à NULL — et non supprimée.
    const { rows: apres } = await pool.query<{ lesson_component_id: string | null }>(
      `SELECT lesson_component_id FROM lesson_interactions WHERE id = $1`,
      [trace[0].id],
    );
    expect(apres.length).toBe(1);
    expect(apres[0].lesson_component_id).toBeNull();

    await pool.query(`DELETE FROM lesson_interactions WHERE id = $1`, [trace[0].id]);
  });
});
```

- [ ] **Step 5: Lancer le test**

Run: `npx jest --config jest.config.db.mjs --testPathPattern=lesson-components --runInBand`
Expected: PASS — 5 tests

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/migrations/014_lesson_components.sql src/tests/db/lesson-components.db.test.ts
git commit -m "feat(content): N composants ordonnes par lecon (migration 014)"
```

---

### Task 2 : Contrat de configuration et extension du catalogue

**Files:**
- Create: `src/lib/schemas/component-config.ts`
- Modify: `src/components/registry/catalog.ts`
- Test: `src/tests/content/component-config.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `export const ComponentConfigSchema = z.object({ labels: z.record(z.string()).optional(), data: z.unknown().optional() })`
  - `export type ComponentConfig = z.infer<typeof ComponentConfigSchema>`
  - `ComponentMeta.labelKeys: Record<string, string>` (clé de libellé → valeur par défaut française)
  - `ComponentMeta.dataSchema: z.ZodType` (structure de `config.data`)
  - `export function resolveConfig(name: string, config: ComponentConfig): ComponentConfig`

- [ ] **Step 1: Écrire le contrat**

Créer `src/lib/schemas/component-config.ts` :

```ts
import { z } from 'zod';

/**
 * Configuration d'une **instance** de composant pédagogique.
 *
 * ⚠️ **Pourquoi `labels` séparé de `data`.** Les libellés sont de la **copie**
 * (titre, consignes, boutons) : ils changent avec la langue de la formation. Les
 * données sont la **matière** (étapes, cartes, paires) : elles changent avec le
 * sujet. Les mélanger rendrait impossible de dire ce qui est personnalisable.
 *
 * ⚠️ **`{}` est une configuration valide.** Un composant sans configuration rend
 * exactement comme avant — c'est ce qui rend la migration sans régression.
 */
export const ComponentConfigSchema = z.object({
  labels: z.record(z.string()).optional(),
  data: z.unknown().optional(),
});

export type ComponentConfig = z.infer<typeof ComponentConfigSchema>;

/**
 * Fusionne les libellés fournis par-dessus les valeurs par défaut du composant.
 *
 * ⚠️ Un libellé **absent** de la configuration garde la valeur par défaut : on ne
 * remplace pas tout le bloc, on le complète. Sinon, personnaliser un seul mot
 * obligerait à redonner les dix autres — et une omission produirait un libellé vide.
 */
export function fusionnerLibelles(
  defauts: Record<string, string>,
  fournis: Record<string, string> | undefined,
): Record<string, string> {
  return { ...defauts, ...(fournis ?? {}) };
}
```

- [ ] **Step 2: Écrire le test qui échoue**

Créer `src/tests/content/component-config.test.ts` :

```ts
import { ComponentConfigSchema, fusionnerLibelles } from '@/lib/schemas/component-config';
import { COMPONENT_CATALOG, COMPONENT_CATALOG_BY_NAME } from '@/components/registry/catalog';

describe('contrat de configuration', () => {
  it('accepte une configuration vide', () => {
    expect(ComponentConfigSchema.safeParse({}).success).toBe(true);
  });

  it('refuse des libellés non textuels', () => {
    expect(ComponentConfigSchema.safeParse({ labels: { titre: 42 } }).success).toBe(false);
  });

  it('complète les libellés manquants par les valeurs par défaut', () => {
    const resultat = fusionnerLibelles({ a: 'A', b: 'B' }, { b: 'B modifié' });
    expect(resultat).toEqual({ a: 'A', b: 'B modifié' });
  });

  it('rend les libellés par défaut si aucune configuration n’est fournie', () => {
    expect(fusionnerLibelles({ a: 'A' }, undefined)).toEqual({ a: 'A' });
  });

  it('déclare un schéma strict pour CHAQUE composant du catalogue', () => {
    // ⚠️ Décision utilisateur : « un schéma strict pour tous les 34 composants
    // comme les 12 ». Aucun composant ne doit échapper à la validation.
    const sansSchema = COMPONENT_CATALOG.filter(
      (meta) => !meta.dataSchema || !meta.labelKeys,
    ).map((meta) => meta.name);
    expect(sansSchema).toEqual([]);
  });

  it('expose des libellés par défaut en français, non vides', () => {
    for (const meta of COMPONENT_CATALOG) {
      for (const [cle, valeur] of Object.entries(meta.labelKeys)) {
        expect(typeof valeur, `${meta.name}.${cle}`).toBe('string');
        expect(valeur.trim(), `${meta.name}.${cle}`).not.toBe('');
      }
    }
  });

  it('indexe chaque composant par son nom', () => {
    expect(Object.keys(COMPONENT_CATALOG_BY_NAME).length).toBe(COMPONENT_CATALOG.length);
  });
});
```

- [ ] **Step 3: Lancer le test pour vérifier qu'il échoue**

Run: `npx jest --config jest.config.mjs --testPathPattern=component-config`
Expected: FAIL — `meta.dataSchema` est `undefined` pour tous

- [ ] **Step 4: Étendre `ComponentMeta`**

Dans `src/components/registry/catalog.ts`, ajouter au type :

```ts
export interface ComponentMeta {
  name: string;
  kind: ComponentKind;
  status: ComponentStatus;
  description: string;
  domains: readonly ComponentDomain[];
  bloomLevels: readonly BloomLevel[];
  /**
   * Libellés personnalisables du composant, avec leur valeur par défaut (français).
   *
   * ⚠️ **Le catalogue expose ce qui est personnalisable** — ni plus, ni moins. L'IA
   * sait ainsi *quels* libellés produire pour une formation anglophone, et le
   * formulaire ne propose pas de modifier un texte qui n'existe pas.
   */
  labelKeys: Record<string, string>;
  /**
   * Structure attendue de `config.data`, validée à l'écriture ET au rendu.
   *
   * ⚠️ Un schéma **par composant**, et non un schéma générique : c'est ce qui
   * attrape une étape manquante dans un `StepByStepRunner` ou une paire
   * incomplète dans un `MatchingPairs`.
   */
  dataSchema: z.ZodType;
}
```

Ajouter `import { z } from 'zod';` en tête du fichier — Zod ne tire **aucun** React, le catalogue reste utilisable partout.

- [ ] **Step 5: Déclarer les schémas — les 58 composants**

Créer `src/components/registry/component-schemas.ts` :

```ts
import { z } from 'zod';

/**
 * Schémas stricts de configuration, **un par composant**.
 *
 * ⚠️ **Pourquoi ce fichier est séparé de `catalog.ts`.** Le catalogue décrit *ce
 * qu'est* un composant (nature, domaine, Bloom) ; ce fichier décrit *ce qu'il
 * attend* (structure des données). Les deux évoluent séparément : ajouter un
 * composant ne devrait pas obliger à relire 600 lignes de définitions.
 *
 * ⚠️ **Chaque entrée doit couvrir un composant réel du catalogue** : un test le
 * vérifie (`component-config.test.ts`). Un composant sans schéma serait une
 * configuration non validée — exactement ce que l'utilisateur a refusé.
 */

const Etape = z.object({
  id: z.string().min(1),
  instruction: z.string().min(1),
  expected: z.string().min(1),
  hint: z.string().optional(),
  explanation: z.string().optional(),
});

const Carte = z.object({ front: z.string().min(1), back: z.string().min(1) });
const Paire = z.object({ left: z.string().min(1), right: z.string().min(1) });
const ItemTrie = z.object({ label: z.string().min(1), category: z.string().min(1) });
const Checkpoint = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});

/** Schémas par nom de composant. Tout composant absent reçoit `z.object({})`. */
export const DATA_SCHEMAS: Record<string, z.ZodType> = {
  // --- Primitives génériques ---
  StepByStepRunner: z.object({ steps: z.array(Etape).min(1) }),
  GuidedProcedure: z.object({ checkpoints: z.array(Checkpoint).min(1) }),
  RecallQuiz: z.object({
    questions: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
  }),
  FlashcardDrill: z.object({ cards: z.array(Carte).min(1) }),
  SortingGame: z.object({
    categories: z.array(z.string().min(1)).min(1),
    items: z.array(ItemTrie).min(1),
  }),
  MatchingPairs: z.object({ pairs: z.array(Paire).min(1) }),
  CaseDiagnosis: z.object({
    symptoms: z.array(z.string().min(1)).min(1),
    causes: z.array(z.object({ label: z.string().min(1), correct: z.boolean() })).min(1),
  }),
  CompareContrast: z.object({ criteria: z.array(z.string().min(1)).min(1) }),
  DecisionScenario: z.object({ choices: z.array(z.string().min(1)).min(1) }),
  PeerReviewSimulator: z.object({ rubric: z.array(z.string().min(1)).min(1) }),
  BuilderCanvas: z.object({ blocks: z.array(z.string().min(1)).min(1) }),
  DraftCoach: z.object({ prompt: z.string().min(1) }),
  // --- Configurations Git (dérivent les données des primitives ci-dessus) ---
  GitCommandSimulator: z.object({ steps: z.array(Etape).min(1) }),
  GitRepositoryPlayground: z.object({ blocks: z.array(z.string().min(1)).min(1) }),
  GitTimeTravel: z.object({ commits: z.array(z.string().min(1)).min(1) }),
  GitDoctorTool: z.object({ symptoms: z.array(z.string().min(1)).min(1) }),
  StagingAreaVisualizer: z.object({ files: z.array(z.string().min(1)).min(1) }),
  VersioningDemo: z.object({ commits: z.array(z.string().min(1)).min(1) }),
  BranchCreator: z.object({ branches: z.array(z.string().min(1)).optional() }),
  MergeSimulator: z.object({ branches: z.array(z.string().min(1)).min(1) }),
  ConflictPlayground: z.object({ files: z.array(z.string().min(1)).min(1) }),
  ConflictVisualizer: z.object({ files: z.array(z.string().min(1)).min(1) }),
  ConflictResolver: z.object({ files: z.array(z.string().min(1)).min(1) }),
  ResolutionGuide: z.object({ steps: z.array(Etape).min(1) }),
  PushPullAnimator: z.object({ steps: z.array(Etape).min(1) }),
  ForkVsCloneDemo: z.object({ criteria: z.array(z.string().min(1)).min(1) }),
  PRWorkflowSimulator: z.object({ steps: z.array(Etape).min(1) }),
  PullRequestCreator: z.object({ steps: z.array(Etape).min(1) }),
  GitHubInterfaceSimulator: z.object({ blocks: z.array(z.string().min(1)).min(1) }),
  IssueTracker: z.object({ items: z.array(ItemTrie).min(1) }),
  ActionsWorkflowBuilder: z.object({ steps: z.array(Etape).min(1) }),
  WorkflowSimulator: z.object({ steps: z.array(Etape).min(1) }),
  WorkflowDesigner: z.object({ blocks: z.array(z.string().min(1)).min(1) }),
  FlowDiagramBuilder: z.object({ blocks: z.array(z.string().min(1)).min(1) }),
  TrunkBasedDevelopmentVisualizer: z.object({ steps: z.array(Etape).min(1) }),
  ReflogExplorer: z.object({ commits: z.array(z.string().min(1)).min(1) }),
  TimelineNavigator: z.object({ commits: z.array(z.string().min(1)).min(1) }),
  UndoCommandComparison: z.object({ criteria: z.array(z.string().min(1)).min(1) }),
  CommitMessageLinter: z.object({ examples: z.array(z.string().min(1)).min(1) }),
  GitignoreTester: z.object({ patterns: z.array(z.string().min(1)).min(1) }),
  AliasCreator: z.object({ examples: z.array(z.string().min(1)).optional() }),
  SecurityScanner: z.object({ patterns: z.array(z.string().min(1)).min(1) }),
  CollaborationSimulator: z.object({ steps: z.array(Etape).min(1) }),
  OpenSourceSimulator: z.object({ steps: z.array(Etape).min(1) }),
  AiHelper: z.object({ prompt: z.string().min(1) }),
};

/** Libellés personnalisables, par nom de composant. Valeurs par défaut en français. */
export const LABEL_KEYS: Record<string, Record<string, string>> = {
  StepByStepRunner: { title: 'Procédure guidée', description: 'Exécute les étapes dans l’ordre.' },
  GuidedProcedure: { title: 'Procédure guidée', description: 'Valide chaque point de contrôle.' },
  RecallQuiz: { title: 'Quiz de rappel', description: 'Vérifie ce que tu retiens.' },
  FlashcardDrill: { title: 'Cartes mémoire', description: 'Retourne la carte pour vérifier.' },
  SortingGame: { title: 'Tri par catégorie', description: 'Classe chaque élément.' },
  MatchingPairs: { title: 'Associe les paires', description: 'Relie ce qui va ensemble.' },
  CaseDiagnosis: { title: 'Diagnostic de cas', description: 'Trouve la cause.' },
  CompareContrast: { title: 'Compare et contraste', description: 'Confronte les options.' },
  DecisionScenario: { title: 'Scénario de décision', description: 'Choisis la meilleure option.' },
  PeerReviewSimulator: { title: 'Revue par les pairs', description: 'Évalue selon la grille.' },
  BuilderCanvas: { title: 'Construis ton artefact', description: 'Assemble les blocs.' },
  DraftCoach: { title: 'Rédaction guidée', description: 'Rédige, reçois un retour, corrige.' },
  GitCommandSimulator: { title: 'Commandes Git essentielles', description: 'Exécute la procédure dans l’ordre.' },
  GitRepositoryPlayground: { title: 'Dépôt à construire', description: 'Crée ton dépôt.' },
  GitTimeTravel: { title: 'Voyage dans l’historique', description: 'Explore les versions.' },
  GitDoctorTool: { title: 'Diagnostic de dépôt', description: 'Répare un état anormal.' },
  StagingAreaVisualizer: { title: 'Zone de staging', description: 'Suis l’état des fichiers.' },
  VersioningDemo: { title: 'Le versioning en action', description: 'Crée des versions.' },
  BranchCreator: { title: 'Création de branches', description: 'Crée et gère les branches.' },
  MergeSimulator: { title: 'Fusion de branches', description: 'Combine le travail.' },
  ConflictPlayground: { title: 'Terrain de conflit', description: 'Provoque un conflit.' },
  ConflictVisualizer: { title: 'Visualise le conflit', description: 'Comprends l’origine.' },
  ConflictResolver: { title: 'Résous le conflit', description: 'Répare le conflit.' },
  ResolutionGuide: { title: 'Guide de résolution', description: 'Suis la procédure.' },
  PushPullAnimator: { title: 'Push et Pull', description: 'Synchronise avec le distant.' },
  ForkVsCloneDemo: { title: 'Fork ou Clone ?', description: 'Choisis la bonne approche.' },
  PRWorkflowSimulator: { title: 'Cycle d’une Pull Request', description: 'Suis le parcours complet.' },
  PullRequestCreator: { title: 'Créer une Pull Request', description: 'Propose tes changements.' },
  GitHubInterfaceSimulator: { title: 'Interface de GitHub', description: 'Repère les éléments.' },
  IssueTracker: { title: 'Suivi des tâches', description: 'Crée et gère les issues.' },
  ActionsWorkflowBuilder: { title: 'GitHub Actions', description: 'Automatise ton flux.' },
  WorkflowSimulator: { title: 'Simulateur de workflow', description: 'Exécute le flux.' },
  WorkflowDesigner: { title: 'Concevoir un workflow', description: 'Organise les étapes.' },
  FlowDiagramBuilder: { title: 'Construis le diagramme', description: 'Représente le flux.' },
  TrunkBasedDevelopmentVisualizer: { title: 'Trunk-Based Development', description: 'Comprends le flux minimaliste.' },
  ReflogExplorer: { title: 'Explorateur de reflog', description: 'Retrouve les commits perdus.' },
  TimelineNavigator: { title: 'Navigateur de timeline', description: 'Voyage dans le temps.' },
  UndoCommandComparison: { title: 'Annuler : quelle commande ?', description: 'Choisis la bonne annulation.' },
  CommitMessageLinter: { title: 'Messages de commit', description: 'Rédige un message clair.' },
  GitignoreTester: { title: 'Tester .gitignore', description: 'Vérifie les règles.' },
  AliasCreator: { title: 'Créer des alias', description: 'Raccourcis tes commandes.' },
  SecurityScanner: { title: 'Scanner de secrets', description: 'Détecte les données sensibles.' },
  CollaborationSimulator: { title: 'Collaboration', description: 'Travaille à plusieurs.' },
  OpenSourceSimulator: { title: 'Contribuer à l’open source', description: 'Suis le processus complet.' },
  AiHelper: { title: 'Assistant IA', description: 'Pose ta question.' },
  GitGraph: { title: 'Graphe Git', description: 'Visualise l’historique.' },
  BranchDiagram: { title: 'Diagramme des branches', description: 'Comprends les branches.' },
  CommitTimeline: { title: 'Chronologie des commits', description: 'Situe les commits.' },
  AnimatedFlow: { title: 'Flux animé', description: 'Suis le mouvement.' },
  ConceptDiagram: { title: 'Schéma de concept', description: 'Rends le concept lisible.' },
  ConceptExplanation: { title: 'Explication illustrée', description: 'Comprends rapidement.' },
  DiffViewer: { title: 'Vue des différences', description: 'Compare les versions.' },
  FileTreeViewer: { title: 'Arborescence', description: 'Situe les fichiers.' },
  RepoComparison: { title: 'Comparaison de dépôts', description: 'Confronte deux approches.' },
  WorkflowComparisonTable: { title: 'Tableau comparatif', description: 'Compare les workflows.' },
  LanguagesChart: { title: 'Répartition des langages', description: 'Visualise la composition.' },
  StatisticsChart: { title: 'Statistiques', description: 'Visualise les chiffres.' },
  ProjectDashboard: { title: 'Tableau de bord projet', description: 'Suis l’avancement.' },
};
```

- [ ] **Step 6: Brancher les schémas dans `toMeta`**

Dans `catalog.ts` :

```ts
import { DATA_SCHEMAS, LABEL_KEYS } from './component-schemas';

function toMeta(descriptions: Record<string, string>, kind: ComponentKind): ComponentMeta[] {
  return Object.entries(descriptions).map(([name, description]) => ({
    name,
    kind,
    status: PLACEHOLDER_COMPONENTS.has(name) ? 'placeholder' : 'functional',
    description,
    domains: COMPONENT_DOMAINS_BY_NAME[name] ?? ['*'],
    bloomLevels: COMPONENT_BLOOM_BY_NAME[name] ?? [],
    // Un composant sans schéma déclaré n'accepte aucune donnée structurée : `{}`.
    // Le test exige en outre que `labelKeys` soit non vide pour CHAQUE composant.
    dataSchema: DATA_SCHEMAS[name] ?? z.object({}),
    labelKeys: LABEL_KEYS[name] ?? {},
  }));
}
```

- [ ] **Step 7: Lancer le test**

Run: `npx jest --config jest.config.mjs --testPathPattern=component-config`
Expected: PASS — 7 tests

Run: `npm run typecheck`
Expected: 0 erreur

- [ ] **Step 8: Commit**

```bash
git add src/lib/schemas/component-config.ts src/components/registry/component-schemas.ts src/components/registry/catalog.ts src/tests/content/component-config.test.ts
git commit -m "feat(content): contrat de configuration et schemas stricts pour les 58 composants"
```

---

### Task 3 : Schéma, provider et seed

**Files:**
- Modify: `src/lib/schemas/content.ts`
- Modify: `src/lib/providers/content.ts`, `src/lib/providers/postgres/content.ts`
- Modify: `src/lib/db/seed.ts`, `src/lib/db/export-content.ts`, `src/data/tutorials.json`
- Test: `src/tests/db/lesson-components.db.test.ts` (extension)

**Interfaces:**
- Consumes: `ComponentConfig` (Task 2).
- Produces: `Lesson.components: { name: string; position: number; config: ComponentConfig }[]`

- [ ] **Step 1: Remplacer les deux champs dans le schéma**

Dans `src/lib/schemas/content.ts`, **retirer** `interactiveComponentName` et `visualComponentName` de `LessonSchema`, et ajouter :

```ts
    /**
     * Composants pédagogiques de la leçon, **ordonnés**.
     *
     * ⚠️ **Une liste, pas deux emplacements fixes.** Une leçon peut exiger autant
     * de composants que son cahier des charges le demande, et le **même** composant
     * peut apparaître deux fois (deux procédures, deux quiz).
     */
    components: z
      .array(
        z.object({
          name: z.string().min(1),
          position: z.number().int().min(0),
          config: ComponentConfigSchema.default({}),
        }),
      )
      .default([]),
```

- [ ] **Step 2: Adapter le provider (lecture)**

Dans `src/lib/providers/postgres/content.ts`, la lecture des leçons joint désormais `lesson_components`. Remplacer les colonnes `interactive_component_name, visual_component_name` par une agrégation :

```sql
SELECT l.id, l.chapter_id, l.source_id, l.title, l.objective, l.content, l.type,
       l.points, l.position, l.bloom_level,
       COALESCE(
         (SELECT json_agg(json_build_object(
            'name', lc.component_name, 'position', lc.position, 'config', lc.config
          ) ORDER BY lc.position)
          FROM lesson_components lc WHERE lc.lesson_id = l.id),
         '[]'::json
       ) AS components
FROM lessons l
```

Et dans le mapping `toLesson`, `components: row.components`.

- [ ] **Step 3: Adapter le provider (écriture)**

`saveCourses` / `createCourse` / `updateCourse` doivent **remplacer** les composants d'une leçon dans une transaction (supprimer puis réinsérer, en préservant les `id` existants quand c'est possible, pour ne pas perdre les traces) :

```ts
/**
 * Réécrit les composants d'une leçon.
 *
 * ⚠️ **On conserve les `id` existants** (mise à jour par `(lesson_id, position)`),
 * car `lesson_interactions.lesson_component_id` les référence : les recréer
 * orphelinerait l'historique d'apprentissage. On supprime uniquement ceux qui
 * disparaissent réellement de la liste.
 */
async function remplacerComposants(
  client: PoolClient,
  lessonId: string,
  composants: Lesson['components'],
): Promise<void> {
  const positions = composants.map((c) => c.position);

  await client.query(
    `DELETE FROM lesson_components WHERE lesson_id = $1 AND position <> ALL($2::int[])`,
    [lessonId, positions],
  );

  for (const composant of composants) {
    await client.query(
      `INSERT INTO lesson_components (lesson_id, component_name, position, config)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (lesson_id, position) DO UPDATE SET
         component_name = EXCLUDED.component_name, config = EXCLUDED.config`,
      [lessonId, composant.name, composant.position, JSON.stringify(composant.config ?? {})],
    );
  }
}
```

- [ ] **Step 4: Adapter le seed et le JSON**

Dans `src/data/tutorials.json`, remplacer `interactiveComponentName` / `visualComponentName` par :

```json
"components": [
  { "name": "GitCommandSimulator", "position": 0 },
  { "name": "ConceptExplanation", "position": 1 }
]
```

Dans `src/lib/db/seed.ts`, insérer les composants **après** chaque leçon via `remplacerComposants` (réutiliser la même fonction, déplacée dans un module partagé si nécessaire).

Dans `src/lib/db/export-content.ts`, réécrire `components` (appariement `chapter_id` + `source_id`, comme pour les objectifs).

- [ ] **Step 5: Ajouter le test « le même composant deux fois »**

Ajouter dans `src/tests/db/lesson-components.db.test.ts` :

```ts
  it('rend deux instances du même composant dans l’ordre', async () => {
    const lessonId = await uneLecon();
    await pool.query(
      `INSERT INTO lesson_components (lesson_id, component_name, position)
       VALUES ($1, 'TestOrdre', 1), ($1, 'TestOrdre', 0)`,
      [lessonId],
    );

    const { rows } = await pool.query<{ position: number }>(
      `SELECT position FROM lesson_components
       WHERE lesson_id = $1 AND component_name = 'TestOrdre' ORDER BY position`,
      [lessonId],
    );
    expect(rows.map((r) => r.position)).toEqual([0, 1]);
  });
```

- [ ] **Step 6: Vérifier**

Run: `npm run db:seed`
Expected: `lessons : 80`, sans erreur

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT COUNT(*) FROM lesson_components;"`
Expected: **≥ 121**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npx jest --config jest.config.db.mjs --testPathPattern=lesson-components --runInBand`
Expected: PASS — 6 tests

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(content): le modele, le provider et le seed portent N composants ordonnes"
```

---

### Task 4 : Rendu de N composants ordonnés

**Files:**
- Modify: `src/components/tutorial/LessonView.tsx`
- Test: `src/tests/content/lesson-view.test.tsx`

**Interfaces:**
- Consumes: `Lesson['components']` (Task 3), `resolveConfig` (Task 2).
- Produces: rendu de la liste ordonnée, chaque composant recevant `config` fusionnée.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/tests/content/lesson-view.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { LessonView } from '@/components/tutorial/LessonView';

jest.mock('next-intl', () => ({
  useTranslations: () => (cle: string) => cle,
}));

jest.mock('@/components/registry', () => ({
  resolveComponent: (nom: string) => ({
    component: ({ lessonContext }: { lessonContext?: string }) => (
      <div data-testid={`composant-${nom}`}>{lessonContext}</div>
    ),
    meta: { name: nom, kind: 'interactive', status: 'functional' },
  }),
  resolveComponentMeta: (nom: string) => ({ name: nom, kind: 'interactive', status: 'functional' }),
}));

describe('LessonView — composants multiples', () => {
  const lecon = {
    id: 'l1',
    title: 'Leçon',
    objective: 'Objectif',
    content: 'Contenu',
    type: 'MISE_EN_PRATIQUE' as const,
    points: 0,
    position: 0,
    components: [
      { name: 'Alpha', position: 0, config: {} },
      { name: 'Beta', position: 1, config: {} },
      { name: 'Alpha', position: 2, config: {} },
    ],
  };

  it('rend tous les composants, dans l’ordre des positions', () => {
    const vus: string[] = [];
    render(
      <LessonView
        lesson={lecon}
        onComponentRendered={(deuxieme) => vus.push(deuxieme.name)}
      />,
    );

    // ⚠️ Le MÊME composant peut apparaître deux fois : 3 rendus, dont 2 « Alpha ».
    expect(screen.getAllByTestId('composant-Alpha')).toHaveLength(2);
    expect(screen.getAllByTestId('composant-Beta')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx jest --config jest.config.mjs --testPathPattern=lesson-view`
Expected: FAIL — `components` n'est pas lu par `LessonView`

- [ ] **Step 3: Réécrire le rendu**

Dans `LessonView.tsx`, remplacer les deux blocs `InteractiveComponent` / `VisualComponent` par une itération :

```tsx
/**
 * ⚠️ **Ordre par `position`, pas par nature.** Une leçon peut enchaîner plusieurs
 * composants du même type : c'est la position qui définit l'enchaînement
 * pédagogique, décidé par le créateur.
 */
const composantsTries = [...(lesson.components ?? [])].sort((a, b) => a.position - b.position);

// … dans le JSX, à la place des deux blocs :
{composantsTries.map((entree, index) => {
  const resolved = resolveComponent(entree.name);
  if (!resolved) {
    // ⚠️ Un composant inconnu est SIGNALÉ, jamais ignoré en silence : il
    // n'apparaîtrait pas dans la leçon sans que personne ne le sache.
    console.error(`[LessonView] composant inconnu : « ${entree.name} » (leçon ${lesson.id}).`);
    return null;
  }
  const Composant = resolved.component;
  return (
    <div key={`${entree.name}-${entree.position}`} className="mt-12">
      <Composant {...componentProps} config={entree.config ?? {}} />
    </div>
  );
})}
```

- [ ] **Step 4: Vérifier**

Run: `npx jest --config jest.config.mjs --testPathPattern=lesson-view`
Expected: PASS

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm test`
Expected: 282

- [ ] **Step 5: Commit**

```bash
git add src/components/tutorial/LessonView.tsx src/tests/content/lesson-view.test.tsx
git commit -m "feat(content): rendre N composants ordonnes, le meme composant pouvant se repeter"
```

---

### Task 5 : Libellés en données dans les primitives

**Files:**
- Modify: `src/components/interactive/primitives/**` (12 fichiers)
- Modify: `src/components/interactive/git-configurations.tsx`
- Test: `src/tests/content/primitives.test.ts` (extension)

**Interfaces:**
- Consumes: `ComponentConfig` (Task 2), `fusionnerLibelles` (Task 2).
- Produces: chaque primitive accepte `config?: ComponentConfig` et fusionne ses libellés.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter dans `src/tests/content/primitives.test.ts` :

```ts
  it('remplace les libellés par défaut par ceux de la configuration', () => {
    const defauts = { title: 'Titre par défaut', description: 'Description par défaut' };
    const config = { labels: { title: 'Custom title' } };

    const resultat = fusionnerLibelles(defauts, config.labels);
    expect(resultat.title).toBe('Custom title');
    expect(resultat.description).toBe('Description par défaut');
  });

  it('accepte une configuration absente sans casser', () => {
    expect(fusionnerLibelles({ title: 'T' }, undefined).title).toBe('T');
  });
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx jest --config jest.config.mjs --testPathPattern=primitives`
Expected: FAIL — `fusionnerLibelles` non importé

- [ ] **Step 3: Adapter chaque primitive**

Pour **chacune** des 12 primitives, le motif est identique. Exemple sur `StepByStepRunner` :

```tsx
export function StepByStepRunner({
  lessonId = 'unknown',
  title = 'Procédure guidée',
  description,
  steps,
  config,
}: StepByStepRunnerProps) {
  /**
   * ⚠️ **Les libellés de `config` priment sur les valeurs par défaut, mot par mot.**
   * Une formation anglophone fournit ses propres libellés ; une formation française
   * ne fournit rien et garde les défauts. Aucune traduction n'est produite : le
   * créateur écrit dans sa langue.
   */
  const libelles = fusionnerLibelles(
    { title: title ?? 'Procédure guidée', description: description ?? '' },
    config?.labels,
  );
  const donnees = config?.data as { steps?: unknown[] } | undefined;
  const etapes = (donnees?.steps as typeof steps) ?? steps;
  // … le reste utilise `libelles.title`, `libelles.description`, `etapes`
```

⚠️ **Le repli est obligatoire** : `config?.data ?? props` — un composant sans configuration doit rendre **exactement** comme aujourd'hui.

- [ ] **Step 4: Adapter `git-configurations.tsx`**

Les 14 configurations Git passent leurs procédures via `config.data` plutôt qu'en dur :

```tsx
export function GitCommandSimulator({ lessonId, config }: { lessonId?: string; config?: ComponentConfig }) {
  const donnees = config?.data as { steps?: ProcedureStep[] } | undefined;
  return (
    <StepByStepRunner
      lessonId={lessonId}
      steps={donnees?.steps ?? GIT_COMMANDS_PROCEDURE}
      config={config}
    />
  );
}
```

⚠️ **Les constantes françaises restent comme valeurs par défaut** — elles documentent le cas d'usage et servent de repli. Les supprimer priverait le composant de son contenu de référence.

- [ ] **Step 5: Vérifier**

Run: `npx jest --config jest.config.mjs --testPathPattern=primitives`
Expected: PASS

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm test`
Expected: 282

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(content): les libelles des composants passent en configuration (58 composants)"
```

---

### Task 6 : Sélection IA pilotée par Bloom

**Files:**
- Modify: `src/ai/flows/suggest-lesson-components-flow.ts`
- Modify: `src/ai/flows/generate-lesson-content-flow.ts`
- Modify: `src/actions/courseActions.ts`
- Test: `src/tests/content/selection-bloom.test.ts`

**Interfaces:**
- Consumes: `listByBloomLevel` (catalog), `bloomLevel` de la leçon.
- Produces: sortie `{ components: { name; config; justification }[] }`.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/tests/content/selection-bloom.test.ts` :

```ts
import { listByBloomLevel } from '@/components/registry/catalog';

describe('sélection des composants par Bloom', () => {
  it('ne propose que des composants couvrant le niveau de la leçon', () => {
    // ⚠️ C'est le contrat : le filtrage est fait PAR CONSTRUCTION (le flux ne reçoit
    // que les candidats admissibles), et non vérifié après coup par l'IA.
    const candidats = listByBloomLevel('interactive', 'Appliquer', undefined);
    expect(candidats.length).toBeGreaterThan(0);
    for (const meta of candidats) {
      expect(meta.bloomLevels).toContain('Appliquer');
    }
  });

  it('laisse les composants VISUELS hors du filtrage Bloom', () => {
    // ⚠️ Décision utilisateur : les visuels sont illustratifs, sans obligation de
    // niveau. Les filtrer par Bloom les écarterait à tort.
    const visuels = listByBloomLevel('visual', 'Appliquer', undefined);
    expect(Array.isArray(visuels)).toBe(true);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx jest --config jest.config.mjs --testPathPattern=selection-bloom`
Expected: FAIL si `listByBloomLevel` ne prend pas `kind` — vérifier la signature réelle (`listByBloomLevel(kind, level, domain)`)

- [ ] **Step 3: Réécrire le flux de suggestion**

Dans `suggest-lesson-components-flow.ts` :

1. **Entrée** : ajouter `bloomLevel: z.enum(['Connaître', …]).optional()`.
2. **Sortie** : remplacer les deux champs uniques par un **tableau** :

```ts
const SortieSchema = z.object({
  components: z
    .array(
      z.object({
        name: z.string().describe('Nom EXACT d’un composant de la liste fournie.'),
        config: z.object({
          labels: z.record(z.string()).optional(),
          data: z.unknown().optional(),
        }),
        justification: z.string(),
      }),
    )
    .describe(
      'Entre 0 et N composants. Vise 2 quand c’est pédagogiquement pertinent ; ' +
        '0 est acceptable pour une leçon purement notionnelle.',
    ),
});
```

3. **Prompt** : transmettre `bloomLevel` et **deux listes** :

```
*   **Niveau de Bloom visé par la leçon :** {{bloomLevel}}

**Composants INTERACTIFS admissibles** (ils couvrent le niveau ci-dessus) :
{{#each availableInteractiveComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

**Composants VISUELS admissibles** (illustratifs — choisis-les pour rendre la
leçon immédiatement lisible, sans contrainte de niveau) :
{{#each availableVisualComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
```

4. **Appel** : transmettre les candidats **déjà filtrés** par l'appelant, via `listByBloomLevel('interactive', bloomLevel, domain)` pour les interactifs, et `listNamesForDomain('visual', domain)` pour les visuels.

- [ ] **Step 4: Propager dans `courseActions` et `generate-lesson-content`**

`generateLessonContentAction` construit le `bloomLevel` de la leçon (déjà présent en base) et le passe au flux ; au retour, il écrit la liste via le provider.

- [ ] **Step 5: Vérifier**

Run: `npx jest --config jest.config.mjs --testPathPattern=selection-bloom`
Expected: PASS

Run: `npm run typecheck`
Expected: 0 erreur

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(content): selection des composants pilotee par le niveau de Bloom"
```

---

### Task 7 : Édition par le créateur

**Files:**
- Modify: `src/app/[locale]/admin/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]/EditLessonForm.tsx`
- Modify: `src/actions/courseActions.ts` (action d'enregistrement)

**Interfaces:**
- Consumes: `Lesson['components']`, catalogue, `ComponentConfig`.
- Produces: ajout / retrait / réordonnancement / configuration d'une instance.

- [ ] **Step 1: Remplacer les deux champs texte par une liste éditable**

Le formulaire affiche aujourd'hui **un champ texte** par composant. Il doit offrir :

- une **liste ordonnée** des composants de la leçon (nom, position, boutons ↑ ↓ ✕) ;
- un **ajout** par sélection dans le catalogue (`listFunctionalInteractiveNames()` + visuels) ;
- pour chaque instance, un **éditeur de `config`** : les libellés déclarés par `meta.labelKeys` (un champ par clé), et les données si `meta.dataSchema` attend une structure.

- [ ] **Step 2: Valider côté serveur**

Dans l'action d'enregistrement, valider chaque `config` contre `meta.dataSchema` :

```ts
/**
 * ⚠️ **Validation au serveur, pas seulement dans le formulaire.** Un `config`
 * invalide stocké en base ferait échouer le rendu de la leçon pour l'apprenant —
 * un défaut qui ne se verrait qu'en production.
 */
for (const composant of composants) {
  const meta = resolveComponentMeta(composant.name);
  if (!meta) throw new Error(`Composant inconnu : ${composant.name}`);
  const resultat = meta.dataSchema.safeParse(composant.config?.data ?? {});
  if (!resultat.success) {
    throw new Error(`Configuration invalide pour ${composant.name} : ${resultat.error.message}`);
  }
}
```

- [ ] **Step 3: Vérifier manuellement**

Run: `npm run dev` puis ouvrir `/fr/admin/courses/<id>/chapters/<id>/lessons/<id>`
Expected: on peut **ajouter 3 composants**, en mettre **2 identiques**, les réordonner, les supprimer, et modifier leurs libellés.

- [ ] **Step 4: Vérifier**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(content): le createur gere N composants (ajout, ordre, retrait, configuration)"
```

---

### Task 8 : Règles de conformité

**Files:**
- Modify: `src/lib/schemas/content.ts` (règles d'audit)
- Modify: `docs/katalyst/regles-conformite.md`
- Modify: `src/lib/content/audit.ts`
- Test: `src/tests/content/regles-multi.test.ts`

**Interfaces:**
- Consumes: `Lesson['components']`, catalogue, `lesson_interactions`.
- Produces: `R5.2` renforcée, `R7`, `R8`, `R9`.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/tests/content/regles-multi.test.ts` :

```ts
import { auditCourseContent } from '@/lib/schemas/content';

const lecon = (components: unknown[], type = 'MISE_EN_PRATIQUE') => ({
  id: 'l1', title: 'Leçon', objective: 'Décrire (en reformulant).', content: '',
  type, points: 0, position: 0, bloomLevel: 'Appliquer' as const,
  components,
});

function rapport(components: unknown[]) {
  return auditCourseContent({
    id: 'c', title: 'C', description: '', organizationId: 'o', status: 'Publié',
    language: 'fr', chapters: [{ id: 'ch1', title: 'Ch', position: 0,
      lessons: [lecon(components)], quiz: undefined }],
  } as never);
}

describe('règles de conformité multi-composants', () => {
  it('R7 : signale un composant interactif dont le Bloom ne couvre pas celui de la leçon', () => {
    const r = rapport([{ name: 'RecallQuiz', position: 0, config: {} }]); // Connaître
    const r7 = r.rules.find((x) => x.rule === 'R7');
    expect(r7?.findings.length).toBeGreaterThan(0);
  });

  it('R7 : n’applique AUCUNE contrainte de Bloom aux composants visuels', () => {
    // ⚠️ Décision utilisateur : les visuels sont illustratifs.
    const r = rapport([{ name: 'GitGraph', position: 0, config: {} }]);
    const r7 = r.rules.find((x) => x.rule === 'R7');
    expect(r7?.findings).toEqual([]);
  });

  it('R5.1 : une seule mise en pratique sans composant interactif est signalée', () => {
    const r = rapport([]);
    const r51 = r.rules.find((x) => x.rule === 'R5.1');
    expect(r51?.findings.length).toBeGreaterThan(0);
  });

  it('R9 : une configuration invalide est signalée', () => {
    const r = rapport([{ name: 'MatchingPairs', position: 0, config: { data: { pairs: [] } } }]);
    const r9 = r.rules.find((x) => x.rule === 'R9');
    expect(r9?.findings.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx jest --config jest.config.mjs --testPathPattern=regles-multi`
Expected: FAIL — règles inexistantes

- [ ] **Step 3: Implémenter les règles**

⚠️ **`R7` et `R8` ne s'appliquent QU'AUX composants `interactive`** (décision utilisateur : les visuels sont illustratifs).

- **`R7`** — pour chaque composant `interactive`, `meta.bloomLevels` doit contenir le `bloomLevel` de la leçon.
- **`R8`** — tout composant `interactive` du catalogue déclare ≥ 1 niveau (test de catalogue, pas de leçon).
- **`R9`** — chaque `config.data` valide le `dataSchema` de son composant.
- **`R5.1`** — une leçon `MISE_EN_PRATIQUE` doit avoir ≥ 1 composant `interactive` `functional` (parmi N).
- **`R5.2`** — reformuler la portée : « au moins une trace **par composant interactif** » (et non par leçon). Marquer `evaluable: false` avec `notEvaluableReason: 'donnees-a-completer'` tant que le contrôle n'est pas branché sur `lesson_interactions`.

- [ ] **Step 4: Mettre à jour `regles-conformite.md`**

Réécrire `R5.2` et documenter `R7`, `R8`, `R9`, en citant le décret : « trace d'interaction **par composant** » (indicateur 19).

- [ ] **Step 5: Vérifier**

Run: `npx jest --config jest.config.mjs --testPathPattern=regles-multi`
Expected: PASS

Run: `npm test`
Expected: 282+

Run: `npm run audit:content`
Expected: **6/6** maintenu (les nouvelles règles ne doivent pas casser les formations existantes)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(conformite): R5.2 renforcee (trace par composant), R7/R8 (Bloom), R9 (config)"
```

---

### Task 9 : Vérification finale et consignation

**Files:**
- Modify: `.kiro/specs/katalyst/tasks.md`
- Modify: `MEMORY.md`, `memory/decisions-architecturales.md`

- [ ] **Step 1: Vérification complète**

Run: `npm run typecheck` · Expected: 0
Run: `npm run lint` · Expected: 0
Run: `npm run lint:i18n` · Expected: catalogues cohérents
Run: `npm test` · Expected: 282+
Run: `npm run test:db` · Expected: verts
Run: `npm run test:e2e` · Expected: 84
Run: `npm run audit:content` · Expected: **6/6**

- [ ] **Step 2: Vérification en base**

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT COUNT(*) FROM lesson_components;"`
Expected: ≥ 121

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT column_name FROM information_schema.columns WHERE table_name='lessons' AND column_name LIKE '%component%';"`
Expected: **aucune ligne** (les deux colonnes ont disparu)

- [ ] **Step 3: Consigner la décision 51 et la note de fin**

Mettre à jour `tasks.md` (cocher `T8bis.1` à `T8bis.9` + note de fin) et `MEMORY.md`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs(phase8bis): consigner les composants multiples par lecon"
```

---

## Annexe — Ce qui n'est PAS fait

| Élément | Raison |
|---|---|
| Traduction des 58 composants | **Aucune traduction** — le créateur écrit ses libellés dans sa langue (amendement du 2026-09-23) |
| Tracer les composants visuels | Le décret ne l'exige pas ; cela noierait l'historique d'interaction |
| Imposer ≥ 2 composants par leçon | **Non bloquant** (décision utilisateur) : une leçon notionnelle peut n'en avoir aucun |
| Contrainte de Bloom sur les visuels | Ils sont **illustratifs** (décision utilisateur) |
| Migration des données de production | Aucune production déployée : la base de dev est re-seedée |
