# ADR 0003 — Modèle de formation de référence (GitHub + interactivité)

- **Statut** : accepté
- **Date** : 2026-09-21
- **Phases concernées** : 1, 6, 8

## Contexte

Le contenu actuel est **incohérent** : aucun modèle commun. Mesures sur les 6 formations :

| Formation | Chapitres | Leçons | Interactif | Visuel | Quiz | `plan`/`generationParams` |
|---|---|---|---|---|---|---|
| **git-github** | **11** | **37** | **26 (70 %)** | 9 (24 %) | **1** | ❌ |
| jira | 5 | 15 | 15 (100 %) | 15 (100 %) | ❌ | ✅ |
| n8n | 5 | 15 | 13 (87 %) | 15 (100 %) | ❌ | ✅ |
| closing | 2 | 4 | 4 (100 %) | 4 (100 %) | ❌ | ✅ |
| marketing | 2 | 4 | 4 (100 %) | 4 (100 %) | ❌ | ✅ |
| prompt engineering | 1 | 5 | 4 (80 %) | 1 (20 %) | ❌ | ✅ |

Aucune formation n'est complète : le cours GitHub détient le **volume interactif** (26 leçons) et le **seul quiz**, mais le **plus faible taux de visuels** et **aucune métadonnée IA**. Jira/n8n sont à 100 % de visuels mais **sans quiz**. Le prompt engineering est le plus pauvre (1 chapitre, 5,3 k caractères).

Par ailleurs, `LessonView.tsx` importe **37 composants en dur** (lignes 11-47) tandis que le flow IA `suggest-lesson-components-flow` reçoit une liste **séparée** — les deux sources sont désynchronisées. L'IA peut donc proposer un composant que l'UI ne saura pas rendre.

Le propriétaire a désigné le cours **GitHub comme référence**, en précisant la raison : c'est **le plus interactif**, et les formations ne doivent pas être « que théoriques avec des visuels mais **interactives** ».

## Décision

Adopter un **modèle de référence composite** :

1. **Profondeur du cours GitHub** — granularité fine : ~11 chapitres, ~37 leçons.
2. **100 % des leçons dotées d'un composant interactif** — exigence non négociable (REQ-CNT-02).
3. **Typage des leçons** inspiré de REWORK : `VIDEO`, `CAPSULE`, `MISE_EN_PRATIQUE`, `EVALUATION`, `TEXTE`, `IMAGE`, `MEDIA`, `LIEN`.
4. **Hiérarchie Semaine / Jour** : `S.n.J.m` (S = semaine de formation, J = jour). Un chapitre se termine sur une semaine (lundi→vendredi). **Jamais « semestre »** — correction explicite du propriétaire.
5. **Registre de composants unique** (`src/components/registry.ts`) : source unique pour l'UI, l'IA et l'outil de création.
6. **Métadonnées IA obligatoires** : `plan` et `generationParams` sur toute formation.

Le modèle est encodé dans le schéma Postgres (ADR 0001) — le schéma **doit** refléter le modèle, d'où l'ordre phase 1 → phase 2.

## Conséquences

### Positives
- Fin de la divergence : une seule définition de « formation conforme », mesurable par `npm run audit:content`.
- L'IA ne peut plus produire de contenu non rendable (registre = source unique).
- L'interactivité devient vérifiable automatiquement (REQ-CNT-02).
- La numérotation `S/J` rend le rythme pédagogique explicite et alimente le drip (phase 9).

### Négatives / coûts
- **La conformité des 5 formations non conformes est un travail de création de contenu**, pas un refactor (phase 6).
- Le refactor de `LessonView.tsx` (37 imports → registre) est un prérequis, pas un bonus.
- La conversion 2 niveaux → 3 niveaux impose un ETL (phase 2).
- Risque de régression visuelle sur les 6 formations lors du passage au registre → test de non-régression obligatoire.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **GitHub comme référence littérale** | Dégraderait jira/n8n (100 % de visuels → 24 %) ; non conforme à l'intention exprimée |
| **jira/n8n comme référence** | Ne résout pas l'absence de quiz ; profondeur moindre que GitHub |
| **Statu quo** | Divergence non maîtrisable ; l'IA reste imprévisible |
| **« Semestre » au lieu de « Semaine »** | Contredit la correction explicite du propriétaire et les captures (`S.1.J.2`) |

## Références

- `@.kiro/specs/katalyst/design.md` §3, §5, §7
- `@.kiro/specs/katalyst/tasks.md` phases 1, 6, 8
- `@.kiro/steering/domain-glossary.md`
- Captures de référence : `C:\Users\khali\Downloads\APP REWORK SCREENSHOTS` (**4 lues sur 16**)
