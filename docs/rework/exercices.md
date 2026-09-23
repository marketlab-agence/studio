# Banque d'exercices REWORK

> **Source normative** : `1. Consulting IA/Formation REWORK/Grenier/Exercices.md`
> (socle local, issu de la formation REWORK « Former avec l'IA », CCI Formation Pro).
>
> **Règle d'usage (citation de la source)** :
> *« Pour une formation client : adapter le sujet, garder la structure d'exercice, et
> respecter la méthode demandée. »*
>
> Cette règle est le fondement du catalogue de composants de Katalyst : **la structure
> se transpose, seul le sujet change.** Un composant qui ne se transpose pas à un autre
> domaine n'est pas un composant — c'est un contenu, et sa place est dans la leçon.

---

## Ce que ce document ajoute à la source

La source décrit 13 exercices avec leur méthode et leur barème. Ce document y ajoute,
pour chacun :

- le **niveau de Bloom** visé (déduit de la méthode mobilisée) ;
- la **primitive candidate** de Katalyst (le composant réutilisable correspondant) ;
- la **trace auditable** produite — exigence de l'indicateur 19 du RNQ V10, qui impose
  de vérifier *« l'effectivité du suivi »* des modules à distance. Voir
  `@docs/katalyst/conformite-rnq-v10.md`.

⚠️ **La colonne « trace » est éliminatoire.** Un exercice qui ne laisse aucune trace
exploitable ne peut pas être un composant de Katalyst, quelle que soit sa valeur
pédagogique : sur un LMS distanciel, il rendrait l'organisme non conforme.

---

## S2 — Conception

### 1. Fiche programme (ACTIF) — 100 pts

**Source** : « Créer une fiche programme de formation avec : titre, description, objectifs,
public visé, durée, nombre de stagiaires, lieu, coût, dates/horaires, contenu pédagogique,
prérequis, modalités de suivi et d'appréciation. »

| Dimension | Valeur |
|---|---|
| **Bloom** | Créer |
| **Primitive** | `BuilderCanvas` — construction d'un document à rubriques imposées |
| **Trace** | Le document produit, horodaté |
| **Transposition** | Le **canevas 17 rubriques** est fixe ; le sujet change (Immotech, n8n, marketing…) |

**Lien RNQ** : indicateur 5 (*« définit les objectifs opérationnels et évaluables »*) et
indicateur 1 (*information du public*).

### 2. Analyser un public cible (Identimètre) — 100 pts

**Source** : « Interroger un apprenant témoin sur les 5 piliers de l'Identimètre, puis générer
sa fiche d'identité avec un prompt ACTIF. »

| Dimension | Valeur |
|---|---|
| **Bloom** | Analyser |
| **Primitive** | `CaseDiagnosis` — recueil structuré puis diagnostic |
| **Trace** | Les 5 piliers renseignés + la fiche produite |
| **Transposition** | Les 5 piliers sont fixes : profil personnel, professionnel, niveau, attentes, freins |

**Lien RNQ** : indicateur 4 (*« analyse le besoin du bénéficiaire »*) — **exigence directe**.

### 3. Objectif pédagogique (ACTIF + Bloom + Content + Espaces réservés) — 100 pts

**Source** : « En 3 étapes : prompt ACTIF simple → affiner avec Bloom → imposer le format
espaces réservés (3 critères, un objectif par niveau, verbe en gras, conditions entre parenthèses). »

| Dimension | Valeur |
|---|---|
| **Bloom** | Appliquer → Évaluer (l'apprenant **corrige** un objectif) |
| **Primitive** | `DraftCoach` — rédaction guidée avec retour automatique |
| **Trace** | Version initiale + version corrigée + écart |
| **Transposition** | La **formule** est fixe ; le sujet change |

**Lien RNQ** : indicateur 5 — **exigence directe**.

### 4. Déroulé pédagogique (ACTIF, échange direct) — 100 pts

**Source** : « Créer un déroulé pédagogique avec modèle d'échange direct en nourrissant de
contexte (durée, objectifs, présentiel/distanciel). »

| Dimension | Valeur |
|---|---|
| **Bloom** | Créer |
| **Primitive** | `BuilderCanvas` — tableau **6 colonnes** avec contrôle arithmétique |
| **Trace** | Le tableau produit, avec la somme des durées validée |
| **Transposition** | Les 6 colonnes sont fixes (objectifs, modalités, méthodes, activités, matériel, durée) |

**Lien RNQ** : indicateur 6 (*« établit les contenus et les modalités de mise en œuvre »*).

---

## S3 — Production, Animation, Analyse

### 5. Créer une image avec une IAG (TTI) — 50 pts

| Dimension | Valeur |
|---|---|
| **Bloom** | Créer |
| **Primitive** | `DraftCoach` (variante TTI : consigne → prompt → image) |
| **Trace** | Le prompt rédigé + l'image produite |
| **Transposition** | Le cahier des charges change, la démarche est la même |

⚠️ **Non transposable en l'état sans le studio IA** (phase 17). À prévoir, pas à construire ici.

### 6. Créer un audio avec l'IA (TTS) — 50 pts

| Dimension | Valeur |
|---|---|
| **Bloom** | Appliquer |
| **Primitive** | `DraftCoach` (variante TTS) |
| **Trace** | Le texte source + l'audio produit |
| **Transposition** | Idem exercice 5 |

⚠️ **Dépend du studio IA** (phase 17).

### 7. Concevoir une présentation PowerPoint (TTT → Gamma) — 100 pts

| Dimension | Valeur |
|---|---|
| **Bloom** | Créer |
| **Primitive** | `BuilderCanvas` — plan de slides |
| **Trace** | Le plan produit |
| **Transposition** | La structure de présentation est réutilisable |

### 8. Quiz d'évaluation avec ChatGPT (ACTIF + Espaces réservés) — 50 pts

**Source** : « Quiz de 5 questions, 4 réponses, 1 bonne réponse ; pour chaque question :
niveau de difficulté, bonne réponse, debriefing. »

| Dimension | Valeur |
|---|---|
| **Bloom** | Connaître → Comprendre |
| **Primitive** | `RecallQuiz` — **déjà disponible** |
| **Trace** | Réponses, score, temps |
| **Transposition** | Totale : la structure du quiz est générique |

**Lien RNQ** : indicateur 11 (*« évalue l'atteinte des objectifs »*) — **exigence directe**.

### 9. Quiz avec Quiz Wizard — 50 pts

Variante outillée de l'exercice 8. **Même primitive** (`RecallQuiz`) : ce qui change est
l'outil externe, pas la structure pédagogique.

### 10. Formulaire d'évaluation à chaud (ACTIF) — 100 pts

| Dimension | Valeur |
|---|---|
| **Bloom** | Évaluer |
| **Primitive** | `PeerReviewSimulator` (variante auto-évaluation) |
| **Trace** | Les réponses au formulaire |
| **Transposition** | Totale |

**Lien RNQ** : indicateur 30 (*recueil des appréciations*) — **hors phase 6** (phase 20).

### 11. Brise-glace avec ChatGPT (ACTIF + Content + Adversarial) — 50 pts

**Source** : « Jeu original d'ouverture, matériel = jetons, mécanisme = échanges entre joueurs,
compétence = observation. »

| Dimension | Valeur |
|---|---|
| **Bloom** | Créer |
| **Primitive** | `BuilderCanvas` — règle de jeu à contraintes imposées |
| **Trace** | La règle produite |
| **Transposition** | Les **contraintes** changent, la structure (contrainte → proposition → critique) est fixe |

---

## S1 — Découverte

Trois activités **sans livrable individuel** : exploration de ChatGPT, panorama d'outils,
CPA² en pratique.

| Dimension | Valeur |
|---|---|
| **Bloom** | Connaître |
| **Primitive** | `FlashcardDrill` — mémorisation active |
| **Trace** | Cartes réussies / échouées |

**Note** : c'est le poste le plus sous-estimé. La source ne leur donne pas de barème, mais
ce sont les seules activités de niveau « Connaître » — indispensable pour couvrir les 6 niveaux.

---

## S4 — Synthèse & Certification

### 12. Fiche réflexe SAVI (animation difficile) — 100 pts

**Source** : « Situation : un participant se sent perdu. Produire une fiche réflexe :
description, conseils SAVI, résumé. »

| Dimension | Valeur |
|---|---|
| **Bloom** | Analyser → Évaluer |
| **Primitive** | `DecisionScenario` — situation → arbitrage → justification |
| **Trace** | La fiche produite + le raisonnement |
| **Transposition** | Les 4 axes SAVI sont fixes (Sécuriser, Agir, Valoriser, Impliquer) |

**Lien RNQ** : indicateur 12 (*prévention des ruptures*) — **hors phase 6** (phase 20).

### 13. Assistant QQOQCCP sur Poe (analyse de la demande) — 50 pts

**Source** : « Créer un assistant qui génère 3 questions pertinentes par catégorie QQOQCCP
depuis un document utilisateur. Soigner le system prompt (4 points). »

| Dimension | Valeur |
|---|---|
| **Bloom** | Créer |
| **Primitive** | `BuilderCanvas` — system prompt à 4 sections |
| **Trace** | L'assistant produit + les 4 sections |
| **Transposition** | Les 7 axes QQOQCCP et les 4 points du system prompt sont fixes |

**Lien RNQ** : indicateur 4 (*analyse du besoin*) — **exigence directe**.

---

# Synthèse — couverture Bloom et primitives

| Niveau Bloom | Exercices REWORK | Primitives candidates | Couverture |
|---|---|---|---|
| **Connaître** | S1 (panorama, découverte), 8 | `RecallQuiz`, `FlashcardDrill` | ✅ 2 |
| **Comprendre** | 8, 9 | `SortingGame`, `MatchingPairs` | ⚠️ à créer |
| **Appliquer** | 3, 6 | `StepByStepRunner`, `GuidedProcedure` | ⚠️ à créer |
| **Analyser** | 2, 12 | `CaseDiagnosis`, `CompareContrast` | ⚠️ à créer |
| **Évaluer** | 10, 12 | `DecisionScenario`, `PeerReviewSimulator` | ⚠️ à créer |
| **Créer** | 1, 4, 5, 7, 11, 13 | `BuilderCanvas`, `DraftCoach` | ⚠️ à créer |

**Constat** : la banque REWORK **couvre les 6 niveaux** — la structure de Katalyst doit donc
en faire autant. Mais elle est **déséquilibrée vers « Créer »** (6 exercices sur 13), ce qui
justifie votre exigence d'**au moins 2 primitives par niveau**.

**Trois exercices sont hors phase 6** : 5 et 6 (dépendent du studio IA, phase 17),
10 (indicateur 30, phase 20).

---

# Règle de transposition (référence produit)

> Un composant est **admissible** s'il est pertinent pour **au moins 3 formations
> distinctes** du catalogue, **sans modification de code** — seulement de données.
>
> Sinon, ce n'est pas un composant : c'est un contenu.

Cette règle découle directement de la règle d'usage de la source (« adapter le sujet,
garder la structure »). Elle sera appliquée à l'étape 11 (table à 3 contraintes).
