# CHANGELOG — Katalyst

Format inspiré de [Keep a Changelog](https://keepachangelog.com/).
La version de référence est `VERSION` (source unique de vérité).

## [Non publié]

### Ajouté
- Socle de suivi `.kiro` (steering, specs, workflows, hooks, ADR)
- Plan d'exécution en **29 phases** sur 4 couches (fondations · migration agnostique · socle transverse · produit REWORK)
- 12 ADR documentant les décisions structurantes (dont 3 révisions de non-goals)
- Référentiel méthodologique REWORK (`steering/rework-methodology.md`)
- Référentiel des normes applicables (`steering/security-standards.md`)
- Document tarifaire sourcé (`specs/katalyst/pricing.md`)
- Multilingue (FR/EN), API centrale v1, sécurité, défenses anti prompt-injection, conformité SOC 2 / NIS2, base documentaire pgvector

### Modifié
- `package.json` : script `dev:turbo` (`next dev --turbopack`)

### Découvert
- **RNQ Qualiopi V10** : décret n° 2026-728 du 1er août 2026, **33 indicateurs**, en vigueur le 1er novembre 2026
- Les **tarifs de REWORK ne sont pas publics** — source manquante consignée

### Corrigé
- `node_modules` corrompu : paquet `firebase` partiellement extrait (fichiers `.mjs` manquants) → réinstallation
- Repli en lecture sur `src/data/*.json` quand Firestore est indisponible (`src/lib/local-data.ts`)

### Phases 6 → 8bis — livrées (non publiées)

**Phase 6 — Conformité des formations**
- **6/6 formations conformes** : objectifs au format Bloom (`R2` : 142 → 0), niveaux de Bloom déclarés (`R3`), cohérence type ↔ niveau (`R6` : 20 → 0).
- 7 leçons Git converties en `MISE_EN_PRATIQUE` et branchées sur des composants interactifs.
- Correction d'audit : `R6` lit désormais le niveau **déclaré** (et non recalculé).
- Rejouabilité prouvée (`db:export-content` + `COALESCE` dans le seed).

**Phase 7 / 7bis — Purge Firebase & nettoyage E2E**
- Firestore **dé-couplé** : `firebase.ts`, `firebase-admin.ts`, `local-data.ts`, `import-auth.ts` supprimés ; dépendances `firebase`/`firebase-admin` retirées.
- Traçabilité des **11 comptes** migrés (`docs/katalyst/migration-comptes-firebase.md`).
- Nettoyage E2E : `e2e/helpers/purge.ts` + `globalSetup`/`globalTeardown` + `db:cleanup-e2e` ; base de dev assainie (678 → 2 organisations) ; `assertSafeDatabase` en liste blanche (port 5433).
- Déploiement : artefacts Firebase supprimés (Firebase App Hosting abandonné) ; cible **auto-hébergée multi-cloud** (AWS/GCP/Azure) depuis une image unique.

**Phase 8 — Internationalisation**
- Interface bilingue **FR/EN** (`next-intl`), routes `/fr` et `/en`, sélecteur de langue et persistance (`users.language`, cookie `NEXT_LOCALE`).
- Middleware i18n **fusionné** avec l'authentification, sans perte de protection.
- Formats localisés (dates, nombres, devises) ; `courses.language` = attribut de la formation choisi par son créateur — la langue du contenu **n'est pas** une traduction.
- **561 clés** par langue ; `lint:i18n` bloquant en CI ; suite E2E i18n dédiée (8 tests).

**Phase 8bis — Composants pédagogiques multiples par leçon**
- Une leçon porte **N composants ordonnés** (`lesson_components`, clé de substitution `UUID` — le même composant peut apparaître plusieurs fois) ; les colonnes `interactive_component_name`/`visual_component_name` sont supprimées (migration 014, **121 références reprises sans perte**).
- `config { labels, data }` validé par un **schéma Zod strict par composant (58/58)** ; **libellés en données** (aucune traduction produite).
- Sélection IA **pilotée par le niveau de Bloom** : interactifs filtrés par `listByBloomLevel`, visuels proposés par pertinence illustrative (sans contrainte de Bloom).
- Trace attribuée à **l'instance** (`lesson_interactions.lesson_component_id`, `ON DELETE SET NULL` — l'historique d'apprentissage est préservé).
- Rendu de N composants (`LessonView`) et **édition créateur** complète (ajout / retrait / réordonnancement / configuration).
- Conformité : `R5.2` reformulée (« trace par composant », indicateur 19), `R7` (couverture Bloom des composants interactifs — rapport `donnees-a-completer`), `R8` (invariant catalogue : tout interactif déclare un niveau), `R9` (configuration valide).
- ⚠️ **À suivre (contenu)** : 28 écarts composant ↔ niveau `R7` (Jira 10, Git 18) à aligner.

## [0.1.0] — état initial

- Application Next.js 15 / React 19 / TypeScript, données Firestore
- Contenu : 6 formations, 26 chapitres, 26 quiz, 2 formules
- Déploiement : Firebase App Hosting (`europe-west1`)
