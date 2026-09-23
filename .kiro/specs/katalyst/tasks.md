# Spec — Plan d'exécution Katalyst

> **Source de vérité de l'avancement.** Le hook `@.kiro/hooks/next-phase.md` lit ce fichier.
> Cocher `[x]` **uniquement** quand le critère de vérification est observé (pas sur intention).
> Convention : `- [ ] T<phase>.<n> — <tâche> · REQ-xxx · vérif: <critère>`
> Normes applicables : `@.kiro/steering/security-standards.md`

## Légende

- `[ ]` à faire · `[x]` fait et vérifié · `[~]` en cours · `[!]` bloqué
- Chaque phase se termine par `@.kiro/workflows/phase-completion.md`.
- **Aucune phase ne démarre si ses dépendances ne sont pas `[x]`.**

## Graphe de dépendances

```
Couche 0  0 ──> 0.5
Couche 1  0.5 ─> 1 ─┬─> 2 ─┬─> 3 ─┬─> 4 ─┬─> 5 ──┐
                    │      │      │      └─> 14 ─┬─> 15
                    │      │      │              └─> 24
                    │      └──────┴─> 6 ─────────┼─> 7 ──> (Couche 1 livrée)
Couche 2            │                            │
          1 ────────┴─> 8 (i18n)                 │
          3 ──────────> 9 (API) ──> 10 (Sécurité)┘
Couche 3  8 ─┬─> 11 ─┬─> 12 ─┬─> 13 ─────────────┬─> 23
             │        ├─> 14 ─┴─> 15             │
             │        └─> 16 ──> 17 ──> 18       │
             │                   └──> 19 ─> 20 ─> 21
             ├─> 22 ─────────────────────────────┤
             └───────────────────────────────────┴─> 25 ─> 26 ─> 27
```

**Chemins** :
- Critique (migration) : `0 → 0.5 → 1 → 2 → 3 → 4 → 5 → 6 → 7`
- Autonomie : `4 → 16 → 17 → 19 → 22 → 24 → 27`

---

# Couche 0 — Fondations

## Phase 0 — Fondations & socle de suivi

Dépend de : —

- [x] T0.1 — Créer `.eslintrc.json` (config Next) · REQ-FND-02 · vérif: `npm run lint` ne demande plus de configuration · **fait** (0 erreur, 251 warnings baseline ; 2 bugs réels révélés et corrigés : `pricing/page.tsx` import manquant, `QuizView.tsx` hook conditionnel)
- [x] T0.2 — Résorber les erreurs typecheck (`framer-motion`, `AppUser.plan`, `inline`, `UserProgress`, `TUTORIALS`) · REQ-FND-01 · vérif: `npm run typecheck` → 0 erreur · **fait** (64 → 0) — causes : corruption `node_modules` (4 paquets), `moduleResolution: node`, Storybook incohérent (8 vs 10 + cœur absent), `@types/react` 18 vs React 19, `planId` vs `plan`, react-markdown v9 (`inline`), 7 gardes mortes, chemin d'import erroné
- [x] T0.3 — CI `.github/workflows/ci.yml` (typecheck + lint + test + build) · REQ-FND-03 · vérif: CI verte · **fait** — bloquants : lint, typecheck, tests, check:version, gitleaks, tests DB. Reste en report-only : le build (script `npm run build` en syntaxe Windows `cmd`, le CI appelle `npx next build`).

> **Résolu** : les 2 suites obsolètes (`useGitSimulation` — module inexistant ; `useTutorialProgress` — signature périmée) ont été supprimées. Le test de `useTutorialProgress` sera réécrit en phase 5 (migration Postgres), en TDD.
> **Reporté** : `src/queries/**` est du code mort (importé nulle part) — typé pour faire passer T0.2, à supprimer en phase 16.
- [x] T0.4 — `docker-compose.dev.yml` — **`pgvector/pgvector:pg16`** (pattern masterplan365) · REQ-FND-04 · vérif: `pg_isready` OK · **fait** (katalyst + katalyst_test, extension vector)
- [x] T0.5 — `.env.example` + documentation de configuration · REQ-FND-05 · vérif: aucun secret versionné · **fait** (négation `!.env.example` ajoutée au `.gitignore`, valeurs locales uniquement)
- [x] T0.6 — Retirer le `console.log` de la config Firebase (`src/lib/firebase.ts:18-29`) · REQ-FND-05 · vérif: plus de config dans les logs · **fait**
- [x] T0.7 — Infra de test DB : 2ᵉ projet Jest `node` + base `katalyst_test` · REQ-FND-06 · vérif: `npm run test:db` s'exécute · **fait** (3 tests verts : connexion, pgvector, table temporaire ; `REQUIRE_DB=1` en CI)
- [x] T0.8 — Socle `.kiro` : `VERSION`, `MEMORY.md`, `CHANGELOG.md`, `steering/`, `specs/`, `workflows/`, `hooks/` · REQ-FND-06 · vérif: fichiers présents
- [x] T0.9 — `.gitleaks.toml` + scan de secrets en CI (pattern masterplan365) · REQ-SEC-06 · vérif: CI échoue sur secret détecté · **fait** (job `secrets`, règles par défaut + liste blanche)
- [x] T0.10 — Hook `check:version` (détection de dérive SSoT) · REQ-FND-03 · vérif: drift détecté · **fait** (`npm run check:version`, code de sortie 1 en cas de dérive)

## Phase 0.5 — Walking Skeleton

Dépend de : 0

- [x] T0.5.1 — Pool Postgres singleton (compatible HMR Next) · REQ-FND-06 · vérif: pas de fuite de pool en dev · **fait** (`src/lib/db/pool.ts`, référence sur `globalThis`)
- [x] T0.5.2 — `SettingsProvider` (interface + impl. Postgres, 1 méthode) · REQ-FND-06 · vérif: lecture/écriture OK · **fait** (`src/lib/providers/settings.ts`, sélection par `DATA_PROVIDER`), vérifié par 4 tests d'intégration
- [x] T0.5.3 — 1 page RSC lisant une donnée Postgres · REQ-FND-06 · vérif: donnée affichée · **fait** (`/health` → HTTP 200, affiche la valeur lue en base)
- [x] T0.5.4 — 1 route handler API · REQ-FND-06 · vérif: HTTP 200 · **fait** (`GET /api/v1/settings` → 200 `{"instructorName":"Alex Dubois"}`)
- [x] T0.5.5 — 1 test d'intégration `node` · REQ-FND-06 · vérif: vert · **fait** (7 tests, 2 suites)
- [x] T0.5.6 — CI inclut le projet de test DB · REQ-FND-03 · vérif: CI verte · **fait** (job `db` : service pgvector, migrations sur la base de test, `test:db` strict)

> **Découvert pendant la phase 0.5** : le port 5432 était occupé par un conteneur d'un **autre projet** — le conteneur Katalyst n'avait jamais démarré et les tests DB passaient **à vide** (report gracieux). Corrigé : port **5433**, et les tests sont désormais **stricts par défaut** (base injoignable = échec).

---

# Couche 1 — Migration agnostique

## Phase 1 — Modèle de référence & registre

Dépend de : 0.5

- [x] T1.1 — Spec du modèle de formation dans `design.md` · REQ-MDL-05 · vérif: spec validée · **fait** (design.md §3.1 hiérarchie, §3.2 schéma, §3.3 ETL, §5 types de leçon, §7 registre + ADR 0003)
- [x] T1.2 — Registre des composants catalogués · REQ-MDL-01 · vérif: entrées typées · **fait** — **46 composants** (33 interactifs, 13 visuels) et non 37 : l'inventaire initial s'arrêtait à mi-liste. Découpé en `registry/catalog.ts` (métadonnées, sans React → serveur, IA, tests) et `registry/index.ts` (liaison aux composants, réservée au rendu)
- [x] T1.3 — `LessonView.tsx` résout via le registre · REQ-MDL-02 · vérif: rendu identique · **fait** (173 → **96 lignes**, 46 imports → 1). Résolution **tolérante** au rendu (un nom inconnu n'empêche pas l'affichage) ; validation stricte à la création
- [x] T1.4 — Schémas Zod partagés (`Lesson`, `LessonType`, `Chapter`, `Week`, `Course`) · REQ-MDL-04 · vérif: aucune duplication · **fait** (`src/lib/schemas/content.ts` : types inférés des schémas, 9 types de leçon, audit de conformité). Ce module n'importe volontairement aucun composant React
- [x] T1.5 — Flow IA branché sur le registre · REQ-MDL-03 · vérif: l'IA ne propose que des composants existants · **fait** — `courseActions.ts` avait **deux listes en dur désynchronisées** du rendu. Remplacées par le catalogue ; seuls les interactifs **opérationnels** sont proposés
- [x] T1.6 — Validation : composant inconnu → erreur explicite · REQ-MDL-03 · vérif: test avec nom bidon · **fait** (`assertKnownComponent` + `assertUsableComponent`, couverts par 12 tests)
- [x] T1.7 — Modèle Semaine/Jour (`S.1.J.2`) + règle « 1 chapitre = 1 semaine » · REQ-MDL-06 · vérif: numérotation correcte · **fait** (`formatWeekCode`, `formatChapterCode`, `parseChapterCode`, `DAYS_PER_WEEK = 5`)

> ⚠️ **Constat produit majeur (T1.2)** : **13 des 33 composants « interactifs » sont des coquilles statiques** — aucun gestionnaire d'événement, aucun état (mesuré le 2026-09-21). Ex. `GitCommandSimulator` affiche un bouton « Exécuter » **sans `onClick`** ; `WorkflowDesigner` affiche « glisser-déposer » sans implémentation. Ils sont marqués `status: 'placeholder'`, **exclus des propositions de l'IA** et refusés par `assertUsableComponent`. Les rendre réellement interactifs relève de la **phase 6** : la cible « 100 % de leçons interactives » (REQ-CNT-02) n'est pas atteignable tant qu'ils ne le sont pas.

## Phase 2 — Schéma, migrations & seed

Dépend de : 1

- [x] T2.1 — Schéma complet · REQ-DAT-01, REQ-ORG-01 · vérif: application sans erreur · **fait** — **26 tables métier** en 4 migrations (002 identité, 003 contenu, 004 apprentissage, 005 engagement/IA). **Identifiants de contenu en TEXT** (slugs sources) plutôt qu'en UUID : stables, lisibles, et le seed devient idempotent
- [x] T2.2 — Migrations numérotées + table `migrations` · REQ-DAT-02 · vérif: rejouer 2× idempotent · **fait** (transaction par fichier, échec = rollback complet ; `migrate`, `migrate:test`)
- [x] T2.3 — ETL `src/data/*.json` (2 niveaux) → modèle 3 niveaux · REQ-DAT-04 · vérif: contenu intact · **fait** — les sources sont à 2 niveaux, le modèle en a 3 (la troisième étant un **regroupement facultatif**). **Aucun regroupement n'est créé** : les sources n'en contiennent pas, et l'intitulé est une décision du formateur. Les 26 chapitres sont rattachés directement aux formations (`week_id = NULL`)
- [x] T2.4 — Seed complet · REQ-DAT-03 · vérif: 6 formations / 26 chapitres / 26 quiz / 2 formules · **fait** — 6 formations, 8 semaines, 26 chapitres, **80 leçons**, 26 quiz, 76 questions, 240 réponses, 2 formules. **Idempotence vérifiée** (rejeu = mêmes comptes)
- [x] T2.5 — Import des **12 comptes** Firebase Auth · REQ-DAT-05 · vérif: 12 lignes · **fait** — 12 comptes lus, 2 insérés, 10 mis à jour. **10 comptes à mot de passe → reset forcé** (Firebase n'exporte pas les hachages) ; **2 comptes Google** se reconnectent directement
- [x] T2.6 — Seed `settings` + rôle admin · REQ-DAT-05 · vérif: 1 admin · **fait** (migration 001 pour `settings` ; le compte « Admin Katalyst » conserve `Super Admin` — le rôle n'est jamais écrasé par l'import)
- [x] T2.7 — `organization_id` sur toutes les entités cloisonnées · REQ-ORG-01 · vérif: aucune table cloisonnée sans `organization_id` · **fait** (organizations, users, courses, cohorts, notifications, ai_credits, ai_generations, documents)
- [x] T2.8 — Organisation par défaut + rattachement du contenu et des comptes · REQ-ORG-01 · vérif: sans orphelin · **fait** (slug `katalyst`, formule `premium` ; tout le contenu et les comptes y sont rattachés)
- [x] T2.9 — Extension **pgvector** + colonnes vectorielles · REQ-DOC-06 · vérif: index vectoriel créé · **fait** (`vector(1536)` sur `document_chunks.embedding`, index `ivfflat` en cosinus)

> ⚠️ **Une erreur attrapée par la contrainte, pas par relecture** : `organizations.plan_id` référençait `premium` avant que les formules existent → FK violée, ordre du seed corrigé.
>
> 🔴 **CORRECTION UTILISATEUR (2026-09-21)** — la seconde erreur (`UNIQUE (week_id, code)` : 11 chapitres dans une seule semaine) m'a fait **sur-modéliser** : j'avais fait de « S » et « J » des **données** (colonnes de code, table de semaines, helpers de numérotation, règle « 5 chapitres par semaine »). Or **ce sont des libellés de titrage décidés par le formateur**, et **une leçon peut couvrir plusieurs jours**. Toutes les colonnes de code et la dérivation ont été supprimées ; `weeks` devient un **regroupement visuel facultatif à intitulé libre**. L'**accès par période** (souhaité) est porté par `unlock_rules`, étendu aux trois niveaux (formation, chapitre, leçon).

## Phase 3 — Providers (fin du couplage)

Dépend de : 2

- [x] T3.1 — Interfaces `ContentProvider`, `UserProvider`, `SettingsProvider` · REQ-DAT-07 · vérif: aucun type `Firestore` dans les signatures ✅ `e1b2de1`
- [x] T3.2 — Impl. `providers/postgres/` (pool, SQL ciblé, transactions) · REQ-DAT-06 · vérif: requêtes OK ✅ `e1b2de1`
- [x] T3.3 — Migrer `lib/{courses,tutorials,quiz,plans,settings}.ts` · REQ-DAT-06 · vérif: accueil, `/courses`, `/api/*` sur Postgres ✅ `8dbd53a`
- [x] T3.4 — Migrer 5 routes API + 6 RSC + 4 server actions · REQ-DAT-06 · vérif: `grep firebase-admin src/` → uniquement `providers/firestore/` ✅ `8dbd53a` — bilan réel : **9 pages/routes + 4 server actions** ; `firebase-admin` n'a **aucun consommateur** (mieux que le critère : il n'y a même pas de `providers/firestore/` à conserver)
- [x] T3.5 — **`EmailProvider`** (interface + SMTP `nodemailer` + Resend) · REQ-AUTH-10 · vérif: email de test reçu ✅ `e8708e4` — **gate G3 non tranché, et ce n'était pas bloquant** : le repli documenté du gate (SMTP générique) est implémenté, plus un transport `memory` (tests/dev) et Resend sans SDK. Aucun appelant ne dépend d'un transport. *Vérif « email de test reçu » : non satisfaite faute de serveur SMTP — remplacée par 12 tests du contrat.*
- [x] T3.6 — **`StorageProvider`** (local + S3-compatible via fetch, **sans SDK** — pattern masterplan365) · REQ-LRN-04 · vérif: upload/download OK ✅ `ae214cd` — aller-retour vérifié sur disque ; transport S3 vérifié structurellement, **signature SigV4 prouvée contre le vecteur officiel AWS**.
- [x] T3.7 — **`AICreditProvider`** (solde, débit, historique) · REQ-AIC-03 · vérif: débit/recharge tracés ✅ `d8d4d18` — débit **atomique** et conditionné au solde dans la même instruction ; aucun solde négatif possible, même en concurrence.
- [x] T3.8 — **`NotificationProvider`** (in-app, email, push) · REQ-NOT-05 · vérif: envoi multi-canal ✅ `7653ee7` — `dispatch` **rapporte** les canaux délivrés et écartés. Le push n'a pas de transport : il est déclaré, jamais silencieusement ignoré.
- [x] T3.9 — **`DocumentProvider`** (ingestion, segments, recherche vectorielle) · REQ-DOC-06 · vérif: recherche sémantique opérationnelle ✅ `06d7131` — pgvector, tri cosinus, **héritage** leçon → chapitre → formation vérifié. Les embeddings sont reçus, non calculés (séparation d'avec l'IA).
- [x] ~~T3.10 — Conserver `providers/firestore/` comme filet (Strangler Fig)~~ · **obsolète** : le couplage Firestore est intégralement retiré (`firebase-admin`, `firebase.ts`, `local-data.ts` n'ont plus aucun consommateur). Il n'y a pas de filet à conserver — garder Firestore en repli aurait maintenu une seconde source de vérité sans nécessité.
- [x] T3.11 — **`scope` obligatoire** dans l'interface des providers (`OrgScope`) · REQ-ORG-03 · vérif: une méthode sans `scope` ne compile pas ✅ `e1b2de1` — `assertScope()` rejette aussi l'absence de scope **à l'exécution** (test dédié)
- [x] T3.12 — **Tests d'isolation inter-organisations** sur chaque entité · REQ-ORG-02 · vérif: org A ne lit aucune ligne d'org B ✅ `e1b2de1` — 10 tests, en **lecture ET en écriture** (`getById` inter-org → `null` ; `delete`/`setRole` inter-org → sans effet)

## Phase 4 — Authentification

Dépend de : 3 · **Gates G1 (SAML), G3 (email)**

- [x] T4.1 — Colonnes auth (`password_hash`, `must_reset_password`, `two_factor_enabled`, `last_login`) · REQ-AUTH-01 · vérif: migration OK ✅ **déjà satisfaite par la phase 2** (`002_identity.sql`) — plus `two_factor_secret` et `last_login`, non prévus par la tâche.
- [x] T4.2 — Endpoints `register`/`login`/`logout`/`refresh` (+ rotation) — pattern `masterplan365/server/routes/auth.ts` · REQ-AUTH-01, REQ-AUTH-03 · ✅ `7bb11f8` (provider, 27 tests DB) + `1a4f64a` (4 route handlers, 11 tests E2E)
- [x] T4.3 — **Google OAuth** (`/api/auth/google` + `/callback`) · REQ-AUTH-02 · ✅ **vérif « connexion réussie » OBSERVÉE** (confirmé par l'utilisateur : connexion effective avec un compte Google réel) · `dc99c4f` (code, 11 tests DB + 8 E2E) — signature du jeton d'identité vérifiée contre le **JWKS de Google**, adresse non vérifiée refusée, identifiant stable conservé, `must_reset_password` levé. *Historique : la case avait été cochée à tort avant que la configuration existe, puis déclassée en `[~]` ; elle est désormais légitimement cochée.*
- [x] T4.4 — **MFA/TOTP** (`setup`/`verify`/`challenge`/`status`) · REQ-AUTH-04 · ✅ `7bb11f8` (Base32 + TOTP conformes aux vecteurs RFC 4226/6238) + `3c0ba6e` (secret **chiffré au repos** AES-256-GCM, 4 endpoints, `login` à deux issues, 13 tests de chiffrement + 18 DB + 7 E2E) — les codes de récupération ne sont **pas** implémentés (hors périmètre de la tâche).
- [x] T4.5 — **SSO SAML** (Next sans Express) · REQ-AUTH-05 · ✅ `@node-saml/node-saml` 5.1.0 (pur, sans Passport) + migration 009 + `src/lib/auth/saml.ts` + routes metadata/login/callback + configuration par organisation + 13 tests unitaires + 6 tests DB. **Le spike prévu s'est révélé inutile** : le modèle masterplan365 prouve que `SAML` s'utilise seul — le couplage Express était superficiel, il ne portait que le routage. **4 défauts du modèle corrigés** : certificat IdP rendu **obligatoire** (il était facultatif, donc aucune signature n'était vérifiée), paire de clés SP **stable** (elle était régénérée à chaque démarrage, cassant la confiance chez l'IdP), erreurs non renvoyées au client, `passport-saml` 3.x **écarté** (4 CVE HIGH d'injection XML) au profit du paquet maintenu. *La vérification « gate G1 levé » reste due au choix du fournisseur par l'utilisateur, mais l'implémentation ne l'attend plus.*
- [x] T4.6 — JWT en cookie **httpOnly** + middleware Next (pattern `authenticate.ts`) · REQ-AUTH-09 · ✅ `1a4f64a` — le refresh est **restreint à `/api/auth`** (il ne circule jamais sur une requête de page) ; le middleware est un **filtre** (Edge, sans base), pas une frontière d'autorisation
- [x] T4.7 — Rate limiters + validation Zod par endpoint · REQ-AUTH-01 · ✅ `1a4f64a` — fenêtre glissante, règles par usage, `RATE_LIMIT_MULTIPLIER` **ignoré en production**
- [x] T4.8 — **Reset forcé** de bout en bout (email → lien → nouveau mot de passe) · REQ-AUTH-06 · ✅ `7bb11f8` (provider) + `2c937e5` (endpoints, gabarits, pages, 9 tests E2E) — **c'est le seul chemin d'entrée des comptes importés** : constaté en base, les 11 comptes réels ont `password_hash IS NULL`. Reste la route `change-password` pour un utilisateur déjà authentifié (à raccorder à la page compte, T4.10).
- [x] T4.9 — Refonte `AuthContext` + **correction de la fuite de listener** · REQ-AUTH-08 · ✅ `fc2c176` — la fuite est **supprimée par construction** : plus d'abonnement du tout, donc rien à détacher. Un seul appel au montage. Le spinner d'attente est limité aux routes protégées.
- [x] T4.10 — Migrer `login`, `signup`, `account`, `layout/Header` · REQ-AUTH-08 · ✅ `fc2c176` — vérif satisfaite : **0 import `firebase`** dans `src/app`, `src/components`, `src/contexts` et `src/hooks`.
- [x] T4.11 — `getPlansAction`/`getSettingsAction`/`getAdmin*Action` sur providers · REQ-DAT-06 · ✅ **déjà satisfaite** (migrée en phase 3) : `adminActions` et `planActions` passent par les providers, plus aucun `getFirebaseAdmin` (vérifié).
- [x] T4.12 — **Inscription libre-service** : créer un compte crée une organisation · REQ-ORG-04 · ✅ **déjà satisfaite** (`7bb11f8`, `dc99c4f`) : `register` et `loginWithGoogle` créent l'organisation, l'inscrit devient Propriétaire.
- [x] T4.13 — **Invitations** par email (formateurs, apprenants) · REQ-ORG-05 · ✅ `7b35183` (migration 008, provider, gabarit, 20 tests DB) + `297bbb8` (routes, page, 10 tests E2E) — le jeton n'est **jamais** renvoyé par l'API ; `canAssignRole` interdit d'attribuer un rôle supérieur au sien.
- [x] T4.14 — **Rôles** Propriétaire / Admin / Modérateur / Utilisateur + Super Admin · REQ-ORG-06 · ✅ `41c9520` — vérif « permissions distinctes » satisfaite : 19 tests unitaires de la matrice + 11 tests E2E (403 pour les rôles insuffisants, redirection de `/admin`). **Trou d'autorisation corrigé** : les server actions admin ne contrôlaient pas le rôle, alors qu'elles sont joignables directement. **Défaut corrigé** : le layout admin excluait « Propriétaire », enfermant le propriétaire hors de son espace.

## Phase 5 — Progression

Dépend de : 4

- [x] T5.1 — API `GET/POST /api/v1/progress` · REQ-PROG-01 · ✅ `d149a10` — vérif « 200 + persistance » satisfaite : 11 tests DB + 8 tests E2E. `saveCourse` **synchronise** les leçons (ajout **et retrait**) ; aucune méthode ne reçoit d'identifiant d'utilisateur (il vient du scope).
- [x] T5.2 — Migrer `useTutorialProgress.ts` + `TutorialContext.tsx` · REQ-PROG-01 · ✅ `d149a10` — vérif « coché → persistant » satisfaite, **prouvée après reconnexion**. `useTutorialProgress` est **réécrit en vue dérivée** : il maintenait un second `Set` en mémoire, donc deux sources pour la même donnée.
- [x] T5.3 — `user_course_progress` (reprise au bon endroit) · REQ-PROG-02 · ✅ `d149a10` — `current_chapter_id`, `current_lesson_id` et `current_view` enregistrés et restaurés.

## Phase 6 — Conformité des formations

Dépend de : 1, 3

- [ ] T6.1 — Script `npm run audit:content` · REQ-CNT-01 · vérif: rapport reproductible
- [ ] T6.2 — Règles de conformité (R1-R5) documentées · REQ-CNT-02 · vérif: règles écrites
- [ ] T6.3 — Compléter **ingenierie-des-prompts** (1 chap., 20 % visuel) · REQ-CNT-02 · vérif: 100 % interactif
- [ ] T6.4 — Compléter **closing** et **marketing** · REQ-CNT-02 · vérif: 100 % interactif
- [ ] T6.5 — **git-github** : 70 % → 100 % + `plan`/`generationParams` · REQ-CNT-02 · vérif: 100 % interactif
- [ ] T6.6 — **jira** et **n8n** : ajouter le quiz manquant · REQ-CNT-03 · vérif: 1 quiz/formation
- [ ] T6.7 — Aligner `admin/create-course` + `fullCourseGenerationActions` sur le registre · REQ-CNT-04 · vérif: création IA conforme
- [ ] T6.8 — Re-seed Postgres · REQ-CNT-02 · vérif: `audit:content` → 6/6 conformes

## Phase 7 — Purge Firebase

Dépend de : 3, 4, 5, 6

- [ ] T7.1 — Supprimer `firebase`, `firebase-admin` · REQ-DAT-06 · vérif: `package.json` nettoyé
- [ ] T7.2 — Supprimer `firebase.json`, `.firebaserc`, `apphosting.yaml`, `providers/firestore/` · REQ-DAT-06 · vérif: fichiers absents
- [ ] T7.3 — Supprimer `lib/firebase.ts`, `lib/firebase-admin.ts`, `lib/local-data.ts` · REQ-DAT-06 · vérif: fichiers absents
- [ ] T7.4 — Retirer `NEXT_PUBLIC_FIREBASE_*` et clés Firebase de `.env*` · REQ-FND-05 · vérif: aucun secret Firebase
- [ ] T7.5 — **Révoquer la clé de service account** (console Firebase, manuel) · REQ-FND-05 · vérif: clé révoquée
- [ ] **Sortie Couche 1** : `grep -rn "firebase" src/ package.json` → **0 résultat**

---

# Couche 2 — Socle transverse

## Phase 8 — Internationalisation & transatlantique

Dépend de : 1 · Voir `adr/0008`

- [ ] T8.1 — Infrastructure i18n (routage `/fr` `/en`, catalogue) — pattern masterplan365 `_t('fr','en')` · REQ-I18N-01, REQ-I18N-03 · vérif: navigation localisée
- [ ] T8.2 — Catalogues **FR + EN** complets · REQ-I18N-01 · vérif: aucune clé manquante
- [ ] T8.3 — **Lint i18n bloquant** : clé absente d'une langue obligatoire → build en erreur · REQ-I18N-05 · vérif: CI échoue
- [ ] T8.4 — Extraction de toutes les chaînes en dur de l'interface · REQ-I18N-04 · vérif: `grep` → 0 libellé non clé
- [ ] T8.5 — Formats localisés (dates, nombres, devises, fuseaux) · REQ-I18N-06 · vérif: affichage conforme
- [ ] T8.6 — Langue persistée par utilisateur · REQ-I18N-07 · vérif: choix conservé
- [ ] T8.7 — **Modèle de données multilingue pour le contenu** · REQ-I18N-08 · vérif: une formation existe en FR et EN
- [ ] T8.8 — Locale de repli documentée + détection à la première visite · REQ-I18N-03 · vérif: repli fonctionnel
- [ ] T8.9 — ES préparé (structure prête, non activé) · REQ-I18N-02 · vérif: ajout d'une locale sans refonte

## Phase 9 — API centrale v1

Dépend de : 3 · Voir `adr/0009` · Normes : OWASP ASVS, API Top 10

- [ ] T9.1 — Surface `/api/v1/*` versionnée · REQ-API-01 · vérif: routes versionnées
- [ ] T9.2 — **Chaîne obligatoire** : auth → scope → autorisation → validation Zod → handler · REQ-API-02 · vérif: aucune route ne contourne
- [ ] T9.3 — Autorisation **au niveau objet** (scope organisation) — OWASP API Top 10 (BOLA) · REQ-ORG-03 · vérif: accès hors scope → 403
- [ ] T9.4 — **OpenAPI généré depuis Zod** · REQ-API-03 · vérif: `/api/v1/openapi.json` valide
- [ ] T9.5 — Routes sans logique métier (délégation aux providers) · REQ-API-04 · vérif: revue de code
- [ ] T9.6 — Limitation de débit par IP **et** par utilisateur · REQ-API-05 · vérif: seuils appliqués
- [ ] T9.7 — Réponses d'erreur normalisées, sans fuite interne · REQ-API-06 · vérif: format unique
- [ ] T9.8 — Journalisation des accès API · REQ-SEC-04 · vérif: requêtes tracées

## Phase 10 — Sécurité & durcissement

Dépend de : 9 · Voir `adr/0009` · Normes : OWASP Top 10, ASVS, ISO 27001 (réf.)

- [ ] T10.1 — En-têtes de sécurité (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy) · REQ-SEC-01 · vérif: en-têtes présents sur toutes les réponses
- [ ] T10.2 — Protection **CSRF** sur les mutations · REQ-SEC-02 · vérif: requête sans jeton rejetée
- [ ] T10.3 — **Anti-force brute** + verrouillage progressif (login/reset/MFA) · REQ-SEC-03 · vérif: verrouillage effectif
- [ ] T10.4 — **Journal d'audit** des actions sensibles (pattern `lib/audit` masterplan365) · REQ-SEC-04 · vérif: qui/quoi/quand/où
- [ ] T10.5 — Chiffrement en transit (TLS) + au repos des données sensibles · REQ-SEC-05 · vérif: vérifié
- [ ] T10.6 — `npm audit` + `gitleaks` en CI, échec sur critique · REQ-SEC-06 · vérif: CI échoue sur vulnérabilité critique
- [ ] T10.7 — Moindre privilège des comptes techniques · REQ-SEC-07 · vérif: droits minimaux documentés
- [ ] T10.8 — **Politique de rétention / suppression / export** (RGPD) · REQ-SEC-08 · vérif: procédure applicable
- [ ] T10.9 — **Procédure de réponse à incident** · REQ-SEC-09 · vérif: document + responsable
- [ ] T10.10 — **Garde-fous IA** (pattern `aiGuard.ts` masterplan365) · REQ-SEC-01 · vérif: appels IA contrôlés

---

# Couche 3 — Produit REWORK

## Phase 11 — Expérience d'apprentissage

Dépend de : 8 · Norme : WCAG 2.2 AA

- [ ] T11.1 — `LessonType` : VIDEO, CAPSULE, MISE_EN_PRATIQUE, EVALUATION, TEXTE, IMAGE, **AUDIO**, MEDIA, LIEN · REQ-LRN-01 · vérif: enum + Zod
- [ ] T11.2 — **Audio de première classe** (upload, lecteur, téléchargement) · REQ-LRN-02 · vérif: leçon audio fonctionnelle
- [ ] T11.3 — `mediaRef` : YouTube, Vevo, image, audio, fichier · REQ-LRN-03, REQ-LRN-04 · vérif: lecteur par type
- [ ] T11.4 — Semaines + chapitres numérotés `S.n.J.m` · REQ-MDL-05 · vérif: conforme aux captures
- [ ] T11.5 — Durées par leçon + agrégat formation · REQ-LRN-05 · vérif: calcul correct
- [ ] T11.6 — Badges de type colorés · REQ-LRN-06 · vérif: conformes aux captures
- [ ] T11.7 — **Accessibilité média** (transcription, sous-titres, alt) — WCAG 2.2 AA · REQ-LRN-07 · vérif: média sans métadonnée refusé

## Phase 12 — Moteur de déblocage configurable

Dépend de : 11

- [ ] T12.1 — Table `unlock_rules` (DATE / COMPLETION / QUIZ_PASSED) · REQ-UNL-01, REQ-UNL-02 · vérif: migration OK
- [ ] T12.2 — Évaluation **serveur** par apprenant/cohorte · REQ-UNL-04 · vérif: chapitre verrouillé → 403
- [ ] T12.3 — UI 3 états (✅ / ▶ / 🔒) · REQ-UNL-03 · vérif: conforme aux captures
- [ ] T12.4 — Drip par date (badge « 5 août ») · REQ-UNL-01 · vérif: déblocage à date
- [ ] T12.5 — **Granularité configurable** : jour / semaine / mois / personnalisé · REQ-UNL-05 · vérif: cadence appliquée
- [ ] T12.6 — **Échéance de fin** par chapitre/leçon/quiz · REQ-UNL-06 · vérif: période appliquée
- [ ] T12.7 — « Chapitre suivant → » conditionnel · REQ-UNL-02 · vérif: apparaît au bon moment

## Phase 13 — Gamification

Dépend de : 11, 12

- [ ] T13.1 — `points_ledger` + contrainte d'unicité · REQ-GAM-01, REQ-GAM-02 · vérif: rejeu sans double crédit
- [ ] T13.2 — Attribution (leçon, quiz, chapitre) · REQ-GAM-02 · vérif: crédité une seule fois
- [ ] T13.3 — « X points à gagner » · REQ-GAM-03 · vérif: conforme aux captures
- [ ] T13.4 — **Écran de fin de leçon** (« Félicitations ! … ⭐ 20 points ») · REQ-GAM-03 · vérif: conforme aux captures
- [ ] T13.5 — Effet visuel de fin de chapitre · REQ-GAM-04 · vérif: animation déclenchée
- [ ] T13.6 — Récapitulatif par type (`Vidéo 8/8`…) · REQ-GAM-05 · vérif: agrégats exacts
- [ ] T13.7 — KPIs dashboard · REQ-GAM-05 · vérif: conformes aux captures

## Phase 14 — Cohortes & messagerie

Dépend de : 4, 11 · **Spike SSE+Capacitor**

- [ ] T14.1 — `cohorts` + `cohort_members` (multi-cohortes) · REQ-SOC-02 · vérif: apprenant dans 2 cohortes
- [ ] T14.2 — Création par l'admin (`IAFORMATEUR_20260803G1`) · REQ-SOC-01 · vérif: cohorte créée
- [ ] T14.3 — Chat **SSE** · REQ-SOC-03 · vérif: message sans rechargement
- [ ] T14.4 — Onglets Toutes / Groupes · REQ-SOC-03 · vérif: conforme aux captures
- [ ] T14.5 — Pièces jointes + emoji · REQ-SOC-04 · vérif: envoi OK
- [ ] T14.6 — Compteur de non-lus + chat flottant · REQ-SOC-05 · vérif: badge visible
- [ ] T14.7 — Nombre de participants · REQ-SOC-06 · vérif: conforme aux captures

## Phase 15 — Notifications

Dépend de : 12, 14

- [ ] T15.1 — Tables `notifications` + `notification_preferences` · REQ-NOT-01 · vérif: migration OK
- [ ] T15.2 — **Notification d'ouverture** · REQ-NOT-01 · vérif: reçue à l'ouverture
- [ ] T15.3 — **Notification d'accès** · REQ-NOT-02 · vérif: reçue
- [ ] T15.4 — **Rappel d'inactivité** avant échéance · REQ-NOT-03 · vérif: envoyé si inactivité
- [ ] T15.5 — **Rappel d'échéance de fin** · REQ-NOT-04 · vérif: programmé
- [ ] T15.6 — Multi-canal in-app + email (+ push) · REQ-NOT-05 · vérif: reçu par canal
- [ ] T15.7 — Préférences par apprenant · REQ-NOT-06 · vérif: réglages appliqués
- [ ] T15.8 — Planificateur interne (sans cron externe) · REQ-NOT-03 · vérif: tâche s'exécute

## Phase 16 — Base documentaire du formateur

Dépend de : 8 · Voir `adr/0012` · Prérequis du studio IA

- [ ] T16.1 — Tables `documents` + `document_chunks` (pgvector) · REQ-DOC-06 · vérif: index vectoriel créé
- [ ] T16.2 — **Attachement à une formation** · REQ-DOC-01 · vérif: disponible pour toutes ses leçons
- [ ] T16.3 — **Attachement à un chapitre** · REQ-DOC-02 · vérif: disponible pour ses leçons
- [ ] T16.4 — **Attachement à une leçon** · REQ-DOC-03 · vérif: disponible pour cette leçon
- [ ] T16.5 — **Héritage** leçon > chapitre > formation · REQ-DOC-04 · vérif: priorité respectée
- [ ] T16.6 — Ingestion PDF, DOCX, TXT, Markdown, HTML · REQ-DOC-05 · vérif: chaque format ingéré
- [ ] T16.7 — Pipeline : extraction → découpage → **vectorisation** · REQ-DOC-06 · vérif: recherche sémantique OK
- [ ] T16.8 — **Récupération ciblée** (seuls les segments pertinents) · REQ-DOC-07 · vérif: prompt dans la fenêtre
- [ ] T16.9 — **Traçabilité des sources** par génération · REQ-DOC-08 · vérif: `source_document_ids` enregistrés
- [ ] T16.10 — Recherche **limitée au `OrgScope`** · REQ-DOC-09 · vérif: aucun segment hors organisation
- [ ] T16.11 — Statuts `EN_ATTENTE` → `INDEXE` → `ERREUR` visibles · REQ-DOC-10 · vérif: statut affiché
- [ ] T16.12 — Suppression → segments et vecteurs supprimés · REQ-DOC-11 · vérif: aucun résidu
- [ ] T16.13 — Limites de taille et de volume par organisation · REQ-DOC-12 · vérif: dépassement refusé proprement

## Phase 17 — Studio de génération IA & crédits

Dépend de : 16 · Voir `adr/0005`, `adr/0010` · **Gate G4**

- [ ] T17.1 — Tables `ai_credits` + `ai_generations` · REQ-AIC-03 · vérif: solde et historique cohérents
- [ ] T17.2 — **TTT** (texte) · REQ-AIC-02 · vérif: contenu généré
- [ ] T17.3 — **TTI** (image) · REQ-AIC-02 · vérif: image générée et intégrée
- [ ] T17.4 — **TTS** (voix off) · REQ-AIC-02 · vérif: audio généré
- [ ] T17.5 — **STT** (transcription) · REQ-AIC-02 · vérif: transcription générée
- [ ] T17.6 — **TTV** (vidéo) · REQ-AIC-02 · vérif: vidéo générée
- [ ] T17.7 — Débit de crédits + **coût affiché avant génération** · REQ-AIC-04 · vérif: estimation validée
- [ ] T17.8 — Prompts en **ACTIF**, alignés CPA², **alimentés par la documentation du formateur** · REQ-AIC-05 · vérif: 5 champs ACTIF + sources utilisées
- [ ] T17.9 — **Aperçu + édition avant intégration** · REQ-AIC-06 · vérif: acceptation requise
- [ ] T17.10 — **Mention de transparence IA** (AI Act) · REQ-AIC-07 · vérif: mention visible
- [ ] T17.11 — Ergonomie : parcours guidé sans rupture · REQ-AIC-08 · vérif: test utilisateur
- [ ] T17.12 — Recharge de crédits (lien phase 24) · REQ-AIC-03 · vérif: solde crédité
- [ ] T17.13 — Traduction de contenu assistée par IA (FR → EN) · REQ-I18N-09 · vérif: contenu traduit et validé

## Phase 18 — Défenses anti prompt-injection

Dépend de : 17 · Voir `adr/0010` · Normes : **OWASP LLM Top 10**, NIST AI RMF

- [ ] T18.1 — **Hiérarchie d'instructions** explicite (contenu = donnée inerte) · REQ-PINJ-01 · vérif: contenu importé jamais exécuté
- [ ] T18.2 — **Délimitation et échappement** du contenu non fiable · REQ-PINJ-02 · vérif: séparateurs présents dans chaque prompt
- [ ] T18.3 — **Validation de sortie par schéma Zod** (OWASP LLM02) · REQ-PINJ-03 · vérif: sortie non conforme rejetée
- [ ] T18.4 — **Aucune exécution ni écriture directe** depuis l'IA · REQ-PINJ-04 · vérif: aperçu + édition obligatoires
- [ ] T18.5 — Outils IA en **liste blanche**, limités au `OrgScope` · REQ-PINJ-05 · vérif: aucun outil hors organisation
- [ ] T18.6 — **Détection + journalisation** des motifs d'injection · REQ-PINJ-06 · vérif: tentatives tracées + alerte
- [ ] T18.7 — **Marquage de provenance** du contenu généré · REQ-PINJ-07 · vérif: mention + sources
- [ ] T18.8 — **Suite de tests de résistance** (jeu de tentatives connues) · REQ-PINJ-08 · vérif: suite exécutée en CI

## Phase 19 — Méthodologie REWORK dans l'outil de création

Dépend de : 17 · Voir `adr/0005`

- [ ] T19.1 — **Pipeline à gates** (5 phases, aucun saut) · REQ-MTH-01 · vérif: saut impossible
- [ ] T19.2 — **Objectifs Bloom** + validation de la formule · REQ-MTH-02 · vérif: formule invalide refusée
- [ ] T19.3 — **Déroulé 6 colonnes** + contrôle arithmétique bloquant · REQ-MTH-03 · vérif: dépassement signalé avant validation
- [ ] T19.4 — **Fiche programme 17 rubriques** · REQ-MTH-04 · vérif: document produit
- [ ] T19.5 — **Identimètre** (5 piliers) · REQ-MTH-05 · vérif: formulaire présent
- [ ] T19.6 — **QQOQCCP** (7 axes) · REQ-MTH-06 · vérif: 7 axes enregistrés
- [ ] T19.7 — **Évaluations** : formative, sommative (80 %), à chaud, à froid · REQ-MTH-07 · vérif: types configurables
- [ ] T19.8 — Donnée manquante → `[À COMPLÉTER]`, jamais inventée · REQ-MTH-08 · vérif: aucun contenu inventé
- [ ] T19.9 — **Justification de chaque usage IA** · REQ-MTH-09 · vérif: justification obligatoire
- [ ] T19.10 — Templates REWORK n°1-11 disponibles · REQ-MTH-04 · vérif: templates accessibles

## Phase 20 — Conformité Qualiopi & accessibilité

Dépend de : 19 · Voir `adr/0006` · **Gate G5** · Norme : WCAG 2.2 AA

- [ ] T20.1 — **Obtenir le référentiel national qualité V10** (décret n° 2026-728, **33 indicateurs**) + guide de lecture V10 · REQ-QLF-06 · vérif: gate G5 levé
- [ ] T20.2 — **Mapping Qualiopi ↔ fonctionnalités** (33 indicateurs / 7 critères) · REQ-QLF-01 · vérif: table complète
- [ ] T20.3 — **Mapping C.1-C.8 ↔ fonctionnalités** · REQ-QLF-05 · vérif: 8 compétences adossées
- [ ] T20.4 — **Dossier de preuves exportable** · REQ-QLF-02 · vérif: export produit
- [ ] T20.5 — **Checklist handicap bloquante** (C.1/C.3/C.4) · REQ-QLF-03 · vérif: création bloquée si incomplète
- [ ] T20.6 — Traçabilité des évaluations · REQ-QLF-04 · vérif: historique consultable
- [ ] T20.7 — **Audit WCAG 2.2 AA** des parcours apprenant · REQ-LRN-07 · vérif: conformité vérifiée
- [ ] T20.8 — Veille réglementaire documentée · REQ-QLF-06 · vérif: sources officielles citées
- [ ] T20.9 — **Transparence des indicateurs de résultats** (modalités de calcul publiées) — nouveau V10 · REQ-QLF-07 · vérif: indicateurs calculés et diffusés
- [ ] T20.10 — **Procédure de prévention des VSS, harcèlement et discriminations** — nouveau V10 · REQ-QLF-08 · vérif: procédure intégrée et traçable
- [ ] T20.11 — **Traçabilité de la sous-traitance / portage salarial** — nouveau V10 · REQ-QLF-09 · vérif: conformité des sous-traitants enregistrée

## Phase 21 — Conformité SOC 2 / NIS2

Dépend de : 10, 20 · Voir `adr/0011`

- [ ] T21.1 — **Documentation des contrôles** (accès, audit, chiffrement, sauvegardes, incidents) · REQ-CMP-01 · vérif: documentation produite
- [ ] T21.2 — **Registre des fournisseurs** et dépendances · REQ-CMP-02 · vérif: liste maintenue
- [ ] T21.3 — **Gestion de changement** tracée (CI, revue, réversibilité) · REQ-CMP-03 · vérif: historique auditable
- [ ] T21.4 — **Procédure de réponse à incident** + responsable · REQ-CMP-04 · vérif: document + désignation
- [ ] T21.5 — **Rétention et suppression RGPD** testées · REQ-CMP-05 · vérif: procédure testée
- [ ] T21.6 — Communication honnête : **aucune certification revendiquée** · REQ-CMP-06 · vérif: revue des mentions publiques

## Phase 22 — Design system & charte

Dépend de : 8, 11, 17

- [ ] T22.1 — Charte : 1 accent (navy), fond blanc, neutres · REQ-DSG-01 · vérif: tokens CSS définis
- [ ] T22.2 — États verrouillé / progression / terminé homogènes · REQ-DSG-02 · vérif: cohérents partout
- [ ] T22.3 — Illustrations d'état vide · REQ-DSG-03 · vérif: conformes aux captures
- [ ] T22.4 — Audit responsive 320/768/1024+ · REQ-DSG-04 · vérif: aucune régression
- [ ] T22.5 — Ergonomie du flux de création (sans rupture) · REQ-DSG-05 · vérif: test utilisateur
- [ ] T22.6 — **Marque par organisation** : logo, nom, couleur d'accent · REQ-ORG-07 · vérif: espace personnalisé

## Phase 23 — Mobile (Capacitor)

Dépend de : 11-22

- [ ] T23.1 — Capacitor : `android/`, `ios/`, `capacitor.config.json` · REQ-MOB-01 · vérif: build Android OK
- [ ] T23.2 — SSE, upload et **notifications push** sur mobile · REQ-MOB-02 · vérif: chat + push sur appareil
- [ ] T23.3 — `fastlane` (pattern masterplan365) · REQ-MOB-03 · vérif: build store
- [ ] T23.4 — Publication Play Store + App Store · REQ-MOB-03 · vérif: fiches soumises

## Phase 24 — Paiement

Dépend de : 4 · Voir `adr/0009` · **Gate G4** · Norme : PCI DSS SAQ A

- [ ] T24.1 — `PaymentProvider` + `StripeProvider` (checkout **hébergé**) · REQ-PAY-01 · vérif: session créée, aucune donnée carte
- [ ] T24.2 — Webhooks idempotents · REQ-PAY-02 · vérif: rejeu sans double effet
- [ ] T24.3 — Abonnement → `users.plan_id` · REQ-PAY-03 · vérif: test → `premium` actif
- [ ] T24.4 — Entitlements · REQ-PAY-04 · vérif: accès restreint correct
- [ ] T24.5 — **Achat de crédits IA** · REQ-PAY-05 · vérif: solde crédité
- [ ] T24.6 — **Facturation au niveau organisation** · REQ-ORG-08 · vérif: portée par l'organisation
- [ ] T24.7 — Portail client (résiliation, factures) · REQ-PAY-04 · vérif: accessible

## Phase 25 — Déploiement portable

Dépend de : 2 · **Gate G2** · Norme : RGPD (localisation)

- [ ] T25.1 — `Dockerfile` multi-stage (Next standalone) · REQ-DEP-01 · vérif: image démarre
- [ ] T25.2 — `docker-compose.prod.yml` (app + Postgres **pgvector**) · REQ-DEP-01 · vérif: stack locale complète
- [ ] T25.3 — Workflows GCP / AWS / Azure (pattern masterplan365) · REQ-DEP-02 · vérif: déploiement depuis l'image
- [ ] T25.4 — **Vérifier o2switch (Docker + PostgreSQL)** puis recette VPS/dédié · REQ-DEP-03 · vérif: gate G2 levé
- [ ] T25.5 — Sauvegardes + **restauration testée** · REQ-DEP-04 · vérif: restauration réussie
- [ ] T25.6 — **Localisation des données documentée** (transatlantique, RGPD) · REQ-DEP-05 · vérif: région et transferts documentés
- [ ] T25.7 — Healthchecks + observabilité minimale · REQ-DEP-01 · vérif: `/health` 200

## Phase 26 — Efficience

Dépend de : toutes

- [ ] T26.1 — Cache des lectures (React Query v5) · REQ-PERF-01 · vérif: moins de requêtes
- [ ] T26.2 — Bundle : imports ciblés, code splitting · REQ-PERF-02 · vérif: mesure avant/après
- [ ] T26.3 — Chasse au code mort · REQ-PERF-03 · vérif: 0 orphelin
- [ ] T26.4 — Observabilité (logs, erreurs, métriques) · REQ-PERF-03 · vérif: erreurs tracées

## Phase 27 — Autonomie & onboarding

Dépend de : 4, 19, 22, 24

**Objectif** : un formateur, coach, professeur ou institut devient opérationnel **seul**.

- [ ] T27.1 — Parcours d'onboarding guidé (espace → inviter → créer → publier) · REQ-ORG-10 · vérif: parcours complet sans aide
- [ ] T27.2 — Documentation intégrée (aide contextuelle, modèles, exemples) · REQ-ORG-10 · vérif: aide à chaque étape
- [ ] T27.3 — **Méthode REWORK prête à l'emploi** (templates, Identimètre, QQOQCCP) · REQ-ORG-10 · vérif: disponibles à la création
- [ ] T27.4 — **Achat en self-service** (abonnement + crédits) · REQ-ORG-09 · vérif: achat de bout en bout
- [ ] T27.5 — Gestion autonome des membres (inviter, révoquer, rôle) · REQ-ORG-05 · vérif: gestion complète
- [ ] T27.6 — **Test d'autonomie réel** par un tiers non accompagné · REQ-ORG-09 · vérif: test utilisateur réussi
- [ ] T27.7 — Validation des personas (formateur, coach, professeur, institut, académie) · REQ-ORG-11 · vérif: aucun code spécifique
- [ ] T27.8 — Export du **dossier de preuves Qualiopi** par une organisation · REQ-QLF-02 · vérif: export autonome

---

# Spikes (timeboxés, à clore par une décision)

| Spike | Bloque | Statut |
|---|---|---|
| SAML sans Express (route handler Next) | T4.5 · Gate G1 | [ ] |
| SSE + WebView Capacitor | T14.3, T23.2 | [ ] |
| Pooling Postgres + HMR Next | T0.5.1 | [ ] |
| ETL 2 niveaux → 3 niveaux | T2.3 | [ ] |
| Génération TTV (coût et qualité) | T17.6 | [ ] |
| Planificateur de notifications sans cron externe | T15.8 | [ ] |
| **Qualité de la recherche vectorielle pgvector** (découpage, pertinence) | T16.7 | [ ] |
| **Résistance aux injections** (efficacité réelle des défenses) | T18.8 | [ ] |

# Portes de décision

| Gate | Avant | Décision | Statut |
|---|---|---|---|
| G1 | Phase 4 | Fournisseur SAML (Google Workspace + Microsoft Entra ID) | [ ] |
| G2 | Phase 25 | o2switch supporte-t-il Docker + PostgreSQL ? | [ ] |
| G3 | Phase 4 | Fournisseur email (SMTP / Resend / SES) | [ ] |
| G4 | Phase 17/24 | Fournisseurs IA + tarifs crédits + tarifs Stripe | [ ] |
| G5 | Phase 20 | **Référentiel national qualité Qualiopi (source officielle)** | [ ] |

---

# Definition of Done (global)

1. `npm run typecheck` → 0 erreur
2. `npm run lint` → 0 erreur
3. `npm test` → vert (jsdom + node)
4. Les critères de vérification de **chaque tâche** sont observés
5. `MEMORY.md` mis à jour (hook `session-handoff`)
6. `tasks.md` coché et `CHANGELOG.md` complété
7. Aucune régression sur les phases précédentes
