# Steering — Standards de code Katalyst

## Principes directeurs

1. **KISS** — la solution la plus simple. Pas de pattern si une fonction suffit.
2. **YAGNI** — rien « au cas où ». Si ce n'est pas nécessaire maintenant, ne pas le coder.
3. **Open-source d'abord** — MIT/Apache-2.0/BSD. Éviter les dépendances payantes.
4. **Zero vendor lock-in** — toute dépendance externe derrière une interface.
5. **Sécurité par défaut** — jamais de secret dans le code ; jamais de clé côté client ; tous les endpoints authentifiés sauf exception explicite.

## TypeScript

- `strict: true`. Pas de `any` implicite.
- Types métier dans `src/types/`. Schémas **Zod** comme source de vérité des contrats (validation runtime + inférence de types).
- Les schémas partagés serveur/client vivent à un seul endroit (pas de duplication).
- **Aucun type de fournisseur** (`Firestore`, `pg.Pool`) ne doit apparaître dans la couche métier — uniquement dans `providers/<fournisseur>/`.

## Architecture

- **Server Components** pour la lecture ; **Server Actions** pour les mutations.
- Les composants ne parlent jamais directement à un fournisseur : ils passent par `useAuth()`, un hook, ou une server action.
- Un fichier qui grossit est un signal : il fait trop de choses.
- Toute lecture passe par un provider ; aucune requête SQL dans un composant.

## Nommage

- Fichiers : `kebab-case.ts` / composants `PascalCase.tsx`.
- Tables Postgres : `snake_case` pluriel (`users`, `user_step_progress`).
- Variables d'environnement : `SCREAMING_SNAKE_CASE`, préfixe `NEXT_PUBLIC_` uniquement si exposé au client.
- Clés i18n : l'app est française — pas de clés i18n tant que le multi-langue n'est pas requis (YAGNI).

## Tests

- Pyramide : **unitaires** (logique pure, hooks, utils) → **intégration** (providers + DB) → **e2e** (parcours critiques).
- Deux projets Jest : `jsdom` (UI) et `node` (DB/API).
- Tout bug corrigé reçoit un test de non-régression.
- Les mocks MSW sont régénérés depuis les schémas Zod quand les contrats changent.

## Base de données

- Toute migration est **rejouable** et **réversible**.
- **Dump avant migration** (voir `@.kiro/workflows/phase-completion.md`).
- Pas de `SELECT *` en production : requêtes ciblées.
- Filtrage côté SQL, pas côté JS.

## UI

- shadcn/ui + Tailwind, classes standardisées.
- Charte : **1 seul accent (navy)**, fond blanc, neutres. Pas d'explosion de couleurs.
- Chaque composant gère les états : chargement, vide, erreur, verrouillé.
- Accessibilité : `aria-label` sur les boutons sans texte, rôles ARIA sur les interactifs.
- Responsive testé à 320 / 768 / 1024+.

## Git

- Commits atomiques, message au format conventionnel (`feat:`, `fix:`, `chore:`, `docs:`).
- Ne jamais committer de secrets (`.env*` est gitignoré).
- Ne committer que sur demande explicite.
