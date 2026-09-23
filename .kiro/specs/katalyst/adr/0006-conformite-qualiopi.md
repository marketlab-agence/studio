# ADR 0006 — Conformité Qualiopi comme objectif produit

- **Statut** : accepté — **gate G5 LEVÉ** (2026-09-23)
- **Date** : 2026-09-21 (révisé le 2026-09-23)
- **Phases concernées** : 6 (indicateurs pédagogiques), 20 (conformité complète)

> **⚠️ Mise à jour du 2026-09-23 — le référentiel officiel est obtenu.**
>
> Le **texte intégral du décret n° 2026-728** (33 indicateurs, en vigueur au 01/11/2026) a été
> fourni par l'utilisateur. Il est consigné dans
> **`@docs/katalyst/conformite-rnq-v10.md`**, qui devient la **source de vérité du RNQ dans
> le projet**.
>
> **Le présent ADR ne duplique plus le référentiel** : il enregistre la décision et renvoie
> au document de référence. Toute divergence entre les deux se résout **en faveur de
> `docs/katalyst/conformite-rnq-v10.md`**, qui cite le décret.

## Contexte

L'utilisateur veut que Katalyst devienne **une référence pour créer des formations conformes à Qualiopi**. Qualiopi est la certification qualité obligatoire des organismes de formation français (loi Avenir professionnel), structurée autour d'un référentiel national qualité (RNQ) de **7 critères et 32 indicateurs**.

**Constat de recherche (à consigner honnêtement)** : une recherche exhaustive dans le corpus fourni (`1. Consulting IA/Formation REWORK/`, tous `.md` et `.txt`) donne **zéro occurrence de « Qualiopi »**. Le référentiel officiel n'est **pas** dans les sources disponibles.

En revanche, le corpus contient le **référentiel France Compétences C.1-C.8** (« Exercer la mission de formateur en entreprise », RS7379), qui est adjacent et largement recouvrant sur le plan pédagogique.

Principe appliqué : **pas de source → pas d'affirmation.** On n'invente pas un mapping Qualiopi.

### Mise à jour du 2026-09-21 — le référentiel a changé

Recherche complémentaire : le RNQ a été **révisé par décret**, ce qui **lève partiellement le gate G5**.

| Fait | Valeur | Source | Lu le |
|---|---|---|---|
| Décret | **n° 2026-728 du 1er août 2026** (NOR TRSD2619632D), JO du 4 août 2026 | legifrance.gouv.fr (JORFTEXT000054608509) | 2026-09-21 |
| Entrée en vigueur | **1er novembre 2026** | idem | 2026-09-21 |
| Indicateurs | **33** (au lieu de 32) — 7 critères inchangés | copilof.fr ; certiforma.fr ; c2rp.fr | 2026-09-21 |
| Indicateurs modifiés | **12** | c2rp.fr | 2026-09-21 |
| Nouvel indicateur 33 | Spécifique **CFA** (évaluation des enseignements par les apprentis) | c2rp.fr ; certiforma.fr | 2026-09-21 |
| Nouvelles exigences | Transparence des **modalités de calcul** des résultats · procédures contre **VSS/harcèlement/discriminations** · traçabilité de la **sous-traitance** · gestion **préventive des risques** · effectivité du suivi **à distance** | c2rp.fr | 2026-09-21 |

**Conséquence sur le plan** : le référentiel officiel est désormais **identifiable et sourcé** (décret + guide de lecture V10). Le gate G5 passe de « source manquante » à « **source identifiée — guide de lecture V10 à récupérer** ». La phase 20 peut démarrer dès obtention du texte intégral des 33 indicateurs.

**Impact produit** : trois nouvelles exigences deviennent des fonctionnalités différenciantes — transparence des résultats (indicateurs calculés et publiés), prévention des VSS (procédure intégrée), traçabilité de la sous-traitance. À intégrer en phase 20.

## Décision

1. **Inscrire la conformité Qualiopi comme exigence produit** (domaine `QLF`, 6 exigences).
2. **Ouvrir le gate G5** : obtenir le référentiel national qualité officiel avant d'exécuter la phase 15.
3. **Exploiter dès maintenant le référentiel C.1-C.8** comme socle disponible, en le mappant explicitement aux fonctionnalités (REQ-QLF-05).
4. **Produire un dossier de preuves exportable** par formation (REQ-QLF-02) — c'est la valeur différenciante.
5. **Rendre l'accessibilité handicap systématique et bloquante** (REQ-QLF-03), car elle est citée 3 fois dans C.1/C.3/C.4.

## Conséquences

### Positives
- Katalyst se positionne au-delà d'un simple LMS : il **produit la preuve** de conformité, ce qui est le point douloureux des organismes de formation.
- Le pipeline REWORK (ADR 0005) génère déjà la matière des preuves : analyse de demande, objectifs, déroulé, évaluations, bilan.
- Le mapping C.1-C.8 est immédiatement exploitable et couvre l'essentiel du volet pédagogique.

### Négatives / coûts
- **Dépendance à une source externe** (RNQ) non encore obtenue → la phase 15 ne peut pas être exécutée à ce jour.
- Le mapping Qualiopi complet (7 critères / 32 indicateurs) reste à établir et à valider — travail de conformité, non technique.
- Risque juridique si la conformité est présentée comme garantie alors qu'elle dépend de l'usage réel de l'organisme.
- L'accessibilité bloquante peut ralentir la création : à équilibrer avec l'ergonomie (REQ-DSG-05).

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Inventer un mapping Qualiopi de mémoire** | Violation du principe « pas de source → pas d'affirmation » |
| **Ignorer Qualiopi** | Contredit l'exigence explicite de l'utilisateur |
| **Se limiter à C.1-C.8** | Couvre le pédagogique mais pas le RNQ complet ; insuffisant pour « référence Qualiopi » |
| **Acheter une solution de conformité tierce** | Contraire à l'agnosticité ; et ne produirait pas la valeur intégrée |

## Références

- `@.kiro/specs/katalyst/requirements.md` domaine `QLF`
- `@.kiro/specs/katalyst/design.md` §16
- `@.kiro/specs/katalyst/tasks.md` phase 15, gate **G5**
- Source disponible : `1. Consulting IA/Formation REWORK/Certification/CCE-RS7379-Dossier.md` §4
- **Source manquante** : référentiel national qualité Qualiopi (7 critères / 32 indicateurs)
