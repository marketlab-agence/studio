# Table à 3 contraintes — primitives pédagogiques de Katalyst

> **Fondement croisé** :
> - **Bloom** — `@docs/rework/methodes.md` §5 (6 niveaux, verbes d'action) ;
> - **Familles d'exercices** — `@docs/rework/formats.md` §3 et `@docs/rework/exercices.md` ;
> - **Trace auditable** — `@docs/katalyst/conformite-rnq-v10.md` §4, **indicateur 19**.
>
> ⚠️ **La 3ᵉ contrainte est éliminatoire.** Un composant qui ne produit aucune trace
> exploitable rend l'organisme **non conforme** (indicateur 19 : *« vérifie l'effectivité de
> leur suivi »*). Sur un LMS distanciel, il ne suffit pas d'être pédagogiquement pertinent.
>
> Décision utilisateur du 2026-09-23 : **au moins 2 primitives par niveau de Bloom** (≥ 12),
> et non un composant par domaine. La *structure* se transpose, seul le *sujet* change
> (`@docs/rework/exercices.md`, règle d'usage de la source).

---

## 1. Le tableau des 12 primitives

| Niveau Bloom | Primitive | Ce que l'apprenant fait | Trace produite | Source REWORK |
|---|---|---|---|---|
| **Connaître** | `RecallQuiz` | Répond à des questions à choix | Réponses, score, temps | Exercice 8/9 |
| | `FlashcardDrill` | Révise des cartes, s'auto-évalue | Cartes réussies / échouées | S1 (découverte) |
| **Comprendre** | `SortingGame` | Classe des éléments par catégorie | Répartition produite + erreurs | Exercice 8 (appariement) |
| | `MatchingPairs` | Apparie deux séries | Paires correctes / erreurs | Exercice 8 (appariement) |
| **Appliquer** | `StepByStepRunner` | Exécute une procédure étape par étape | Étapes validées, erreurs, corrections | Exercice 6 (TTS), 3 |
| | `GuidedProcedure` | Suit une checklist ordonnée | Cases cochées, ordre respecté | Exercice 4 (déroulé) |
| **Analyser** | `CaseDiagnosis` | Diagnostique une situation | Diagnostic + justification | Exercices 2, 12 |
| | `CompareContrast` | Compare deux options | Critères identifiés | Exercice 12 (SAVI) |
| **Évaluer** | `DecisionScenario` | Arbitre selon des critères | Décision + argumentation | Exercice 12 |
| | `PeerReviewSimulator` | Évalue une production | Note + commentaires | Exercice 10 |
| **Créer** | `BuilderCanvas` | Construit un artefact | L'artefact produit | Exercices 1, 4, 11, 13 |
| | `DraftCoach` | Rédige, reçoit un retour, corrige | Version initiale + corrigée + écart | Exercice 3 |

**Ce que chacune a en commun** : elle est **paramétrable par des données**, jamais par du code.
`SortingGame` sert à trier des objections commerciales comme des outils IA ou des étapes Git.

---

## 2. Règle d'admissibilité d'un composant

> Un composant est **admissible** s'il est pertinent pour **au moins 3 formations
> distinctes** du catalogue, **sans modification de code** — seulement de données.
>
> Sinon, ce n'est pas un composant : c'est un contenu, et sa place est dans le markdown de
> la leçon.

**Cette règle découle de la source** (`@docs/rework/exercices.md`) : *« adapter le sujet,
garder la structure d'exercice »*. Elle sera appliquée à chaque futur composant.

**Contre-exemple** : un « simulateur de négociation d'objections prix » n'est admissible que
si l'on peut l'instancier ailleurs (négocier un délai, un périmètre, un budget). S'il ne
sert qu'au closing, c'est un **contenu** : sa place est dans une leçon, pas au catalogue.

---

## 3. Couverture Bloom — état cible

| Niveau | Primitives | Couverture | État actuel |
|---|---|---|---|
| Connaître | 2 | ✅ | `RecallQuiz` existe (QuizView) ; `FlashcardDrill` à créer |
| Comprendre | 2 | ⚠️ | aucun |
| Appliquer | 2 | ⚠️ | aucun |
| Analyser | 2 | ⚠️ | aucun |
| Évaluer | 2 | ⚠️ | aucun |
| Créer | 2 | ⚠️ | aucun |

**Écart à combler** : 1 primitive existante sur 12. C'est le travail des étapes 14 à 16.

---

## 4. Ce que devient chaque composant Git existant

Aucun n'est jeté : **ils deviennent des configurations de primitives**.

| Composant Git actuel | Devient | Pourquoi |
|---|---|---|
| `GitCommandSimulator` | **`StepByStepRunner`** + jeu de commandes Git | Test de validité du socle (étape 14) |
| `GitRepositoryPlayground` | `BuilderCanvas` + dépôt vide à construire | L'apprenant **crée** son dépôt |
| `GitDoctorTool` | `CaseDiagnosis` + dépôts cassés | Diagnostiquer un état anormal |
| `GitTimeTravel`, `ReflogExplorer` | `CaseDiagnosis` + historique à explorer | Retrouver un commit perdu |
| `ConflictPlayground`, `ConflictVisualizer` | `StepByStepRunner` + conflit à résoudre | Procédure de résolution |
| `MergeSimulator` | `CompareContrast` + deux stratégies | Comparer fast-forward et merge commit |
| `ResolutionGuide` | `GuidedProcedure` + étapes de résolution | Checklist ordonnée |
| `UndoCommandComparison` | `CompareContrast` + trois commandes | Choisir la bonne annulation |
| `WorkflowDesigner` | `BuilderCanvas` + flux à dessiner | Concevoir un workflow |
| `PullRequestCreator` | `DraftCoach` + PR à rédiger | Rédiger, recevoir un retour |
| `CollaborationSimulator` | `DecisionScenario` + contributeurs en conflit | Arbitrer |
| `ForkVsCloneDemo` | `CompareContrast` + deux modèles | Comprendre la différence |
| `TrunkBasedDevelopmentVisualizer` | `CompareContrast` + deux stratégies | Comparer avec GitFlow |

**Conséquence** : 13 composants Git-spécifiques deviennent **13 configurations**, et le socle
générique sert ensuite à `n8n`, `Jira`, `closing`, `marketing`…

---

## 5. Ce que l'IA reçoit (après l'étape 10)

Pour une leçon donnée, l'IA reçoit :
1. les **primitives du niveau Bloom visé** (`listByBloomLevel`) ;
2. **filtrées par le domaine de la formation** (`listByDomain`), les génériques restant.

Elle ne peut donc plus proposer un simulateur Git sur une formation de vente — c'est
**structurellement impossible**, pas seulement improbable.

---

## 6. Point ouvert — traçabilité fine

⚠️ **R5.2 n'est pas encore satisfaite** : « chaque formation produit au moins une trace non
triviale par leçon ». Les primitives devront **écrire leurs interactions** (réponse,
tentative, correction, temps). Ce n'est ni `user_lesson_progress` (qui ne dit que
« terminé ») ni `user_course_progress` (qui porte les scores de quiz) : il faudra une table
de **journal d'interaction**.

**Décision reportée à l'étape 14**, quand `StepByStepRunner` produira la première trace
réelle — concevoir la table sans cas d'usage concret risquerait de mal la calibrer.

---

*Établi le 2026-09-23. Sera complété à l'étape 14 par le schéma du journal d'interaction.*
