# Règles de conformité du contenu — phase 6 (T6.2a)

> **Fondement** : `@docs/katalyst/conformite-rnq-v10.md` (décret n° 2026-728, texte intégral).
>
> **Périmètre** : les **5 indicateurs** du contenu et du suivi pédagogiques —
> **4, 5, 6, 11, 19**. Les indicateurs **2, 12, 26, 27, 30, 31, 32** et le conditionnel **33**
> sont traités en **phase 20**.
>
> **Convention** : chaque règle porte un identifiant `R<n>`, cite **le texte du décret**, et
> définit une **preuve** vérifiable automatiquement par `npm run audit:content` (T6.1).
>
> ⚠️ **Une règle sans test est une intention.** Les règles ci-dessous sont conçues pour être
> **évaluables** ; celles qui ne le sont pas encore sont marquées `[NON TESTABLE]` avec la
> raison.

---

## R1 — Analyse du besoin (indicateur 4)

> **Texte du décret** : *« Le prestataire analyse le besoin du bénéficiaire en lien avec
> l'entreprise et/ou le financeur concerné(s). »*

| Dimension | Valeur |
|---|---|
| **Exigence Katalyst** | Toute formation porte un **cahier des charges** renseigné : les 7 axes QQOQCCP et les 5 piliers de l'Identimètre. |
| **Champs concernés** | `courses.generation_params` (QQOQCCP + public) |
| **Preuve produite** | Le cahier des charges horodaté |
| **Testable** | ✅ Oui |

**Vérification** : les 7 axes QQOQCCP sont renseignés et non vides ; les 5 piliers de
l'Identimètre (profil personnel, professionnel, niveau, attentes, freins) sont présents.

⚠️ **Limite connue** : l'indicateur exige une analyse *« en lien avec l'entreprise et/ou le
financeur »*. Katalyst peut **structurer** le recueil, mais **ne peut pas vérifier** que
l'analyse est pertinente — c'est un jugement humain. La règle vérifie donc la **complétude**,
pas la qualité. **À signaler dans le dossier de preuves.**

---

## R2 — Objectifs opérationnels et évaluables (indicateur 5)

> **Texte du décret** : *« Le prestataire définit les objectifs opérationnels et évaluables
> de la prestation. »*

| Dimension | Valeur |
|---|---|
| **Exigence Katalyst** | Chaque leçon porte un **objectif au format Bloom REWORK** : « L'apprenant sera capable de + VERBE D'ACTION + objet (CONDITIONS ; CRITÈRES) ». |
| **Champs concernés** | `lessons.objective` |
| **Preuve produite** | L'objectif au format conforme |
| **Testable** | ✅ Oui |

**Vérification** (4 contrôles, appliqués à chaque leçon) :

1. **Verbe d'action présent** — la formule commence par « L'apprenant sera capable de » (ou
   variante acceptée) suivie d'un verbe.
2. **Verbe non interdit** — « comprendre » et « savoir » sont **refusés** (source REWORK :
   *« verbes interdits »*).
3. **Critères présents** — parenthèses contenant conditions et/ou critères de réussite.
4. **Niveau Bloom identifiable** — le verbe correspond à l'un des 6 niveaux.

⚠️ **Décision de tolérance** : les **80 leçons actuelles** ont des objectifs rédigés **avant**
cette règle. L'audit les signalera comme **non conformes** — c'est **voulu** : il donne la
mesure de l'écart. La conformité n'est pas rétroactive sans re-traitement (phase 8 du plan).

---

## R3 — Contenus et modalités adaptés (indicateur 6)

> **Texte du décret** : *« Le prestataire établit les contenus et les modalités de mise en
> œuvre de la prestation, adaptés aux objectifs définis et aux publics bénéficiaires. »*

| Dimension | Valeur |
|---|---|
| **Exigence Katalyst** | Chaque leçon est **rattachée à un objectif** (via son chapitre), et son **type** est cohérent avec cet objectif. |
| **Champs concernés** | `lessons.type` · `lessons.bloom_level` (à créer, étape 13) · `chapters.course_id` |
| **Preuve produite** | Le déroulé validé |
| **Testable** | ✅ Oui (partiellement) |

**Vérification** :
1. Chaque leçon a un **type** parmi les 9 (`VIDEO`, `AUDIO`, `CAPSULE`, `MISE_EN_PRATIQUE`,
   `EVALUATION`, `TEXTE`, `IMAGE`, `MEDIA`, `LIEN`).
2. Chaque leçon a un **niveau Bloom déclaré**.
3. Le **couple (type, niveau)** est cohérent — table de R5.

⚠️ **Ce qui n'est pas testable** : *« adaptés aux publics bénéficiaires »* relève du jugement.
La règle vérifie la **traçabilité du rattachement**, pas l'adéquation pédagogique.

---

## R4 — Évaluation de l'atteinte des objectifs (indicateur 11)

> **Texte du décret** : *« Le prestataire évalue l'atteinte par les publics bénéficiaires des
> objectifs de la prestation. »*

| Dimension | Valeur |
|---|---|
| **Exigence Katalyst** | Chaque leçon **produit une trace d'atteinte** : quiz, exercice noté, ou interaction enregistrée. |
| **Champs concernés** | `lessons.type` · `user_lesson_progress` · `user_course_progress.quiz_scores` |
| **Preuve produite** | Résultats par leçon |
| **Testable** | ✅ Oui |

**Vérification** :
1. Les leçons de type `EVALUATION` ont un **quiz** rattaché (`quizzes.chapter_id`).
2. Les leçons de type `MISE_EN_PRATIQUE` pointent vers un composant **fonctionnel**
   (`assertUsableComponent`) — un placeholder ne produit aucune trace.
3. Un **seuil de réussite** est défini (`quizzes.passing_score`, défaut 80 — conforme REWORK).

---

## R5 — Appropriation et effectivité du suivi (indicateur 19) ⭐

> **Texte du décret** : *« Le prestataire met à disposition du bénéficiaire des ressources
> pédagogiques et **permet à celui-ci de se les approprier**. Lorsque des modules
> pédagogiques sont réalisés à distance, le prestataire **vérifie l'effectivité de leur suivi
> par les apprenants**. Au-delà d'un nombre d'intervenants par formation, fixé par arrêté […],
> le prestataire dispose d'un **référent pédagogique** par formation […]. »*

C'est **l'indicateur structurant** : Katalyst **est** un LMS distanciel.

| Dimension | Valeur |
|---|---|
| **Exigence Katalyst** | Chaque leçon produit une **trace d'interaction exploitable** — pas une simple connexion. |
| **Champs concernés** | `user_lesson_progress` · (à créer) traces d'interaction par composant |
| **Preuve produite** | Historique d'interaction par leçon |
| **Testable** | ✅ Oui |

**Vérification R5.1 — appropriation** : toute leçon de type `MISE_EN_PRATIQUE` pointe vers un
composant `status: 'functional'`. **Un placeholder rend l'organisme non conforme**, pas
seulement la formation incomplète.

**Vérification R5.2 — effectivité du suivi** : le décret exige une **trace d'interaction par
composant** — et non une trace par leçon. Une leçon peut désormais porter **N** composants
(phase 8bis) : exiger une trace au seul niveau de la leçon laisserait un composant sans
interaction enregistrée. Chaque composant `interactive` de la leçon doit donc produire, **pour
chaque apprenant**, une trace non triviale (réponse, tentative, correction commentée, temps
d'interaction). *(Une simple ouverture ne compte pas — le décret dit « les relevés de connexion
seuls ne suffisent plus ».)*

⚠️ **Statut : `evaluable: false` (`donnees-a-completer`).** La règle est **mesurable**, mais le
contrôle n'est pas encore branché sur `lesson_interactions` : le constat est **un travail à
faire**, pas un seuil réglementaire en attente (à la différence de R5.3).

**Vérification R5.3 — référent pédagogique** : `[SEUIL PARAMÉTRABLE]`. Le seuil (nombre
d'intervenants par formation) est **fixé par un arrêté non publié**. La fonctionnalité est
conçue **paramétrable** (décision 2026-09-23) ; l'audit ne conclut pas tant que le seuil est
à sa valeur neutre.

---

## R6 — Table de cohérence type ↔ niveau Bloom

Cette table est la **3ᵉ contrainte** de la table à 3 contraintes (étape 11) : elle rend R3 et
R5 **vérifiables automatiquement**.

| Niveau Bloom | Types de leçon admis | Trace attendue |
|---|---|---|
| **Connaître** | `TEXTE`, `VIDEO`, `CAPSULE`, `EVALUATION` | Score de quiz |
| **Comprendre** | `TEXTE`, `IMAGE`, `CAPSULE`, `MISE_EN_PRATIQUE` | Réponses de tri/appariement |
| **Appliquer** | `MISE_EN_PRATIQUE`, `MEDIA`, `AUDIO` | Étapes complétées |
| **Analyser** | `MISE_EN_PRATIQUE`, `MEDIA` | Diagnostic produit |
| **Évaluer** | `MISE_EN_PRATIQUE`, `EVALUATION` | Arbitrage + justification |
| **Créer** | `MISE_EN_PRATIQUE`, `MEDIA`, `LIEN` | Production de l'apprenant |

**Règle** : un `EVALUATION` ne peut pas viser « Créer » (un QCM ne fait pas créer). Une leçon
`MISE_EN_PRATIQUE` ne peut pas viser « Connaître » (une interaction n'est pas de la
mémorisation). **Toute incohérence est signalée par l'audit.**

---

## R7 — Couverture du niveau de Bloom par composant interactif (indicateur 19)

> **Texte du décret** : *« Le prestataire met à disposition du bénéficiaire des ressources
> pédagogiques et permet à celui-ci de se les approprier. »*

Avec **N** composants par leçon (phase 8bis), une mise en pratique n'est réellement appropriable
que si **chaque composant interactif** travaille le niveau de Bloom que la leçon déclare. Un
composant qui ne couvre pas ce niveau ne peut pas atteindre l'objectif qu'il est censé servir.

| Dimension | Valeur |
|---|---|
| **Exigence Katalyst** | Pour chaque composant `interactive` d'une leçon, `meta.bloomLevels` contient le `bloomLevel` déclaré de la leçon. |
| **Champs concernés** | `lesson_components.component_name` · `lessons.bloom_level` · `catalog.bloomLevels` |
| **Preuve produite** | Adéquation composant ↔ objectif |
| **Testable** | ⏳ Spécifiée — **non activée** (BLOCKED, voir « Constat du 2026-09-26 ») |

⚠️ **Composants `interactive` uniquement.** Les composants `visual` sont **illustratifs**
(décision utilisateur) : aucune obligation de niveau ne leur est opposable.

⚠️ **Sans `bloomLevel` déclaré**, la couverture est indécidable : la leçon est ignorée par R7,
R3 portant déjà le constat.

---

## R8 — Invariant du catalogue : niveaux de Bloom déclarés (hors formation)

> **Invariant** : tout composant `interactive` du catalogue déclare **au moins un** niveau de
> Bloom.

R8 n'est **pas** une règle par formation : c'est une propriété du **catalogue**. Un composant
interactif sans niveau ne peut être mis en correspondance avec aucun objectif (R7 ne peut donc
pas le valider). R8 est **destiné à être vérifié par un test** (et non par `auditCourseContent`,
qui n'a pas de constat par formation) : le test est **en attente** — le catalogue ne satisfait
pas encore l'invariant (voir « Constat du 2026-09-26 »).

---

## R9 — Configuration conforme au schéma de données du composant (indicateur 19)

> **Invariant** : `config.data`, **quand il est présent**, valide le `dataSchema` du composant.

| Dimension | Valeur |
|---|---|
| **Exigence Katalyst** | Une donnée structurée fournie à un composant (étapes, paires, cartes…) respecte le schéma publié par le catalogue. |
| **Champs concernés** | `lesson_components.config` · `catalog.dataSchema` |
| **Testable** | ✅ Oui (évaluable) |

⚠️ **`config.data === undefined` = valeurs par défaut : toujours valide, aucun constat.** Seule
une donnée **réellement fournie** et invalide est signalée. Sans cette règle, tout composant non
configuré (ex. `AiHelper`) serait déclaré non conforme à tort.

---

## Constat du 2026-09-26 (Task 8) — R7/R8 en attente de décision

L'activation de R7 sur les 6 formations existantes a produit **60 constats**, dont :

- **50** proviennent de **15 composants interactifs du catalogue sans niveau de Bloom** (R8
  échoue) : `ConflictResolver`, `PushPullAnimator`, `PRWorkflowSimulator`,
  `GitHubInterfaceSimulator`, `IssueTracker`, `ActionsWorkflowBuilder`, `WorkflowSimulator`,
  `FlowDiagramBuilder`, `TimelineNavigator`, `CommitMessageLinter`, `GitignoreTester`,
  `AliasCreator`, `SecurityScanner`, `OpenSourceSimulator`, `AiHelper` ;
- **10** sont de **vraies inadéquations** composant ↔ niveau (formulairement : `GitCommandSimulator`
  admis `Appliquer` pour des leçons `Comprendre`/`Créer`, `WorkflowDesigner` admis `Créer` pour
  des leçons `Appliquer`, `BranchCreator`, `CollaborationSimulator`, `UndoCommandComparison`,
  `GitDoctorTool`, `ReflogExplorer`).

⚠️ **Rien n'a été masqué.** Les niveaux de ces 15 composants sont des **données pédagogiques** :
les attribuer en silence serait inventer, ce que la méthode REWORK interdit. De plus, `AiHelper`
(assistant contextuel) est le **seul** composant interactif de 25 leçons à des niveaux
`Comprendre`/`Appliquer`/`Créer` : aucun niveau unique ne peut honnêtement le rendre conforme.
La correction relève d'une **décision pédagogique** (compléter le catalogue + concevoir la
pratique manquante), hors du périmètre d'une correction « minimale ».

**Conséquence** : R5.2 et R9 sont livrées et **vertes** ; R7 et R8 sont **spécifiées** mais
**non activées** — les activer fait tomber les 6 formations de **6/6 à 0/6**. **Task 8 = BLOCKED**
en attente d'une décision pédagogique (compléter le catalogue, puis concevoir la pratique
manquante). **Aucune donnée n'a été inventée** pour faire passer la porte d'audit.

---

## Récapitulatif — ce que l'audit (T6.1) vérifiera

| Règle | Indicateur | Contrôles | Automatisable |
|---|---|---|---|
| **R1** | 4 | 7 axes QQOQCCP + 5 piliers Identimètre | ✅ |
| **R2** | 5 | 4 contrôles par objectif de leçon | ✅ |
| **R3** | 6 | Type + niveau déclaré + cohérence | ✅ |
| **R4** | 11 | Quiz rattaché, composant fonctionnel, seuil défini | ✅ |
| **R5.1** | 19 | Aucun placeholder en `MISE_EN_PRATIQUE` | ✅ |
| **R5.2** | 19 | Trace non triviale **par composant interactif** | ⏳ nécessite les traces d'interaction (`lesson_interactions`) |
| **R5.3** | 19 | Référent pédagogique | ⏳ seuil paramétrable (arrêté à venir) |
| **R6** | 6, 11 | Cohérence (type, niveau) | ✅ |
| **R7** | 19 | Composant interactif ↔ niveau de Bloom de la leçon | ⏳ spécifiée — non activée (BLOCKED) |
| **R8** | — | Tout interactif du catalogue a ≥ 1 niveau de Bloom | ⏳ spécifiée — non activée (catalogue incomplet) |
| **R9** | 19 | `config.data` valide le schéma du composant | ✅ |

**Attendu de l'audit initial** : il **échouera** sur les 6 formations existantes — leurs
objectifs, leurs types et leurs composants ont été produits avant ces règles. **C'est le
résultat attendu** : il mesure l'écart à combler, et il est **rejouable** après chaque
correction (votre contrainte de formation modifiable).

---

## Ce que ces règles ne couvrent pas

| Sujet | Indicateur | Pourquoi |
|---|---|---|
| Publication des taux avec méthode | 2 | Phase 20 — fonctionnalité produit, pas règle de contenu |
| Procédure VSS | 12 | Phase 20 — procédure d'organisation |
| Réseau handicap | 26 | Phase 20 |
| Sous-traitance / portage | 27 | Phase 20 |
| Appréciations des parties prenantes | 30, 31 | Phase 20 |
| Analyse des risques qualité | 32 | Phase 20 |
| Évaluation des enseignements (CFA) | 33 | **Hors périmètre** (`L. 6313-1-4°`) |

---

*Établi le 2026-09-23, adossé au décret n° 2026-728. À réviser à la publication du guide de
lecture V10 — le guide précisera les **preuves**, pas les exigences.*
