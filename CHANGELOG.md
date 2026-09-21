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

## [0.1.0] — état initial

- Application Next.js 15 / React 19 / TypeScript, données Firestore
- Contenu : 6 formations, 26 chapitres, 26 quiz, 2 formules
- Déploiement : Firebase App Hosting (`europe-west1`)
