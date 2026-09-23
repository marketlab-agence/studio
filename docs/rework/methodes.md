# Méthodes REWORK — référence complète

> **Source normative** : `1. Consulting IA/Formation REWORK/Grenier/Methodes.md`
> + `Templates Prompts.md`, complétés par les notes de certification.
>
> **Articulation avec le projet** :
> - `@.kiro/steering/rework-methodology.md` — **résumé de travail** (décisions produit)
> - ce document — **référence complète** (à consulter pour le détail)
>
> Aucun des deux ne doit contredire l'autre : le résumé renvoie ici pour le détail.

---

## 1. CPA² — le cadre structurant

| Phase | Part du temps | Contenu |
|---|---|---|
| **C**oncevoir | **~60 %** | Objectifs Bloom, déroulé 6 colonnes, scénario, public/prérequis, évaluation prévue |
| **P**roduire | **~30 %** | Supports, slides, quiz, médias (images, voix off, vidéos), évaluations |
| **A**nimer | **~10 %** (avec Analyser) | Brise-glace, activités, guidage, évaluations en session |
| **A**nalyser | inclus | Résultats, retours, amélioration continue, bilan |

**Conséquence produit** : l'outil de création reflète CPA² — chaque écran correspond à une
phase, et le parcours guide le formateur de Concevoir → Produire → Animer → Analyser.

> **Lien RNQ V10** : cette traçabilité par phase est directement mobilisable pour
> l'indicateur 32 (amélioration continue et analyse des risques).

---

## 2. ACTIF — structure de tout prompt

Voir le détail et les exemples dans `@docs/rework/formats.md` §5.

**Ordre officiel : A-C-T-I-F** (Action, Contexte, Tonalité, Identité, Format).
Source : Matthieu Corthesy, citée par la formation.

---

## 3. Prompting — 4 méthodes + 4 modèles d'échange

Voir le détail dans `@docs/rework/formats.md` §6.

**Méthodes** : Zero-shot · Few-shot · Chain of Thought · Role prompting.
**Modèles** : Content prompting · Adversarial · Espaces réservés · Interaction inversée.

**Routage** : quiz → espaces réservés · résumé → content prompting · concepts créatifs →
adversarial · besoin flou → interaction inversée.

---

## 4. Identimètre — 5 piliers du public

1. **Profil personnel** — âge, cadre de vie, centres d'intérêt, préférences d'apprentissage
2. **Profil professionnel** — poste, missions, secteur, expérience
3. **Niveau de connaissance** — acquis, point de départ
4. **Attentes et motivations** — objectifs, résultats espérés
5. **Freins et pain points** — obstacles, craintes, résistances

**Conséquence produit** : l'Identimètre est un **formulaire du cahier des charges**, pas un
document externe.

> **Lien RNQ V10** : indicateur 4 — *« analyse le besoin du bénéficiaire en lien avec
> l'entreprise et/ou le financeur »*. L'Identimètre est la **preuve** de cette analyse.

---

## 5. Objectifs pédagogiques (Bloom)

**Formule** : « L'apprenant sera capable de + **VERBE D'ACTION** + objet
(CONDITIONS ; CRITÈRES DE RÉUSSITE) »

- 3 critères : point de vue apprenant · **un** verbe d'action · conditions et critères
  **entre parenthèses** (partie formateur)
- **Verbes interdits** : « comprendre », « savoir »
- **6 niveaux** : Connaître → Comprendre → Appliquer → Analyser → Évaluer → Créer

> **Lien RNQ V10** : indicateur 5 — *« définit les objectifs opérationnels et évaluables »*.
> La contrainte « verbe d'action + critères » est exactement ce que l'indicateur exige.

---

## 6. QQOQCCP — analyse de la demande

**Quoi** (problématique + objectif global) · **Qui** (stagiaires, intervenants, responsables) ·
**Où** (lieu, présentiel/distanciel, matériel) · **Quand** (durée, fréquence, planning) ·
**Comment** (méthodes, modalités) · **Combien** (budget, moyens) · **Pourquoi** (raisons du
lancement, objectifs visés).

Devise du cours : *« perdez du temps avec l'analyse de la demande »* — plus l'analyse est
fine, plus la formation est adaptée.

---

## 7. SAVI — animation difficile

| Axe | Contenu |
|---|---|
| **S**écuriser | Environnement sûr, normaliser les difficultés (« ça fait partie de l'apprentissage »), règles de respect, écoute active, empathie |
| **A**gir | Intervenir vite avant aggravation, adapter les méthodes, reformuler/simplifier, ressources supplémentaires |
| **V**aloriser | Reconnaître efforts et progrès même mineurs, feedback constructif, célébrer les succès |
| **I**mpliquer | Travaux de groupe, solliciter les retours, faire verbaliser le blocage, favoriser l'autonomie |

**Exemple** : participant confus → rassurer (sentiment normal) → revoir ensemble/simplifier →
souligner l'effort → lui faire préciser sa confusion et intégrer ses idées.

> **Lien RNQ V10** : indicateur 12 — *« mesures pour favoriser l'engagement des bénéficiaires
> et prévenir les ruptures de parcours »*. SAVI en est la mise en œuvre concrète.

---

## 8. Assistants IA — system prompt en 4 points

Un assistant = LLM + base documentaire fournie + instructions (system prompt), partageable.

Les 4 parties du system prompt :
1. **Rôle** (avec compétences précises — comme le *I* d'ACTIF)
2. **Consignes** (processus simple/linéaire, ou itératif avec embranchements)
3. **Contraintes** (re-spécifier ce que l'assistant rate)
4. **Éléments annexes** (recentrage si hors sujet + **anti-divulgation des instructions**
   contre le reverse-prompting)

**Base de connaissances** : fournir des documents **ciblés** (extraire la page utile plutôt
que 300 pages) et dire dans les instructions **quand** aller y chercher quoi.

**Répartition d'effort** : 50 % réflexion amont (papier) · 25 % écriture du prompt ·
25 % tests/itérations.

> **Lien direct avec Katalyst** : c'est exactement la mécanique de la **base documentaire**
> (ADR 0012) et des défenses anti-prompt-injection (ADR 0010), étapes 4 et 7 de
> l'indicateur 19 (référent pédagogique).

---

## 9. Évaluation

| Type | Moment | Seuil |
|---|---|---|
| **Formative** | Pendant | — |
| **Sommative / certificative** | Fin | **80 %** |
| **À chaud** | Fin de session | Satisfaction |
| **À froid (J+30)** | Après mise en pratique | **Non systématique** — sur aval explicite |

Analyse IA des résultats + bilan structuré **C.8** : réussites / écarts / acquis /
prolongements.

---

## 10. Éthique, droit, écologie (AI Act)

- **AI Act** : 4 niveaux de risque — inacceptable (interdit) · haut (évalué) · limité
  (transparence) · minimal (libre)
- **Droit d'auteur (France)** : *« œuvres 100 % IAG non protégées »* — l'IA n'est pas auteur
- **Écologie** : sobriété d'usage (coût énergétique des requêtes)

**Conséquence produit** : signalement du contenu généré par IA (transparence), information
sur le coût en crédits, mention des droits dans les CGU.

---

## 11. Accessibilité & handicap — réflexe systématique

Cité **3 fois** dans le référentiel France Compétences (C.1, C.3, C.4).
Exigences : sous-titrage · contraste · lecteurs d'écran · formats alternatifs · adaptations
des locaux et supports · aides techniques.

**Conséquence produit** : **checklist handicap** intégrée au parcours de création, et
métadonnées d'accessibilité **imposées** par le moteur de contenu.

> **Lien RNQ V10** : indicateur 1 (*« accessibilité aux personnes en situation de handicap »*
> dans l'information publique), indicateur 17 (moyens), indicateur 26 (réseau handicap).

---

## 12. Référentiel France Compétences C.1-C.8

| Comp. | Exigence | Actifs REWORK |
|---|---|---|
| **C.1** | Analyser la demande | QQOQCCP + Identimètre |
| **C.2** | Concevoir séquence/module (+ IA justifiée) | Bloom + déroulé 6 col. + 5 méthodes |
| **C.3** | Supports multimodaux + **accessibilité** | TTI/TTS/quiz + checklist handicap |
| **C.4** | Logistique + handicap | Déroulé (matériel, durées) + checklist J-1/Jour J |
| **C.5** | Posture (bienveillance, écoute) | SAVI + brise-glace |
| **C.6** | Méthodes actives + remédiation | 5 méthodes + SAVI-Agir |
| **C.7** | Évaluer les acquis | Quiz, observation, critères **donnés avant** l'exercice |
| **C.8** | Bilan hiérarchie/RH | Éval à chaud + analyse + bilan structuré |

**Justifier CHAQUE usage IA** (pourquoi, quel gain) — exigence explicite de C.2/C.3.

> **Articulation avec le RNQ V10** : C.1-C.8 est le référentiel **France Compétences**
> (RS7379, « Exercer la mission de formateur en entreprise »). Le RNQ V10 est le référentiel
> **Qualiopi**. Les deux sont **adjacents et largement recouvrants** pédagogiquement — voir
> le mapping dans `@docs/katalyst/conformite-rnq-v10.md`.

---

## 13. Banque de prompts REWORK — inventaire

> **Non recopié volontairement.** Les prompts sont des **outils de travail évolutifs**, pas
> des normes. Ils vivent dans la source :
> `1. Consulting IA/Formation REWORK/Grenier/Templates Prompts.md` (138 lignes).
> Seuls les **invariants** (ACTIF, 4 modèles) sont repris dans ce document.

| N° | Prompt | Usage | Modèle mobilisé |
|---|---|---|---|
| 1 | Quiz d'évaluation | Générer un quiz | ACTIF + Espaces réservés |
| 2 | Objectif pédagogique | Rédiger un objectif Bloom | ACTIF + Espaces réservés + Bloom |
| 3 | Déroulé pédagogique | Construire le tableau 6 colonnes | ACTIF |
| 4 | Fiche programme | Produire la fiche 17 rubriques | ACTIF |
| 5 | Brise-glace | Concevoir une ouverture | ACTIF |
| 6 / 6bis | Évaluation à chaud | Formulaire de satisfaction | ACTIF (+ A4 imprimable) |
| 7 | Analyse des résultats | Traiter les données d'évaluation | + variante Excel |
| 8 | Prompt visuel (TTI) | Générer une image | [DESCRIPTEURS] + [MODIFIEURS] |
| 9 | System prompt d'assistant | Créer un assistant IA | 4 points |
| 10 | Cahier des charges | Cadrer une demande | ACTIF + QQOQCCP |
| 11 | Fiche réflexe SAVI | Gérer une animation difficile | SAVI |
| — | Bonus | Échange itératif | Adversarial |

**Ce que Katalyst doit automatiser** : ces 12 prompts correspondent à **12 actions** de
l'interface de création. Ils deviendront des **gabarits ACTIF** dans le studio IA (phase 17).

---

## 14. Application à Katalyst — règle produit

Toute formation créée dans Katalyst — par un formateur **ou par l'IA** — doit :

1. Passer par le **pipeline à gates** (aucun saut de phase)
2. Produire des **objectifs Bloom** conformes à la formule
3. Fournir un **déroulé 6 colonnes** avec contrôle arithmétique
4. Documenter **l'accessibilité** (checklist handicap)
5. **Justifier chaque usage IA**
6. Se terminer par une **évaluation** avec critères transparents et seuil 80 %
7. Être **traçable** (preuves conservées) — voir `@.kiro/specs/katalyst/adr/0006`

**Contrainte de réversibilité** (ajout 2026-09-23) : toute formation doit rester
**modifiable** — ajout ou retrait de chapitres et de leçons. La conformité doit donc être
**re-vérifiable à tout moment**, pas seulement à la création.
