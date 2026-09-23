# Référentiel National Qualité V10 (Qualiopi) — et ses conséquences pour Katalyst

> **Source primaire** : **décret n° 2026-728 du 1er août 2026** (NOR TRSD2619632D),
> JORF n° 0180 du 4 août 2026, texte n° 11. **Texte intégral fourni par l'utilisateur.**
> ELI : `https://www.legifrance.gouv.fr/eli/decret/2026/8/1/TRSD2619632D/jo/texte`
>
> **Entrée en vigueur : 1er novembre 2026.** Légifrance refuse l'accès automatisé (HTTP 403) ;
> le texte a été obtenu par copie manuelle, ce qui en fait une source de première main.
>
> **Statut du gate G5 : LEVÉ.** L'ADR 0006 attendait « le référentiel officiel » — il est
> désormais disponible et ce document le consigne.

---

## 1. Ce que le décret change

| Élément | Valeur | Source |
|---|---|---|
| Décret | n° 2026-728 du 01/08/2026, JO du 04/08/2026 | texte officiel |
| Entrée en vigueur | **1er novembre 2026** (tous audits : initiaux, surveillance, renouvellement) | art. 2 |
| Structure | **7 critères inchangés** | texte officiel |
| Indicateurs | **33** (contre 32) | texte officiel |
| Indicateurs **modifiés** | **1, 2, 3, 7, 12, 13, 14, 15, 19, 20, 27, 32** | texte officiel |
| Indicateur **nouveau** | **33** — **CFA uniquement** (`L. 6313-1-4°`) | texte officiel |
| Critères renforcés | **3, 4, 7** | décodage du texte |
| Critère inchangé | **5** (indicateurs 21, 22) | texte officiel |

**Le décret remplace le I de l'annexe au chapitre VI du titre Ier du livre III de la sixième
partie du code du travail** (article 1er). Ce n'est pas une note d'interprétation : c'est le
texte des indicateurs **opposables en audit**.

---

## 2. Périmètre : quelle colonne concerne Katalyst ?

Chaque indicateur du décret porte une croix dans une ou plusieurs colonnes, selon la nature
de l'action (article **L. 6313-1** du code du travail) :

| Colonne | Nature |
|---|---|
| `L. 6313-1-1°` | **Actions de formation** |
| `L. 6313-1-2°` | Bilans de compétences |
| `L. 6313-1-3°` | VAE |
| `L. 6313-1-4°` | **Apprentissage (CFA)** |

**Katalyst relève de `L. 6313-1-1°`** (actions de formation).

**Conséquence directe** : l'**indicateur 33 ne porte que sur `L. 6313-1-4°`** — il est donc
**hors de notre périmètre** par défaut. Il devient pertinent **si et seulement si** une
organisation cliente est un CFA. Décision prise (2026-09-23) : **prévoir `organization.type`,
ne pas implémenter l'indicateur 33**.

De même, les indicateurs **13, 14, 15, 20** ne portent que sur `L. 6313-1-4°` et
`L. 6313-1-2°/-3°` — ils sont **hors périmètre** pour Katalyst.

---

## 3. Les 33 indicateurs — et ceux qui concernent Katalyst

Légende : ✅ **retenu en phase 6** · ⏳ **reporté en phase 20** · ➖ **hors périmètre** ·
⬜ **inchangé, couvert par l'existant**

### Critère 1 — Information du public et transparence commerciale

| # | Objet | État | Portée |
|---|---|---|---|
| 1 | Information *« accessible, détaillée et vérifiable »* — aucune mention de nature à induire en erreur | ⏳ phase 20 | Toutes colonnes |
| 2 | Indicateurs de résultats **avec modalités de calcul transparentes** | ⏳ phase 20 | Toutes colonnes |
| 3 | Formations certifiantes : taux d'obtention, blocs, équivalences, passerelles, débouchés | ⏳ phase 20 | `-1°` `-2°` `-4°` |

### Critère 2 — Identification des objectifs et adaptation aux publics

| # | Objet | État | Portée |
|---|---|---|---|
| 4 | **Analyse le besoin du bénéficiaire** en lien avec l'entreprise/financeur | ✅ **phase 6** | Toutes colonnes |
| 5 | **Définit les objectifs opérationnels et évaluables** | ✅ **phase 6** | Toutes colonnes |
| 6 | **Établit les contenus et modalités adaptés** aux objectifs et publics | ✅ **phase 6** | Toutes colonnes |
| 7 | Adéquation du contenu aux exigences de la certification visée | ⏳ phase 20 | `-1°` `-4°` |
| 8 | Procédures de positionnement et d'évaluation **à l'entrée** | ⏳ phase 20 | `-1°` `-4°` |

### Critère 3 — Adaptation aux publics, accueil, accompagnement, suivi, évaluation

| # | Objet | État | Portée |
|---|---|---|---|
| 9 | Informe les publics sur les conditions de déroulement | ⬜ couvert | `-1°` |
| 10 | Met en œuvre et **adapte** la prestation, l'accompagnement et le suivi | ⬜ couvert | `-1°` |
| 11 | **Évalue l'atteinte des objectifs** par les bénéficiaires | ✅ **phase 6** | Toutes colonnes |
| 12 | **Mesures d'engagement + prévention des ruptures + VSS, harcèlement, discriminations** | ⏳ phase 20 | `-1°` |
| 13 | Alternance : anticipation des missions, coordination centre/entreprise | ➖ hors | `-4°` |
| 14 | Accompagnement socio-professionnel + traitement **sans délai** des ruptures | ➖ hors | `-4°` |
| 15 | Information des apprentis (renforcée pour les **mineurs**) | ➖ hors | `-4°` |
| 16 | Conditions de présentation à la certification | ⏳ phase 20 | `-1°` `-3°` |

### Critère 4 — Adéquation des moyens pédagogiques, techniques et d'encadrement

| # | Objet | État | Portée |
|---|---|---|---|
| 17 | Moyens humains/techniques adaptés, environnement approprié | ⬜ couvert | `-1°` |
| 18 | Mobilise et coordonne les intervenants internes/externes | ⬜ couvert | `-1°` |
| 19 | **Ressources pédagogiques appropriables + effectivité du suivi à distance + référent pédagogique** | ✅ **phase 6** | Toutes colonnes |
| 20 | Personnel dédié, référent handicap, conseil de perfectionnement | ➖ hors | `-4°` |

### Critère 5 — Qualification et développement des compétences des personnels

| # | Objet | État |
|---|---|---|
| 21 | Détermine, mobilise et évalue les compétences des intervenants | ⬜ **inchangé** |
| 22 | Entretient et développe les compétences de ses salariés | ⬜ **inchangé** |

### Critère 6 — Inscription dans l'environnement professionnel

| # | Objet | État | Portée |
|---|---|---|---|
| 23 | Veille légale et réglementaire | ⬜ couvert | Toutes colonnes |
| 24 | Veille métiers et emplois | ⬜ couvert | Toutes colonnes |
| 25 | Veille innovations pédagogiques et technologiques | ⬜ couvert | Toutes colonnes |
| 26 | Réseau handicap | ⏳ phase 20 | Toutes colonnes |
| 27 | **Sous-traitance / portage salarial : conformité tracée dans les contrats** | ⏳ phase 20 | Toutes colonnes |
| 28 | Périodes en situation de travail : réseau de partenaires | ➖ hors | `-1°` `-3°` |
| 29 | Actions d'insertion professionnelle / poursuite d'études | ➖ hors | `-4°` |

### Critère 7 — Recueil et prise en compte des appréciations et réclamations

| # | Objet | État | Portée |
|---|---|---|---|
| 30 | Recueille les appréciations des parties prenantes | ⏳ phase 20 | Toutes colonnes |
| 31 | Traitement des difficultés, réclamations et aléas | ⏳ phase 20 | Toutes colonnes |
| 32 | **Amélioration continue + analyse des risques qualité** | ⏳ phase 20 | Toutes colonnes |
| 33 | **Évaluation des contenus et enseignements par les apprenants** (distincte de la satisfaction) | ➖ **CFA uniquement** | `-4°` |

---

## 4. Les 5 indicateurs de la phase 6 — citations exactes et conséquences

### Indicateur 4 — Analyse du besoin

> *« Le prestataire analyse le besoin du bénéficiaire en lien avec l'entreprise et/ou le
> financeur concerné(s). »*

**Conséquence Katalyst** : le **QQOQCCP** et l'**Identimètre** (méthode REWORK) sont la mise
en œuvre de cet indicateur. Ils doivent être **obligatoires dans le parcours de création**.

**Preuve produite** : le cahier des charges renseigné, horodaté.
**Testable** : oui — le champ existe ou non.

### Indicateur 5 — Objectifs opérationnels et évaluables

> *« Le prestataire définit les objectifs opérationnels et évaluables de la prestation. »*

**Conséquence Katalyst** : la **formule Bloom REWORK** (verbe d'action + conditions +
critères) est exactement ce que l'indicateur exige. La validation Zod doit **refuser** un
objectif sans verbe d'action ou sans critère.

**Preuve produite** : l'objectif au format conforme.
**Testable** : oui — présence du verbe, des parenthèses, du critère.

### Indicateur 6 — Contenus et modalités adaptés

> *« Le prestataire établit les contenus et les modalités de mise en œuvre de la prestation,
> adaptés aux objectifs définis et aux publics bénéficiaires. »*

**Conséquence Katalyst** : le **déroulé 6 colonnes** avec contrôle arithmétique. Chaque
leçon doit être **rattachée à un objectif**.

**Preuve produite** : le déroulé validé.
**Testable** : oui — chaque leçon a un objectif parent.

### Indicateur 11 — Évaluation de l'atteinte des objectifs

> *« Le prestataire évalue l'atteinte par les publics bénéficiaires des objectifs de la
> prestation. »*

**Conséquence Katalyst** : chaque leçon doit permettre de **mesurer l'atteinte de son
objectif Bloom déclaré**. C'est le fondement du **`bloom_level` sur la leçon** : sans niveau
déclaré, on ne peut pas vérifier que l'évaluation est à la hauteur de l'objectif.

**Preuve produite** : les résultats de l'apprenant par leçon.
**Testable** : oui — cohérence entre `bloom_level` et type de composant.

### Indicateur 19 — Appropriation et effectivité du suivi à distance ⭐

> *« Le prestataire met à disposition du bénéficiaire des ressources pédagogiques et permet
> à celui-ci de se les approprier. **Lorsque des modules pédagogiques sont réalisés à
> distance, le prestataire vérifie l'effectivité de leur suivi par les apprenants.** Au-delà
> d'un nombre d'intervenants par formation, fixé par arrêté du ministre chargé de la
> formation professionnelle, le prestataire dispose d'un référent pédagogique par formation
> chargé d'assurer la coordination pédagogique entre les intervenants. »*

**C'est l'indicateur structurant pour Katalyst** — la plateforme **est** un LMS distanciel.

**Trois exigences distinctes** :

1. **Ressources appropriables** → un document consultable ne suffit pas ; l'apprenant doit
   pouvoir *se les approprier*, donc **interagir**.
2. **Effectivité du suivi à distance** → il faut des **traces d'interaction**, pas de
   simple connexion. C'est pourquoi la 3ᵉ contrainte de la table (trace auditable) est
   **éliminatoire**.
3. **Référent pédagogique** → dépend d'un **seuil fixé par arrêté non publié** → à
   implémenter en **paramétrable** (décision du 2026-09-23).

**Preuve produite** : l'historique d'interaction par leçon (réponses, tentatives, temps,
corrections).
**Testable** : oui — chaque composant produit-il une trace exploitable ?

---

## 5. Mapping indicateur → fonctionnalité Katalyst → preuve

| Ind. | Fonctionnalité existante | Ce qu'il faut ajouter | Preuve |
|---|---|---|---|
| **4** | `create-course-flow` (plan) · Identimètre REWORK | Rendre l'Identimètre **obligatoire** | Cahier des charges horodaté |
| **5** | `CreateCourseOutput` (objectifs) | Validation Zod Bloom **bloquante** | Objectif au format conforme |
| **6** | Plan → chapitres → leçons | Rattachement **leçon ↔ objectif** | Déroulé validé |
| **11** | `user_course_progress.quiz_scores` | **`bloom_level`** sur la leçon + cohérence composant | Résultats par leçon |
| **19** | `user_lesson_progress` · composants interactifs | **Trace d'interaction** par composant + seuil référent | Historique d'interaction |

**Trois fonctionnalités sont directement issues du décret** (phase 20) :

| Ind. | Fonctionnalité |
|---|---|
| **2** | Calcul et publication des **taux avec méthode** — la matière existe déjà (`quiz_scores`, `user_lesson_progress`) |
| **12** | **Procédure de signalement VSS** (référent, délais, acteurs externes) — **n'existe pas** |
| **32** | **Cartographie des risques qualité** — **n'existe pas** |

---

## 6. Points d'attention et incertitudes assumées

### Seuils renvoyés à arrêté (non publiés)

| Indicateur | Seuil | Décision |
|---|---|---|
| 19 | *« nombre d'intervenants par formation »* | **Paramétrable** en attendant (2026-09-23) |
| 20 | *« proportion d'heures d'enseignement par des intervenants permanents »* | **Paramétrable** — hors périmètre Katalyst (CFA) |

### Ce qui reste à obtenir

| Élément | Pourquoi | Impact |
|---|---|---|
| **Guide de lecture V10** | Le décret fixe les **exigences**, le guide fixe les **preuves** attendues par les auditeurs | Ajustera les preuves, pas les exigences |
| **Texte des arrêtés** | Seuils des indicateurs 19 et 20 | Paramétrable, donc non bloquant |

**Position de Katalyst** : *« pas de source → pas d'affirmation »* (ADR 0006). Les exigences
sont **citées du décret** ; les preuves sont **proposées**, à ajuster au guide de lecture.

### Ce que Katalyst ne prétend pas

⚠️ **Katalyst ne certifie rien.** Il **outille la conformité** : il produit les preuves, il ne
garantit pas la certification — celle-ci dépend de l'usage réel de l'organisme. Cette
position est celle de l'ADR 0006 et doit être maintenue dans toute communication publique
(**REQ-CMP-06** : *« aucune certification revendiquée »*).

---

## 7. Ce que ce document change dans le projet

| Fichier | Changement |
|---|---|
| `@.kiro/specs/katalyst/adr/0006` | **Gate G5 levé** ; renvoi vers ce document ; 33 indicateurs |
| `@.kiro/specs/katalyst/requirements.md` | **REQ-CNT-02** révisé (Bloom + trace + re-vérifiable) |
| `@.kiro/specs/katalyst/tasks.md` | Phase 6 recentrée sur les **indicateurs 4, 5, 6, 11, 19** |
| `@docs/rework/exercices.md` | 3ᵉ contrainte (trace) justifiée par l'indicateur 19 |
| Phase 20 | Reçoit **2, 12, 26, 27, 30, 31, 32** + le conditionnel 33 |

---

*Document établi le 2026-09-23. Source primaire : décret n° 2026-728 (texte intégral).
Prochaine révision attendue : publication du guide de lecture V10.*
