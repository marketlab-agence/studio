# ADR 0014 — Catalogue générique et noms pédagogiques réutilisables

- **Statut** : accepté
- **Date** : 2026-09-28
- **Phases concernées** : 8bis (vague « config sur les 58 »), et toute création de formation ultérieure

## Contexte

En lisant la vague de mise en conformité des 58 composants avec `config` (ADR 0013, amendement du
2026-09-26), une confusion légitime est apparue :

> « Pourquoi voit-on **Git** et **Workflow** dans autant de composants ? Ces composants seront-ils
> réutilisables pour les prochaines formations ? Comment crée-t-on un composant *neuf* ? »

Trois faits sont à distinguer, parce que les confondre laisse croire à un catalogue figé sur Git.

1. Le **catalogue** (`src/components/registry/catalog.ts`, 58 entrées) est ce que le rendu, l'IA et
   la validation connaissent. Chaque entrée porte `kind` (`interactive` | `visual`), un `domain`
   (`'*'` = générique, ou `git`, `ia`, `automatisation`…), des `bloomLevels`, des `labelKeys` et un
   `dataSchema`.
2. `src/components/interactive/git-configurations.tsx` (607 lignes, 14 exports) contient des
   **configurations**, pas des composants de domaine — le fichier le dit dès sa ligne 14. Ce sont
   des **exemples d'usage** de primitives génériques (`MergeSimulator` → `CompareContrast`,
   `ReflogExplorer` → `StepByStepRunner`…).
3. Les **noms** (`GitDoctorTool`, `ForkVsCloneDemo`, `WorkflowDesigner`…) sont des **slots
   pédagogiques** : « diagnostiquer », « comparer deux notions confondues », « concevoir un flux ».
   Le sujet Git est le **contenu**, pas la nature du composant.

La racine historique : le catalogue a été rempli quand les seules formations étaient Git/Jira/Dev.
Les primitives génériques sont arrivées **après** (phase 8bis), pour remplacer ces coquilles.

## Décision

1. **Le catalogue est générique ; le sujet est une donnée.** Un composant ne connaît pas « Git » :
   il lit `config.data` et `config.labels`. Le même `StepByStepRunner` affiche une procédure Git,
   Docker, n8n ou vente selon la donnée de l'instance. C'est la décision 6 de l'ADR 0013, rendue
   effective par la vague « config sur les 58 ».
2. **Les noms Git/Jira/Workflow restent des identifiants de slot, pas des technologies.** Ils
   désignent une intention pédagogique réutilisable. Un futur renommage (ex. `CompareTwoNotions`)
   est possible mais **non nécessaire** : ce serait un lot de migration de contenu, pas un
   correctif.
3. **Deux voies de création d'un composant pour une formation nouvelle :**

   | Voie | Coût | Quand |
   |---|---|---|
   | **A. Réutiliser un composant du catalogue** | **aucun code** — le créateur (ou l'IA) fournit `config.data` + `config.labels` ; le formulaire expose `labelKeys`/`dataSchema` | cas normal : la *structure* pédagogique existe déjà (procédure, tri, diagnostic, appariement, comparaison, rédaction…) |
   | **B. Ajouter un composant** | code — `catalog.ts` (nature, domaine, Bloom) **et** `component-schemas.ts` (`LABEL_KEYS` + `DATA_SCHEMAS`) | rare : la *structure* est inédite (ex. interpréteur de code pas-à-pas). Un test **refuse** tout composant du catalogue non couvert par un schéma. |

4. **La sélection de l'IA est bornée par le domaine** (`ComponentDomain`). Sur une formation de
   vente, le catalogue entier n'est pas proposé : les composants `git` en sont exclus. C'est déjà
   le rôle de `domain` dans `catalog.ts`.
5. **Il n'existe pas de générateur automatique de composant** (voie B). C'est une **limite
   assumée** aujourd'hui, pas une omission : la couverture actuelle (58 composants + `config`)
   couvre la voie A pour toutes les structures pédagogiques recensées.

## Conséquences

### Positives

- Une formation non-Git (docker, n8n, vente…) est créable **sans développeur** tant que sa structure
  pédagogique existe (voie A).
- Une formation **anglophone** est créable sans traduction : `config.labels` porte la langue.
- La duplication de composants thématiques (« un composant par techno ») est évitée : le socle reste
  générique, le sujet est de la donnée.

### Négatives / coûts

- **Voie B = travail de développement.** Créer une structure pédagogique inédite demande un passage
  par `catalog.ts` + `component-schemas.ts` (couverture vérifiée par test).
- Le vocabulaire du catalogue reste **teinté Git** pour certains slots, ce qui peut induire en
  erreur un lecteur pressé — d'où le présent ADR.
- La qualité de la voie A dépend de la **pertinence de la donnée** fournie par l'IA ou le créateur ;
  le schéma (R9) garantit la **forme**, jamais le **fond pédagogique**.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Renommer tous les slots en intentions génériques maintenant** | Migration de contenu massive sans gain fonctionnel ; le nom est un identifiant interne, la donnée fait le rendu |
| **Créer un composant par techno** (un `DockerStepRunner`, un `N8nStepRunner`…) | Duplication : c'est exactement ce que les primitives génériques (phase 8bis) ont supprimé |
| **Générateur automatique de composants (voie B)** | Complexité et risque de composants non validés ; à évaluer seulement si la voie A s'avère insuffisante |

## Références

- `@.kiro/specs/katalyst/adr/0013-composants-multiples.md` (décision 6 « libellés en données »,
  amendement du 2026-09-26)
- `@src/components/registry/catalog.ts` (`ComponentDomain`, `ComponentStatus`)
- `@src/components/registry/component-schemas.ts` (`DATA_SCHEMAS`, `LABEL_KEYS`)
- `@src/components/interactive/git-configurations.tsx` (exemples d'usage Git)
- `@.superpowers/sdd/2026-09-23-phase8bis-composants-multiples/progress.md` (vague « config sur les 58 »)
