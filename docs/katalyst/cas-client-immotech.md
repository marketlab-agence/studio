# Étude de cas de référence — Formation « Immotech »

> **Nature** : **cas client réel produit de bout en bout** avec la méthode REWORK.
> Il sert de **modèle de ce que Katalyst doit savoir produire**.
>
> **Source (non recopiée)** : `1. Consulting IA/Formation REWORK/Livrables/Clients/Immotech/`
> — 7 fichiers, 262 lignes. Le dossier local est **source de vérité** ; il n'est pas
> dupliqué ici pour éviter la divergence (décision du 2026-09-23).
>
> **Pourquoi ce cas compte** : c'est la **preuve qu'un livrable conforme est réalisable**.
> Qualiopi exige des preuves (indicateurs 4, 5, 6, 11, 19) ; ce cas montre à quoi elles
> ressemblent concrètement.

---

## 1. Structure du dossier client — à reproduire dans Katalyst

```
Immotech/
  01-Cahier-des-charges/    → Cahier-des-charges-Immotech.md      (37 l.)
  02-Programme/             → Programme-Immotech.md               (45 l.)
  03-Production/            → Supports-et-quiz-Immotech.md        (83 l.)
  04-Animation/             → Animation-Immotech.md               (21 l.)
  05-Analyse/               → Evaluation-et-bilan-Immotech.md     (26 l.)
  DECISIONS.md              → avals tracés                        (19 l.)
  00-Synthese-Methodes-REWORK.md → rappel des méthodes            (46 l.)
```

**Correspondance directe avec le pipeline CPA² à gates** (voir `@docs/rework/formats.md` §4) :
chaque dossier = une phase, et `DECISIONS.md` porte la **trace des avals**.

**Conséquence produit** : la structure d'une formation dans Katalyst devrait **refléter cette
arborescence** — c'est la forme sous laquelle un organisme prouve sa conformité.

---

## 2. Correspondance étape par étape — ce que Katalyst doit produire

| Dossier source | Phase CPA² | Ce que Katalyst doit produire | Indicateur RNQ |
|---|---|---|---|
| `01-Cahier-des-charges/` | **Concevoir** | Questionnaire QQOQCCP + Identimètre renseignés | **4** |
| `02-Programme/` | **Concevoir** | Objectifs Bloom + déroulé 6 colonnes + fiche 17 rubriques | **5**, **6** |
| `03-Production/` | **Produire** | Supports, quiz, médias | 17 (moyens) |
| `04-Animation/` | **Animer** | Brise-glace, plan d'animation, fiche SAVI | 12 (phase 20) |
| `05-Analyse/` | **Analyser** | Éval à chaud, analyse, bilan C.8 | 30, 31, 32 (phase 20) |
| `DECISIONS.md` | **Transversal** | Journal des avals, horodaté | **32** (traçabilité) |

**Observation décisive** : le cas Immotech **couvre déjà 2 des 5 indicateurs de la phase 6**
(4 et 5-6). Il démontre que la méthode REWORK produit les preuves attendues — **Katalyst n'a
donc pas à inventer une conformité, il a à industrialiser une pratique existante.**

---

## 3. Le fichier `DECISIONS.md` — modèle de traçabilité

Extrait du modèle (`_modele_DECISIONS.md`, 13 l.) : chaque décision porte **une date** et
**une remarque**, et **aucune phase ne passe sans aval tracé**.

**C'est exactement ce que l'indicateur 32 exige** : *« une démarche d'amélioration continue
à partir de l'analyse des appréciations et des réclamations, ainsi qu'une analyse des
risques »*. Un journal d'avals **est** une analyse de risques documentée.

**Conséquence produit (phase 20)** : Katalyst doit conserver un **journal d'avals par
formation**, pas seulement l'état final. C'est une fonctionnalité à prévoir, pas un
accessoire.

---

## 4. Ce que ce cas révèle sur la contrainte de modification

Votre contrainte (2026-09-23) : *« toute formation doit demeurer modifiable — allongeant ou
raccourcissant le nombre de chapitres et/ou le nombre de leçons par chapitre. »*

Le cas Immotech montre que le pipeline est **itératif par nature** : les gates permettent de
**revenir** sur une phase (arbitrage, compression). Une formation n'est donc **jamais figée**
après coup.

**Conséquence sur l'indicateur 11** : si une leçon change de contenu, son niveau Bloom peut
devenir **obsolète**. La conformité doit donc être **re-vérifiable à tout moment** — ce qui
justifie que `npm run audit:content` soit **rejouable**, et non un contrôle unique à la
création.

---

## 5. Comment s'en servir

- **Pour la conception des composants** (étape 11) : les livrables de `02-Programme/`
  montrent quelles **traces** sont réellement produites.
- **Pour la phase 20** : la structure en 5 dossiers + `DECISIONS.md` est le **gabarit du
  dossier de preuves exportable** (REQ-QLF-02).
- **Pour les tests de l'étape 17** : recréer Immotech via l'IA de Katalyst et **comparer**
  au livrable réel — c'est le meilleur test de conformité disponible.

---

## 6. Référence exacte

```
C:\Users\khali\OneDrive\Documents\Projets\1. Consulting IA\Formation REWORK\Livrables\Clients\Immotech\
```

⚠️ **Ce dossier est hors du dépôt Katalyst.** Il appartient au socle REWORK et doit être lu
sur place. Ne pas le dupliquer dans `docs/` : la source reste la référence, et une copie
divergerait.

*Document établi le 2026-09-23.*
