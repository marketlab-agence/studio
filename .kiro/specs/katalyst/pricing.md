# Spec — Tarification Katalyst

> **Règle d'évidence** : tout chiffre de marché ci-dessous porte sa **source** et son **heure de lecture**.
> Les propositions de tarifs Katalyst sont explicitement marquées **[PROPOSITION]** — ce ne sont pas des faits sourcés.
> Lecture : **2026-09-21**.

---

## 1. Les douleurs que Katalyst résout

| # | Douleur | Preuve / coût observable | Ce que fait Katalyst |
|---|---|---|---|
| D1 | **Conformité Qualiopi** | 33 indicateurs (décret 2026-728), audits tous les 18-36 mois ; les logiciels dédiés coûtent 99 à 992 €/mois | Dossier de preuves **produit par le workflow** (ADR 0006) |
| D2 | **Conception pédagogique** | CPA² : la conception = **~60 % du temps** d'une formation | Pipeline à gates + méthode REWORK intégrée (ADR 0005) |
| D3 | **Production multimodale** | Texte, image, audio, vidéo, quiz = 4-5 outils distincts | Studio IA intégré : TTT, TTI, TTS, STT, TTV (ADR 0012, §14 design) |
| D4 | **Interactivité** | Les LMS classiques sont passifs (vidéo + quiz) | Simulateurs manipulables — **100 % des leçons interactives** (ADR 0003) |
| D5 | **Décrochage** | Absence de rythme et de relance | Drip configurable + notifications d'inactivité + gamification (phases 12, 13, 15) |
| D6 | **Fragmentation** | LMS + Qualiopi + IA + chat = 4 abonnements | Un seul outil, une seule facture |
| D7 | **Coût de l'IA** | Les plateformes facturent des crédits mensuels plafonnés | Crédits **achetables à la demande**, coût affiché avant génération |

**Positionnement** : Katalyst est le seul à réunir **LMS + conformité Qualiopi + studio IA + simulations interactives**. Les concurrents couvrent 1 à 2 de ces axes.

---

## 2. Grille concurrentielle (sourcée)

### 2.1 Logiciels Qualiopi / gestion d'organisme (marché français)

| Solution | Tarif | Source | Lu le |
|---|---|---|---|
| **Kaliio** | Gratuit ; Premium **22,90 €/mois** | kaliio.fr/guides/comparatif-logiciels-qualiopi-prix | 2026-09-21 |
| **Certipilot** | ~**14-19 €/mois** | kaliopi.io/guides/logiciel-qualiopi | 2026-09-21 |
| **QIWY** | ~**30-50 €/mois** | kaliopi.io/guides/dendreo-prix-2026 | 2026-09-21 |
| **Qualiobee** | ~**39 €/mois** | kaliopi.io/guides/logiciel-qualiopi | 2026-09-21 |
| **Edusign** | à partir de ~**39 €/mois** | kaliio.fr/guides/comparatif-logiciels-qualiopi-prix | 2026-09-21 |
| **Hop3Team** | à partir de **49 €/mois** | kaliio.fr/guides/comparatif-logiciels-qualiopi-prix | 2026-09-21 |
| **SmartOf** | ⚠️ **sources divergentes** : ~30 €/mois, ~59 €/mois, 75-150 €/mois | kaliopi.io/guides/logiciel-qualiopi ; kaliio.fr ; kaliopi.io/guides/smartof-prix-2026 | 2026-09-21 |
| **Digiforma** | à partir de **99 €/mois** ; **699 €/mois** utilisateurs illimités | digiforma.com/prix | 2026-09-21 |
| **Dendreo** | **225 à 992 €/mois HT** + setup dès **1 490 € HT** | kaliopi.io/guides/dendreo-prix-2026 ; kaliio.fr | 2026-09-21 |
| **Ypareo** | sur devis, ~**250-600 €/mois** | kaliio.fr/guides/comparatif-logiciels-qualiopi-prix | 2026-09-21 |

> ⚠️ **Sources divergentes sur SmartOf** : rapportées telles quelles, non fusionnées (30 / 59 / 75-150 €/mois selon la source et le plan).

### 2.2 Plateformes LMS / e-learning (international)

| Solution | Tarif | IA incluse | Source | Lu le |
|---|---|---|---|---|
| **LearnWorlds** | Starter **29 $/mois** (+5 $/inscription) · Pro Trainer **99 $/mois** · Learning Center **299 $/mois** · +app mobile **598 $/mois** | **300 / 500 / 1 000 crédits IA par mois** selon le plan | learnworlds.com/pricing | 2026-09-21 |
| **Thinkific** | Basic **54 $/mois** · Start **109 $/mois** · Grow **219 $/mois** · Expand **499 $/mois** · app mobile **+199 $/mois** | — | thinkific.com/pricing ; support.thinkific.com (13/08/2026) | 2026-09-21 |
| **Teachable** | ~**39-59 $/mois** | — | learnworlds.com/blog (17/09/2025) | 2026-09-21 |
| **360Learning** | **8 $/utilisateur/mois** (jusqu'à 100 users) | — | 360learning.com/pricing | 2026-09-21 |
| **iSpring LMS** | **3,58 $/utilisateur/mois** | — | capterra.com | 2026-09-21 |

**Enseignement clé** : **LearnWorlds facture déjà en « crédits IA » mensuels** (300 à 1 000). Le modèle de crédits de Katalyst est donc **aligné sur le marché** — avec un avantage : crédits **achetables à la demande**, sans plafond mensuel imposé.

### 2.3 REWORK (référence produit)

| Solution | Tarif | Source | Statut |
|---|---|---|---|
| **REWORK** (`app.rework.school`) | ❌ **Non public** | app.rework.school (page sans tarifs) | **Source manquante** — aucune donnée de prix disponible |

> Les autres « Rework » trouvés sont des **homonymes sans rapport** (rework.com = plateforme sales ops ; rework.so = application mail ; Rework Academy = bootcamp Nigeria ; ReSchool = logiciel scolaire indien). **Ils ne sont pas des concurrents de Katalyst.**

---

## 3. Positionnement proposé

```
                    Coût mensuel
 0 €   30 €    99 €      149 €      225 €          600 €+
  │      │       │          │          │              │
Kaliio  QIWY  Digiforma  [KATALYST  Dendreo       Ypareo
  │    Qualiobee  │       INSTITUT]      │
  │      │        │          │           │
  └──────┴────────┴──────────┴───────────┴───────────
   Qualiopi seul      LMS + Qualiopi + IA + interactif
```

**Logique** : Katalyst n'est pas un logiciel Qualiopi de plus. Il remplace **4 abonnements** (LMS + Qualiopi + IA + outil de création). Son prix se situe donc **au-dessus du Qualiopi seul** et **en dessous des ERP lourds** (Dendreo/Ypareo).

---

## 4. Modèle tarifaire **[PROPOSITION]**

> ⚠️ Les montants ci-dessous sont une **recommandation dérivée des fourchettes observées**, pas des faits sourcés. À valider par le propriétaire.

| Offre | Prix | Cible | Contenu |
|---|---|---|---|
| **Découverte** | **0 €** | Curieux, test | 1 formation · 1 cohorte · 10 apprenants · **crédits IA offerts (découverte)** |
| **Formateur** | **~39 €/mois** | Formateur indépendant, coach, professeur | Formations illimitées · cohortes illimitées · **crédits IA inclus/mois** · marque Katalyst |
| **Institut / Académie** | **~149 €/mois** | Institut, académie, petit OF | Multi-formateurs · **marque propre** · **dossier de preuves Qualiopi** · crédits IA inclus · rôles avancés |
| **CFA / Entreprise** | **Sur devis** | Structures multi-sites | Illimité · SSO · SLA · accompagnement · facturation consolidée |
| **Crédits IA** | **Packs rechargeables** | Tous | Achat à la demande, **coût affiché avant génération** (REQ-AIC-04) |

**Ancrages du raisonnement** :
- **Formateur ~39 €** : entre Kaliio Premium (22,90 €) et SmartOf (75 €) — justifié par le LMS + IA + interactivité que ces outils n'ont pas.
- **Institut ~149 €** : au-dessus de SmartOf (75-150 €) car Qualiopi **et** LMS **et** IA ; bien en dessous de Dendreo (225 €+ et 1 490 € de setup).
- **CFA/Entreprise** : territoire Dendreo/Ypareo (250-600 €+), sur devis.
- **Sans frais de setup** : différenciateur direct contre Dendreo (1 490 € HT) et contre l'engagement annuel imposé.

### Facturation au niveau organisation

Conforme à l'ADR 0007 : abonnement **et** crédits portés par l'**organisation**, pas par l'utilisateur. Le propriétaire gère ; les membres consomment selon leurs permissions (REQ-ORG-08).

---

## 5. Réserves et points à valider

| # | Réserve |
|---|---|
| R1 | **Les tarifs de REWORK sont inconnus** — impossible de s'y aligner directement. Le positionnement repose donc sur les marchés Qualiopi et LMS. |
| R2 | **SmartOf : sources divergentes** (30 / 59 / 75-150 €) — à vérifier sur la grille officielle avant tout arbitrage. |
| R3 | Les montants **[PROPOSITION]** doivent être validés par le propriétaire, puis testés (élasticité, taux de conversion). |
| R4 | Les **coûts réels** (hébergement, coût des appels IA, support) ne sont pas encore connus → la marge n'est pas calculable à ce stade. |
| R5 | Le **coût de la vectorisation** (embeddings, ADR 0012) consomme des crédits IA : la tarification des crédits doit l'intégrer. |
| R6 | La **TVA** et le régime applicable aux organismes de formation (exonération possible) relèvent du conseil fiscal, pas de ce document. |
| R7 | Aucune donnée de **conversion ou d'élasticité** n'est disponible : le prix reste une hypothèse à tester. |

---

## 6. Références

- `@.kiro/specs/katalyst/design.md` §14 (studio IA & crédits), §17 (facturation organisation)
- `@.kiro/specs/katalyst/requirements.md` `PAY`, `ORG-08`, `AIC-03/04`
- `@.kiro/specs/katalyst/adr/0006-conformite-qualiopi.md`
- `@.kiro/specs/katalyst/tasks.md` phase 24 (paiement), gate **G4**
