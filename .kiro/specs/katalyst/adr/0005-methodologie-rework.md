# ADR 0005 — La méthodologie REWORK devient le moteur pédagogique de Katalyst

- **Statut** : accepté
- **Date** : 2026-09-21
- **Phases concernées** : 13, 14

## Contexte

Katalyst produit aujourd'hui du contenu pédagogique sans cadre méthodologique explicite : les 6 formations divergent en structure, profondeur et interactivité (voir ADR 0003). L'IA génère des cours sans référentiel de qualité, et rien ne garantit qu'une formation produite soit pédagogiquement solide.

Le propriétaire dispose d'un **corpus méthodologique complet et éprouvé**, la formation REWORK « Former avec l'IA » (CCI Formation Pro), présent dans `1. Consulting IA/Formation REWORK/` :

- **6 skills** : `rework-cpa2`, `rework-conception`, `rework-programme`, `rework-daily`, `rework-exercices`, `rework-prompt`
- **`Grenier/Methodes.md`** — le référentiel : CPA², ACTIF, 4 méthodes + 4 modèles de prompting, Identimètre, Bloom, déroulé 6 colonnes, fiche programme 17 rubriques, QQOQCCP, SAVI, évaluation, AI Act
- **Pipeline à gates** en 5 phases avec avals obligatoires
- **11 templates** opérationnels

L'utilisateur demande que ce contenu soit « exploité pour cette web app sur tous les plans et dans son entièreté ».

## Décision

Faire de la méthodologie REWORK le **moteur pédagogique** de Katalyst, encodé dans le produit et non documenté à côté.

1. **Référentiel de référence** : `.kiro/steering/rework-methodology.md` (source de vérité, ne pas inventer de variantes).
2. **Pipeline à gates** encodé dans l'outil de création (phase 14) — aucun saut de phase.
3. **Validation automatique** : objectifs Bloom (verbes interdits), contrôle arithmétique du déroulé, seuil sommatif 80 %.
4. **Identimètre et QQOQCCP** deviennent des formulaires du cahier des charges.
5. **Prompts IA construits en ACTIF** (phase 13), routés selon les 4 modèles d'échange.
6. **Donnée manquante → `[À COMPLÉTER]`**, jamais inventée.
7. **Justification obligatoire de chaque usage IA** — exigence C.2/C.3 du référentiel France Compétences.

## Conséquences

### Positives
- Qualité pédagogique **vérifiable**, pas déclarative.
- L'IA produit un contenu **conforme par construction**, plus par espoir.
- Différenciation produit forte : Katalyst encode une méthode que les concurrents traitent comme un document Word.
- Base directe pour la conformité Qualiopi (ADR 0006) : les preuves sont produites par le workflow lui-même.
- Réutilisation d'un corpus déjà validé en certification (CCE RS7379).

### Négatives / coûts
- Le pipeline à gates **contraint** l'auteur : c'est voulu, mais l'ergonomie doit compenser (REQ-DSG-05, REQ-AIC-08).
- Charge de conception supplémentaire : transformer 11 templates en composants d'interface.
- Toute évolution de la méthode impose une mise à jour du référentiel et du code.
- Risque de rigidité : prévoir un mode « expert » pour les auteurs avancés (hors périmètre initial).

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Laisser la méthode hors produit** (doc Word) | Aucune garantie de conformité ; c'est l'état actuel |
| **Créer une méthode maison** | Le corpus REWORK est déjà validé ; en créer une autre serait du gaspillage |
| **Utiliser un standard générique (ADDIE)** | Moins riche que CPA² + ACTIF + Identimètre pour notre cas ; ne couvre pas le prompt engineering |
| **Imposer la méthode sans ergonomie** | Rejetée par les auteurs ; d'où REQ-DSG-05 et REQ-AIC-08 |

## Références

- `@.kiro/steering/rework-methodology.md`
- `@.kiro/specs/katalyst/design.md` §14, §15
- `@.kiro/specs/katalyst/tasks.md` phases 13, 14
- Source : `1. Consulting IA/Formation REWORK/` (Grenier, skills, Certification)
