# ADR 0013 — Composants pédagogiques multiples par leçon

- **Statut** : accepté
- **Date** : 2026-09-23
- **Phases concernées** : 8bis (et toutes les phases qui manipulent les leçons : 6, 11, 17, 19)
- **Remplace** : le modèle « 1 interactif + 1 visuel » de la phase 2

## Contexte

### Le plafond actuel est structurel, pas déclaratif

Le schéma de la phase 2 porte **deux colonnes** sur `lessons` :

```
lessons.interactive_component_name  TEXT   -- un seul nom
lessons.visual_component_name       TEXT   -- un seul nom
```

Ce n'est donc pas une règle métier qui limite à 2 composants : c'est une **conséquence du modèle de données**. Aucune formation ne peut en demander davantage, quelle que soit son cahier des charges.

**Mesure du 2026-09-23** : sur 80 leçons, 39 portent 1 composant, 41 en portent 2.

### Ce qui a changé

L'utilisateur a précisé l'intention de la décision de phase 6 :

> « Quand j'avais dit 2 primitives par niveau de Bloom, ce n'était pas pour limiter à 2 mais pour avoir **au moins** 2 par niveau et **2 par leçon** — donc cela doit pouvoir être **largement supérieur**. Certaines formations pourraient demander **plusieurs composants pédagogiques par leçon** (pas que 2) selon le cahier des charges. »

Le « 2 » est un **plancher**, jamais un plafond.

### Ce que le décret exige

L'indicateur 19 du RNQ V10 (décret 2026-728) demande, dans le mapping de `@docs/katalyst/conformite-rnq-v10.md` :

> `user_lesson_progress` → **composants interactifs** → **« Trace d'interaction par composant »**

**Deux enseignements** :

1. Le décret raisonne **par composant**, pas par leçon. Avec un seul composant, les deux se confondent — avec plusieurs, la règle `R5.2` actuelle (« une trace par leçon ») serait **plus faible que le décret**.
2. Le décret ne mentionne **jamais** les composants visuels. La distinction `interactive` / `visual` a donc un **fondement réglementaire** : elle détermine **qui doit produire une trace**.

### Le pilotage par Bloom n'existe pas

Le registre porte déjà `bloomLevels` par composant et expose `listByBloomLevel()`. Mais `suggest-lesson-components-flow.ts` demande à l'IA « *the single most relevant* » composant **sans lui transmettre** le niveau de la leçon ni ceux des composants. La sélection est purement thématique.

## Décision

1. **Table de jointure `lesson_components`** avec **clé de substitution** (`id UUID`), `position`, et `config JSONB`. Le même composant peut apparaître **plusieurs fois** dans une leçon (deux procédures distinctes, deux quiz distincts).
2. **`kind` quitte les colonnes** et vient du **catalogue** (`resolveComponentMeta`) : une seule source de vérité.
3. **`lesson_interactions.lesson_component_id`** est ajouté (`NULL` autorisé, `ON DELETE SET NULL`) pour attribuer une trace à **l'instance** qui l'a produite, pas seulement à son type. Une suppression de composant **ne détruit jamais** l'historique d'apprentissage.
4. **`kind` survit** comme attribut du catalogue, avec un sens **réglementaire** : `interactive` → trace obligatoire (indicateur 19) ; `visual` → illustration, aucune trace exigée.
   ⚠️ **Les composants visuels n'ont aucune obligation de niveau Bloom** (décision utilisateur du 2026-09-23) : ils *illustrent* pour faire comprendre et retenir vite, ils n'*exercent* pas une compétence. Les règles de couverture Bloom (`R7`) et de déclaration obligatoire (`R8`) ne s'appliquent **qu'aux composants interactifs**. Un visuel peut déclarer un niveau à titre indicatif ; son absence n'est pas un défaut.
5. **`R5.2` est renforcée** : une trace par **composant interactif** (et non par leçon), conformément au décret.
6. **Libellés en données** (`config.labels`) : chaque composant fusionne les libellés fournis par-dessus les siens. Le créateur les édite, l'IA les génère **dans la langue de la formation**. Aucune traduction n'est produite.
7. **Schéma strict pour les 58 composants** (`labelKeys` + `dataSchema` Zod), et non seulement pour les 12 primitives.
8. **Plancher non bloquant** : cible IA de 2 composants quand c'est pertinent, rapport en audit — **jamais** un rouge, car une leçon purement notionnelle peut légitimement n'avoir aucun exercice in-app.

## Conséquences

### Positives

- Une formation peut exiger **autant de composants que son cahier des charges** le demande.
- La sélection IA devient **pilotée par la taxonomie de Bloom**, pas seulement par le thème.
- Un composant fantôme devient **impossible** (intégrité référentielle) — aujourd'hui il n'est que signalé dans la console.
- L'historique d'apprentissage **survit** à la suppression d'un composant.
- La conformité à l'indicateur 19 devient **littéralement** celle du décret (« par composant »).
- Les libellés en données **ouvrent la porte** aux formations non francophones, sans traduire quoi que ce soit.

### Négatives / coûts

- **Migration du contenu** : 121 références à étendre en lignes, avec vérification « 0 perte ».
- **19 fichiers** consommateurs à adapter, dont le seed, l'export, le rendu et le formulaire d'édition.
- **58 schémas Zod** à écrire — mécanique, mais volumineux.
- Le rendu doit gérer **N composants ordonnés** au lieu de 2 emplacements fixes.
- `R5.2` change de portée : l'audit peut découvrir des formations jusque-là « conformes » qui ne l'étaient que par confusion entre leçon et composant.

## Amendement du 2026-09-26 — portée réelle de `config` (tous les composants)

### Constat (revue finale de branche)

La décision 6 (libellés en données) et la décision 7 (schema strict pour les 58) n'étaient **réellement appliquées qu'à ~27 composants** : les 12 primitives et les 15 configurations Git. Pour les autres, `src/components/registry/index.ts` mappe les noms vers des composants qui **ignorent `config`** — un créateur (ou l'IA) peut donc éditer un libellé ou une donnée qui est **silencieusement écarté au rendu**. Neuf variantes config-aware (`*Config`) étaient de plus importées sans être câblées. C'est un écart entre la décision et le livré, pas une nouvelle exigence.

### Décision

1. **Les décisions 6 et 7 s'appliquent à TOUS les composants du catalogue** — y compris les composants spécialisés et les composants visuels. Un libellé ou une donnée éditée par le créateur (ou produite par l'IA) doit être **visible au rendu**.
2. **Principe de non-régression (impératif).** Les libellés par défaut d'un composant sont **exactement ce qu'il affiche déjà** : un composant sans configuration rend **à l'identique**. On n'introduit aucun titre ni bloc nouveau sans configuration.
3. **`labelKeys` décrit ce que le composant expose réellement.** Si un composant n'affiche aucun titre ou texte remplaçable, ses `labelKeys` sont **réalignés sur ce qu'il expose** (ou restreints) — cohérent avec la spec §4.4 : « le formulaire ne propose pas de modifier un texte qui n'existe pas ».
4. **`config.data` est honorée là où le schéma décrit réellement ce que le composant consomme.** Pour les composants non data-driven, les `DATA_SCHEMAS` sont **réalignés sur la forme réellement lue** (ou ramenés à `z.object({})` lorsqu'aucune donnée structurée n'est attendue) — **sans réécriture de comportement**. Le schéma reste le contrat, mais il décrit la vérité du composant.

### Exécution (par lots, porte qualité après chacun)

- Lot 0 : **ne pas substituer** de variantes qui changeraient le rendu — conserver les composants rendus aujourd'hui et les rendre **eux-mêmes** config-aware ; supprimer les imports `*Config` devenus morts (ou les aligner si un composant rendu pointe déjà dessus).
- Lot 1 : composants **visuels** (13) — config-aware (libellés) + schémas réalignés.
- Lots 2..n : composants **interactifs spécialisés**, par paquets, avec `typecheck`/`lint`/tests/audit après chaque paquet.
- Porte finale : suite complète (unitaires, DB, E2E) avant fusion.

> Le lot 0 et le lot 1 doivent confirmer la règle « sans config = rendu identique » sur un composant représentatif de chaque catégorie.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Colonnes `_2`, `_3`, …** | Ne résout rien : plafonne à 3, ce que l'utilisateur refuse explicitement (« largement supérieur ») |
| **Colonne `jsonb` sur la leçon** | Pas d'intégrité référentielle (un nom inexistant passerait), et les statistiques de couverture Bloom deviennent coûteuses. Le JSONB existant (`plan`, `generation_params`) stocke des **sorties IA opaques** ; un composant est une **référence structurée** à un catalogue connu |
| **Clé primaire `(lesson_id, component_name)`** | Interdit deux instances du même composant, cas explicitement demandé |
| **Tracer aussi les composants visuels** | Le décret ne l'exige pas ; cela noierait l'historique d'interaction sous des affichages |
| **Schémas seulement pour les 12 primitives** | Écarté par l'utilisateur : « un schéma strict pour tous les 34 composants comme les 12 » |

## Références

- `@docs/katalyst/conformite-rnq-v10.md` § Indicateur 19 (mapping « trace d'interaction **par composant** »)
- `@docs/katalyst/regles-conformite.md` règles `R5.1`, `R5.2` (à renforcer)
- `@docs/katalyst/primitives-pedagogiques.md` table à 3 contraintes
- `@docs/superpowers/specs/2026-09-23-phase8bis-composants-multiples-design.md`
- Prérequis : `@.kiro/specs/katalyst/adr/0008` (internationalisation) — la Phase 8 précède celle-ci
