# Formats canoniques REWORK

> **Source normative** : les 6 skills du socle local
> `1. Consulting IA/Formation REWORK/.opencode/skill/` —
> `rework-cpa2`, `rework-conception`, `rework-exercices`, `rework-programme`,
> `rework-prompt`, `rework-daily`.
>
> Ces formats sont **copiés** (et non référencés) : ils sont normatifs, l'IA de
> Katalyst doit produire **exactement** ces structures. Voir
> `@docs/rework/methodes.md` pour les méthodes, et `@docs/rework/exercices.md`
> pour la banque d'exercices.

---

## 1. Structure canonique d'un module

*(source : `rework-conception`)*

```
Module : [Titre]
Durée : [X]h | Public : [cible] | Prérequis : [liste]

1. OBJECTIF PÉDAGOGIQUE
2. DÉROULÉ PÉDAGOGIQUE (timeline)
3. CONTENUS (slides, fiches, médias)
4. ACTIVITÉS (exercices, quiz, brise-glace)
5. ÉVALUATION (formative, sommative)
6. SYNTHÈSE & PROCHAINES ÉTAPES
```

**Processus de conception aligné CPA²** — 4 phases : Concevoir (objectif → sous-objectifs →
public → déroulé → méthodes) · Produire (contenus → visuel → médias → supports) · Animer
(brise-glace → activités → transitions → démonstrations) · Analyser (quiz → satisfaction →
critères → grille d'observation).

---

## 2. Gabarit de sortie d'un module

*(source : `rework-conception`)*

```markdown
# Module : [Titre]

| Propriété | Valeur |
|-----------|--------|
| Durée | X heures |
| Public | [description] |
| Prérequis | [liste] |
| Phase CPA² | [phase principale] |
```

---

## 3. Structure canonique d'un exercice

*(source : `rework-exercices`)*

```markdown
## [Type d'exercice] : [Titre]

### Objectif pédagogique
[Phrase avec verbe d'action + conditions + critères]

### Contexte / Mise en situation
[Scénario contextualisé si applicable]

### Consigne
[Instructions claires pour l'apprenant]

### Questions
1. **Question 1** (phase CPA² : [phase])
   - A) Option 1
   - B) Option 2

### Corrigé
1. Réponse B — [Justification pédagogique]

### Barème (si applicable)
[Critères de notation]
```

**Types d'exercices supportés** : Quiz/QCM (QCM 4 options, vrai/faux, **appariement**,
mots croisés) · Brise-glace (ice-breakers, connexion, questions thématiques) · Évaluation
(formative, sommative, à chaud, auto-évaluation) · Mise en situation (étude de cas, scénario,
jeu de rôle, simulation).

**Règles** : aligner chaque question sur une phase CPA² · langage adapté au public ·
**varier les niveaux taxonomiques (mémorisation → analyse → création)** · toujours inclure
le corrigé · format exportable OneNote (HTML simple).

> La règle « varier les niveaux taxonomiques » **fonde** l'exigence d'au moins 2 primitives
> par niveau de Bloom : la source l'impose, ce n'est pas une préférence de Katalyst.

---

## 4. Pipeline de programme à gates (5 phases)

*(source : `rework-programme`)*

```
1. Cahier des charges  → GATE VERROU (QQOQCCP + Identimètre + template n°10)
2. Programme           → Concevoir (Bloom, déroulé 6 col., fiche 17 rubriques)
3. Production          → Produire (texte, slides, visuels, voix, quiz)
4. Animation           → Animer (brise-glace, plan d'animation, SAVI)
5. Analyse             → Analyser (éval à chaud, analyse IA, bilan C.8)
```

**Règle d'avals adaptatifs** :
- Dossier simple (≤ 3 besoins **ou** ≤ 2 jours) → gates **par phase** (5 avals).
- Dossier complexe → gates **par module/séquence** (phases 2-3), gates par phase ailleurs.
- Le **déroulé est TOUJOURS validé par module**.
- **Aucune phase suivante sans aval tracé.**

**Contrôle arithmétique obligatoire** (phase 2, déroulé 6 colonnes) : sommer toutes les
durées, **signaler tout dépassement AVANT le gate**, proposer compression ou arbitrage.

**Toute donnée non fournie est marquée `[À COMPLÉTER]`** — jamais inventée.

> ⚠️ **Ce pipeline est directement pertinent pour l'indicateur 32 du RNQ V10** (analyse des
> risques et amélioration continue) : les gates tracés constituent la preuve d'une démarche
> structurée.

---

## 5. Méthode ACTIF — structure de tout prompt

*(source : `rework-prompt`)*

| Étape | Signification | Exemple |
|---|---|---|
| **A** | **Action** — la tâche précise | « Rédige un quiz de 5 questions sur… » |
| **C** | **Contexte** — infos pour bien répondre | « La formation s'adresse à des néophytes… » |
| **T** | **Tonalité** — style attendu | « Ton professionnel et chaleureux » |
| **I** | **Identité** — rôle attribué à l'IA | « Agis en ingénieur pédagogique expert » |
| **F** | **Format** — structure de sortie | « Tableau de 4 colonnes : numéro, durée, description, matériel » |

> **Ordre officiel REWORK : A-C-T-I-F.** Ne pas confondre avec les variantes circulantes.

---

## 6. 4 méthodes + 4 modèles de prompting (et leur routage)

*(source : `rework-prompt`)*

**Méthodes** :
1. **Zero-shot** — demande directe, sans exemple (tâches simples)
2. **Few-shot** — 1 à 3 exemples avant la demande (guider le format)
3. **Chain of Thought** — raisonner étape par étape (tâches complexes)
4. **Role prompting** — attribuer un rôle/persona (perspective spécifique)

**Modèles d'échange** :
5. **Content prompting** — contenu fourni (PDF, texte, vidéo) comme base
6. **Adversarial** — dialogue itératif Créatif (propose) / Critique (note /5), 2-3 itérations
7. **Espaces réservés** — modèle structurel à trous à remplir
8. **Interaction inversée** — l'IA questionne pour co-construire

**Routage par usage** (à appliquer par l'IA de Katalyst) :

| Usage | Modèle |
|---|---|
| Quiz / QCM | **Espaces réservés** |
| Résumé / contenu fourni | **Content prompting** |
| Concepts créatifs | **Adversarial prompting** |
| Besoin flou à préciser | **Interaction inversée** |

**Routage des modèles LLM** (défaut, ajustable) : structuration et docs longs → Claude ·
idéation, quiz, brise-glace → ChatGPT · analyse de données d'évaluation → Gemini · gros
volumes à coût minimal → DeepSeek.

---

## 7. Fiche programme — canevas 17 rubriques

*(source : `rework-programme` + `rework-conception`)*

Identification · description · objectifs · public visé · durée · nombre de stagiaires ·
lieu/modalité · coût · dates/horaires · contenu pédagogique · mise en situation · prérequis ·
méthodes pédagogiques · modalités de suivi et d'évaluation · **documents remis** ·
**accessibilité** · compétences visées.

> **Documents remis** et **accessibilité** sont deux rubriques exigées par Qualiopi
> (indicateur 1 pour l'accessibilité, indicateur 17 pour les moyens).

---

## 8. Déroulé pédagogique — tableau 6 colonnes

*(source : `rework-conception`)*

1. **Objectifs pédagogiques** (escalier pédagogique)
2. **Modalités** (présentiel, classe virtuelle, micro-learning, MOOC, AFEST…)
3. **Méthodes pédagogiques** (magistrale, interrogative, démonstrative, analogique, découverte)
4. **Activités pédagogiques et contenu** (rôles apprenant/formateur, détails d'animation)
5. **Matériel** physique et digital (supports, outils, wifi, paperboard…)
6. **Durée** de chaque séquence — **la somme doit égaler la durée totale**

---

## 9. Ouverture de session — séquence type en 6 étapes

*(source : `rework-daily` / `Methodes.md`)*

Accueil + présentation formateur → programme + objectifs → règles de vie + horaires →
participants + attentes → **brise-glace** (dynamique/intro sujet) → émargement.

---

## Ce que Katalyst doit automatiser (conséquence produit)

| Format | Usage prévu dans Katalyst |
|---|---|
| Structure canonique de module (§1) | **Prompt IA** — ce que l'IA produit pour un module |
| Structure d'exercice (§3) | **Prompt IA** + validation Zod des exercices |
| ACTIF (§5) | **Champ de formulaire** — les 5 étapes guident l'auteur |
| 4 modèles + routage (§6) | **Sélection automatique** par l'IA selon l'usage |
| Canevas 17 rubriques (§7) | **Gabarit de document** exportable |
| Déroulé 6 colonnes (§8) | **Tableau avec contrôle arithmétique bloquant** |

> ⚠️ **Rappel** : la source dit *« ne pas inventer de variantes hors de cette source »*.
> Ces formats sont donc **contraignants** pour l'IA de Katalyst, pas indicatifs.
