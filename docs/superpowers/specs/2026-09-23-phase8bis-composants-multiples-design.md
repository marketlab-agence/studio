# Phase 8bis — Composants pédagogiques multiples par leçon

**Date** : 2026-09-23
**Statut** : conception validée, prêt pour plan d'implémentation
**Portée** : `src/lib/db/`, `src/lib/schemas/`, `src/lib/providers/`, `src/components/registry/`, `src/components/tutorial/`, `src/app/[locale]/admin/`, `src/ai/flows/`, `.kiro/`, `docs/`

---

## 1. Contexte et problème

### 1.1 Le plafond est structurel, pas déclaratif

Aujourd'hui, une leçon porte **au plus 2 composants** — et ce n'est pas une règle écrite, c'est une conséquence du schéma :

```
lessons.interactive_component_name  TEXT   -- un seul nom
lessons.visual_component_name       TEXT   -- un seul nom
```

**Mesures du 2026-09-23** : sur 80 leçons, **39 en ont 1** et **41 en ont 2**. Aucune n'a pu en avoir davantage.

### 1.2 Ce que l'utilisateur veut

> « Quand j'avais dit 2 primitives par niveau de Bloom, ce n'était pas pour limiter à 2 mais pour avoir **au moins** 2 par niveau et **2 par leçon** — donc cela doit pouvoir être **largement supérieur**. Certaines formations pourraient demander **plusieurs composants pédagogiques par leçon** (pas que 2) selon le cahier des charges. »

Le « 2 » est un **plancher**, jamais un plafond. Et le nombre de composants doit pouvoir être **piloté par le cahier des charges** et la **taxonomie de Bloom**.

### 1.3 Le pilotage par Bloom n'existe pas

`suggest-lesson-components-flow.ts` demande à l'IA « *the single most relevant* » composant, **sans recevoir** ni le `bloomLevel` de la leçon, ni les `bloomLevels` des composants. La sélection est donc purement thématique.

Pourtant, le registre porte **déjà** tout le nécessaire (`catalog.ts:76`) :
```ts
interface ComponentMeta {
  name: string;
  kind: 'interactive' | 'visual';
  domains: readonly ComponentDomain[];
  bloomLevels: readonly BloomLevel[];
  status: ComponentStatus;
}
listByBloomLevel(kind, level, domain)   // catalog.ts:438 — existe déjà
```

### 1.4 Le catalogue réel

| Nature | Nombre |
|---|---|
| **Interactifs** (dont les **12 primitives**) | **45** |
| **Visuels** | **13** |
| **Total** | **58** |

⚠️ La documentation parle de « 46 composants » : **chiffre périmé** (relevé de la phase 1).

---

## 2. Ancrage réglementaire — pourquoi `kind` survit

Le mapping du décret (`docs/katalyst/conformite-rnq-v10.md:215`) :

> Indicateur **19** → `user_lesson_progress` → **composants interactifs** → **« Trace d'interaction par composant »**

Le mot « **visuel** » n'apparaît **nulle part** dans le mapping réglementaire. Les seules occurrences (`rework/formats.md`, `rework/methodes.md`) concernent la *production de supports*, pas la classification de composants.

**Conséquence** : `kind` n'est pas un attribut d'affichage — c'est le **déclencheur de l'obligation de traçabilité** :

| `kind` | Obligation |
|---|---|
| **interactive** | **doit** produire une trace (ind. 19, contrainte **éliminatoire**) |
| **visual** | illustration — **aucune trace exigée** |

### 2.1 Écart de conformité découvert

| Source | Exigence |
|---|---|
| Décret (ind. 19) | « Trace d'interaction **par composant** » |
| `R5.2` actuelle | « une trace non triviale **par leçon** » |

Avec 1 composant par leçon, les deux coïncident. **Avec N composants, la règle actuelle serait plus faible que le décret.** Cette phase corrige `R5.2`.

---

## 3. Décisions validées

| Question | Décision |
|---|---|
| Plancher de 2 | **Non bloquant** en audit · cible IA · **0 composant autorisé** (leçon purement notionnelle) |
| Modèle de stockage | **Table de jointure** |
| Même composant 2× dans une leçon | **Autorisé** → clé de substitution |
| `kind` | **Survit** (fondement réglementaire) |
| Libellés | **En données** — générés par l'IA **et** éditables par le créateur |
| Composants visuels | **Non tracés**, et **sans obligation de niveau Bloom** (illustratifs) |
| Schémas de configuration | **Strict pour les 58 composants** (et non seulement les 12 primitives) |
| Tracé documentaire | Inscrit dans `.kiro` (ADR + exigences + design + tâches) |

---

## 4. Architecture

### 4.1 Table de jointure

```sql
CREATE TABLE lesson_components (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      TEXT    NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  component_name TEXT    NOT NULL,
  position       INTEGER NOT NULL,
  config         JSONB   NOT NULL DEFAULT '{}',
  UNIQUE (lesson_id, position)
);
CREATE INDEX lesson_components_lesson_idx ON lesson_components (lesson_id, position);
CREATE INDEX lesson_components_name_idx   ON lesson_components (component_name);
```

- **`id`** — clé de substitution : permet **deux instances du même composant** (deux `StepByStepRunner` sur des procédures distinctes)
- **`UNIQUE (lesson_id, position)`** — garantit un ordre d'affichage déterministe
- **Index sur `component_name`** — analyse d'impact (« quelles leçons utilisent X ? ») et statistiques de couverture
- **`kind` absent** — il vient du **catalogue** (`resolveComponentMeta`) : une seule source de vérité, pas de duplication

⚠️ **Un composant inexistant devient impossible** — l'intégrité référentielle l'interdit. Aujourd'hui, `LessonView.tsx:36-43` ne peut que *signaler* un nom inconnu dans la console.

### 4.2 Attribution de la trace

`lesson_interactions` porte `component_name` **mais pas l'instance**. Avec deux `RecallQuiz` dans la même leçon, les deux traces porteraient le même nom — impossibles à attribuer.

```sql
ALTER TABLE lesson_interactions
  ADD COLUMN lesson_component_id UUID NULL REFERENCES lesson_components(id) ON DELETE SET NULL;
```

- **Nullable** : les traces existantes restent valides
- **`ON DELETE SET NULL`** : retirer un composant ne détruit **pas** l'historique d'apprentissage — la traçabilité des apprenants est une exigence, pas un détail

### 4.3 Configuration — libellés en données

Contrat **uniforme**, identique pour les 58 composants :

```ts
type ComponentConfig = {
  /** Remplace les libellés par défaut du composant, clé par clé. */
  labels?: Record<string, string>;
  /** Données structurées, validées par le schéma du composant. */
  data?: unknown;
};
```

Chaque composant **fusionne** `labels` par-dessus ses libellés par défaut : un composant sans configuration fonctionne exactement comme aujourd'hui.

`LessonView.tsx:51` construit déjà des props (`lessonContext`, `courseTopic`) — `config` s'y ajoute.

### 4.4 Schéma strict pour les 58 composants

**Décision utilisateur** : *« Je veux un schéma strict pour tous les 34 composants comme les 12. »*

`ComponentMeta` gagne :

```ts
interface ComponentMeta {
  // …champs existants…
  /** Clés de libellés que le composant sait remplacer, avec leur libellé par défaut. */
  labelKeys: Record<string, string>;
  /** Structure de `config.data`, validée à l'écriture ET au rendu. */
  dataSchema: z.ZodType;
}
```

- **`labelKeys`** — le catalogue expose ce qui est personnalisable, et la valeur par défaut. L'IA sait **quels** libellés produire, dans la langue du cours.
- **`dataSchema`** — structure attendue (questions, étapes, rubriques…). Zod vit dans `catalog.ts`, qui **ne contient aucun import React** : le schéma est donc utilisable depuis les schémas, les actions serveur, les tests et les prompts.
- **Validation à deux endroits** : à l'**écriture** (action serveur) et au **rendu** (`LessonView`) — un `config` invalide est signalé, jamais silencieusement ignoré.

### 4.5 Sélection IA pilotée par Bloom

- `bloomLevel` transmis au flux (**absent aujourd'hui**)
- Candidats filtrés par `listByBloomLevel(kind, level, domain)` — **déjà existant**
- Sortie : **tableau** de composants, chacun avec `config` et justification
- Le prompt actuel (« *the single most relevant* ») est **entièrement réécrit**

### 4.6 Plancher non bloquant

- Audit : **rapport** (`evaluable: false` + `notEvaluableReason: 'donnees-a-completer'`), jamais rouge
- Cible IA : ≥ 2 quand c'est pédagogiquement pertinent
- **0 autorisé** — une leçon « Connaître » peut légitimement n'avoir aucun exercice in-app

---

## 5. Règles de conformité

⚠️ **Les règles liées à Bloom ne concernent que les composants `interactive`.**

Décision utilisateur du 2026-09-23 : *« les composants visuels sont juste et souvent à titre illustratif pour les leçons (faire comprendre et retenir très vite une leçon) mais pas forcément pour assurer un des niveaux Bloom. »*

Un composant visuel **illustre** — il n'**exerce** pas une compétence. Exiger de lui qu'il couvre un niveau de Bloom serait une erreur de conception, et produirait des non-conformités sans fondement.

| Règle | Aujourd'hui | Après | Portée |
|---|---|---|---|
| `R5.1` | MISE_EN_PRATIQUE → 1 composant `functional` | ≥ 1 composant **interactif** `functional` parmi N | interactive |
| `R5.2` | 1 trace par **leçon** | 1 trace par **composant interactif** ← conforme au décret | interactive |
| **R7** *(nouvelle)* | — | Le `bloomLevels` du composant **couvre** le `bloomLevel` de la leçon | **interactive uniquement** |
| **R8** *(nouvelle)* | — | Tout composant **interactif** déclare au moins un niveau Bloom | **interactive uniquement** |
| **R9** *(nouvelle)* | — | Le `config` d'un composant **valide** son `dataSchema` | tous |

**Sur les composants visuels** : ils peuvent déclarer des niveaux Bloom à titre **indicatif** (utile pour suggérer une illustration pertinente), mais :

- l'absence de niveau déclaré **n'est pas un défaut** ;
- la couverture Bloom (`R7`) **ne s'applique pas** à eux ;
- ils ne produisent **aucune trace** (le décret ne l'exige pas).

⚠️ **Mais l'IA continue de leur en proposer.** Précision utilisateur du 2026-09-23 :

> « Chargez quand même l'IA de créer des composants visuels pour les leçons. »

Le critère de sélection diffère donc selon la nature :

| Nature | Critère de sélection IA |
|---|---|
| `interactive` | **Niveau de Bloom** de la leçon + domaine + cahier des charges |
| `visual` | **Pertinence illustrative** — « faire comprendre et retenir très vite » — sans contrainte de Bloom |

Concrètement, le flux de suggestion reçoit **les deux listes** et produit **les deux types**, avec des justifications distinctes : « cette interaction exerce le niveau *Appliquer* » d'un côté, « ce schéma rend le concept immédiatement lisible » de l'autre.



---

## 6. Périmètre

### 6.1 Rayon d'impact mesuré — 19 fichiers

| Catégorie | Fichiers |
|---|---|
| Schémas | `lib/schemas/content.ts`, `lib/schemas/interaction.ts` |
| Providers | `lib/providers/content.ts`, `lib/providers/postgres/content.ts` |
| Données | `lib/db/seed.ts`, `lib/db/export-content.ts`, `data/tutorials.json` (121 références) |
| IA | `ai/flows/suggest-lesson-components-flow.ts`, `ai/flows/generate-lesson-content-flow.ts` |
| Rendu | `components/tutorial/LessonView.tsx` |
| Édition | `app/[locale]/admin/.../EditLessonForm.tsx` |
| Audit | `lib/schemas/content.ts`, `lib/content/audit.ts` |
| Registre | `components/registry/catalog.ts` (+ `index.ts` pour les composants) |
| Tests | 4 fichiers `tests/content/`, `tests/db/` |

### 6.2 Nouveaux fichiers

- Migration `014_lesson_components.sql`
- `src/lib/schemas/component-config.ts` (contrat uniforme)
- Un fichier de configuration par composant, ou une extension de `catalog.ts`
- Tests : migration, instances multiples, Bloom, config invalide

---

## 7. Vérification

| Contrôle | Attendu |
|---|---|
| Migration | 121 références → 121 lignes, **0 perte** |
| Deux instances | Le même composant 2× → 2 lignes, **2 traces distinctes** |
| Suppression d'un composant | `ON DELETE SET NULL` → historique **préservé** |
| Bloom | Aucun composant proposé hors du niveau de la leçon |
| Config invalide | **Signalée**, jamais silencieuse |
| Libellés personnalisés | Modifiés par le créateur → **visibles au rendu** |
| Non-régression | 280 tests · 190 DB · 76 E2E · audit **6/6** |

---

## 8. Ce qui n'est PAS dans cette phase

| Élément | Raison |
|---|---|
| Traduction des 58 composants | **Aucune traduction** (amendement du 2026-09-23) — un créateur anglophone écrit ses propres libellés |
| Sélection IA par **domaine** | Déjà en place (`listByDomain`) ; cette phase ajoute **Bloom** |
| Extension au-delà de 58 composants | Le catalogue est **ouvert** (aucune limite à 12) mais cette phase ne l'enrichit pas |
| Traçabilité des composants visuels | Le décret ne l'exige pas |

---

## 9. Risques et parades

| Risque | Parade |
|---|---|
| Perte de données à la migration | Transaction unique + test « 121 → 121, 0 perte » + vérification du rendu d'une leçon à 1 composant |
| Historique d'apprentissage détruit par la suppression d'un composant | `ON DELETE SET NULL`, jamais `CASCADE` |
| 58 schémas Zod = charge de travail | Mécanique et testable ; les 12 primitives servent de modèle |
| Régression du rendu (1 composant aujourd'hui) | Les tests E2E couvrent le parcours de leçon ; une leçon à 1 composant doit rendre **à l'identique** |
| Deux instances indiscernables dans les traces | `lesson_component_id` ajouté **avant** d'autoriser les doublons |
| L'IA propose un composant hors Bloom | Filtrage **par construction** (`listByBloomLevel`) + nouvelle règle R7 |

---

## 10. Prérequis

⚠️ **Cette phase démarre après la Phase 8** (internationalisation), pour une raison précise : la Phase 8 modifie déjà `content.ts`, les providers, le seed et `LessonView`. Les mener ensemble créerait des conflits sur la branche en cours.

La Phase 8 conserve sa décision i18n (interface traduite, contenu non traduit). Cette phase la **prolonge** : des libellés en données permettront à un créateur anglophone d'écrire **son** contenu, sans qu'aucune traduction ne soit produite.
