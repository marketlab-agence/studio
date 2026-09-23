# Phase 7 — Purge Firebase et nettoyage des données de test E2E

**Date** : 2026-09-23
**Statut** : conception validée, prêt pour plan d'implémentation
**Portée** : `e2e/`, `src/lib/`, `scripts/`, `package.json`, `docs/`

---

## 1. Contexte et problème

### 1.1 La purge Firebase est mécanique

| Fichier | Consommateurs réels | Méthode de vérification |
|---|---|---|
| `src/lib/firebase.ts` | **0** | aucun import `@/lib/firebase` dans `src/**` |
| `src/lib/firebase-admin.ts` | **0** | aucun import `@/lib/firebase-admin` dans `src/**` |
| `src/lib/local-data.ts` | **0** | aucun import `@/lib/local-data` dans `src/**` |
| `src/lib/db/import-auth.ts` | `firebase-admin` | script ponctuel, déjà exécuté |
| `scripts/migrate-data.js` | `firebase-admin` | script ponctuel obsolète |

Les 3 premiers fichiers sont **orphelins**. Les 2 derniers sont les seuls consommateurs réels de `firebase-admin`, et ils ont déjà servi.

### 1.2 Le nettoyage E2E répond à une pollution mesurée

Mesures relevées le 2026-09-23 sur la base `katalyst` :

| Mesure | Valeur |
|---|---|
| Organisations totales | **678** |
| Organisations de test résiduelles | **673** (99 %) |
| Utilisateurs fantômes | **602** |
| Jetons `refresh_tokens` de comptes `@e2e.local` | **1079** |
| Cours dans les organisations de test | **0** |
| Helpers / fixtures / teardown E2E existants | **aucun** |

La racine : les E2E tournent sur la base de développement via `DATABASE_URL`, et **aucun teardown automatique** ne supprime ce qu'ils créent. Le fichier `e2e/auth.spec.ts` documente même la requête de nettoyage en commentaire (lignes 11-14) — preuve que le besoin était connu, mais jamais automatisé.

Les tests **DB** (jest) ne sont pas concernés : ils se nettoient correctement via `afterEach` / `afterAll`.

### 1.3 Une fragilité révélée en passant

Le test `e2e/health.spec.ts` échouait parce que `settings.instructorName` valait « Khalipha Ababacar NDIAYE » en base de dev au lieu de « Alex Dubois » (valeur du seed). Cet échec n'était **pas** causé par le code, mais par une donnée modifiable à la main — un test fragile. Ce point est documenté, pas corrigé dans cette phase.

---

## 2. Décisions validées par l'utilisateur

| Question | Décision |
|---|---|
| Base des E2E | **Conserver la base de dev** (`katalyst`) + nettoyage automatique |
| Moment du nettoyage | **Avant ET après** la suite (`globalSetup` + `globalTeardown`) |
| Périmètre du nettoyage | **Marqueurs stricts uniquement** (jamais l'org `katalyst` ni les comptes réels) |
| Approche de purge Firebase | **4 vagues vérifiées** |
| Vague 4 (artefacts de déploiement) | **Hors phase** → proposée en phase 8 |
| `import-auth.ts` | **Décision d'expert** : archivé en documentation, retiré du code exécutable |

---

## 3. Conception — Nettoyage des données E2E

### 3.1 Module unique

**Emplacement** : `e2e/helpers/purge.ts` — hors de `src/` car outil E2E, jamais embarqué dans l'application.

**Interface** :

```ts
export interface PurgeReport {
  organizations: number;
  orphanUsers: number;
}

export async function purgeTestData(pool: Pool): Promise<PurgeReport>;
```

Le compte retourné permet de **prouver** ce qui a été supprimé plutôt que de l'affirmer.

### 3.2 Trois appelants, un seul code

| Appelant | Rôle |
|---|---|
| `e2e/global-setup.ts` | purge **avant** la suite (auto-réparation après un passage interrompu) |
| `e2e/global-teardown.ts` | purge **après** la suite |
| `npm run db:cleanup-e2e` | purge manuelle, réutilise le même module |

Le nettoyage **avant** est ce qui rend le dispositif auto-réparant : une suite tuée par `Ctrl+C` laisse des résidus, que le passage suivant efface.

### 3.3 Marqueurs (stricts, observables)

| Cible | Marqueur |
|---|---|
| Organisations | `slug` commence par : `test-`, `formateur-e2e-`, `institut-`, `compte-connu-`, `apprenant-`, `diag-`, `invalide-`, `nouveau-`, `hors-org-` |
| Utilisateurs | `email LIKE '%@e2e.local'` |

**Jamais touché, par construction** : l'organisation de slug exact `katalyst`, les comptes à email réel, toute organisation sans marqueur.

### 3.4 Ordre de suppression

Toutes les clés étrangères vers `organizations` sont en **`ON DELETE CASCADE`** (vérifié : `ai_credits`, `ai_generations`, `cohorts`, `courses`, `documents`, `invitations`, `lesson_interactions`, `notifications`, `settings`, `users`). Une seule instruction suffit et garantit l'atomicité.

```sql
-- 1. Organisations de test (cascade sur users, courses, invitations, tokens…)
DELETE FROM organizations WHERE slug LIKE ...marqueurs;

-- 2. Utilisateurs @e2e.local orphelins, rattachés à une organisation réelle
--    (e2e/progress.spec.ts réaffecte des comptes de test à la 1re organisation)
DELETE FROM users WHERE email LIKE '%@e2e.local';
```

`refresh_tokens` et `password_reset_tokens` référencent `users` en `CASCADE` : les 1079 jetons partent sans instruction dédiée.

**Cas vérifié** : `organizations.owner_id` est en `SET NULL`. L'organisation `katalyst` a `owner_id = NULL`, donc aucune suppression d'utilisateur de test ne peut la déposséder.

### 3.5 Connexion et fin de processus

Les global hooks ouvrent leur propre `Pool` sur `DATABASE_URL` et le **ferment dans un `finally`**. Sans cette fermeture, les processus ne rendent pas la main — c'est la cause du `worker process failed to exit gracefully` déjà observé sur les tests DB.

Les global hooks tournent **dans le processus Playwright**, pas dans le serveur Next. Ils chargent donc `.env.local` explicitement via `dotenv` (Playwright n'exécute pas Next).

**Rappel du piège documenté** : `playwright.config.ts` **remplace** l'environnement du serveur (`webServer.env`), d'où l'écriture obligatoire `{ ...process.env, ... }`. Les global hooks ne sont pas concernés, mais la règle reste en vigueur dans le fichier.

### 3.6 Garde-fou anti-mauvaise-base

Avant toute suppression, le module **refuse de s'exécuter** si `DATABASE_URL` :
- contient `masterplan365`, **ou**
- pointe sur le port `5432` (base `masterplan365-postgres-1`, lecture seule)

Il lève une erreur explicite. Un nettoyage automatique ne doit jamais pouvoir viser une base qui n'est pas la sienne.

---

## 4. Conception — Purge Firebase

### 4.1 Vague 1 — Supprimer les 3 orphelins

`src/lib/firebase.ts`, `src/lib/firebase-admin.ts`, `src/lib/local-data.ts`.

**Précaution** : avant suppression, contrôler que ces fichiers n'exportent pas de **constante ou de type réexporté ailleurs**. « Aucun import du fichier » ne garantit pas « aucun export consommé » — vérification faite en vague 1, pas supposée.

**Vérification** : `typecheck` 0, `lint` 0, tests verts.

### 4.2 Vague 2 — Alias et références textuelles

Retrait des entrées d'alias dans `tsconfig.json` / `jest.config.mjs` pointant vers ces fichiers, et des mentions résiduelles.

**Vérification** : `typecheck` 0, `lint` 0.

### 4.3 Vague 3 — Dépendances

`npm uninstall firebase firebase-admin` (`--legacy-peer-deps` selon l'usage du projet).

C'est la vague qui **casserait** `import-auth.ts` et `scripts/migrate-data.js` s'ils restaient — d'où leur traitement en §5.

**Vérification** : `npm ls firebase firebase-admin` → absents ; `typecheck` 0 ; `lint` 0 ; **tous** les tests.

### 4.4 Vague 4 — Artefacts de déploiement *(hors phase)*

`.firebaserc`, `firebase.json`, `apphosting.yaml`.

**Décision** : **non exécutée dans cette phase**. Retirer ces fichiers change la **cible de déploiement** — décision d'infrastructure distincte de la purge du code. Les mélanger rendrait tout retour arrière inutilisable.

Consignée comme **phase 8 proposée**.

---

## 5. Conception — `import-auth.ts` et `migrate-data.js`

### 5.1 La contrainte vérifiée

`import-auth.ts` **lit réellement Firebase** (`admin.auth().listUsers`, ligne 73). Les données ne sont pas en dur. Le « dégrader » en constante supposerait donc d'**inventer** les comptes, ce qui est interdit par la méthode du projet (`[À COMPLÉTER]`, jamais inventé).

### 5.2 Décision

| Élément | Traitement | Raison |
|---|---|---|
| `src/lib/db/import-auth.ts` | **Supprimé** ; contenu consigné dans `docs/katalyst/migration-comptes-firebase.md` | Un fichier TS important `firebase-admin` casse `typecheck` dès la vague 3 — le garder exécutable et purger sont contradictoires |
| `scripts/migrate-data.js` | **Supprimé** | Utilise `firebase-admin` pour un Firebase décommissionné |
| `npm run db:import-auth` | **Retiré** de `package.json` | Ne peut plus tourner |
| `npm run migrate` | **Retiré** de `package.json` | Idem |
| Les **11 comptes** importés | **Restent en base** | Données réelles, pas artefacts de migration |
| Variables `FIREBASE_*` | **Retirées** de `.env.local` et de la doc d'installation | Plus aucun consommateur |

### 5.3 Contenu réel constaté (pour la documentation)

Relevé du 2026-09-23 sur l'organisation `katalyst` — **11 comptes**, décrits **par catégories, sans citer les adresses** :

| Rôle | Statut | `must_reset_password` | Remarque |
|---|---|---|---|
| 1 Super Admin | Actif | `false` | compte Google (reconnexion directe) |
| 1 Admin | Actif | `true` | compte à mot de passe |
| 1 Modérateur | Actif | `true` | compte à mot de passe |
| 8 Utilisateurs | 6 actifs, 2 inactifs | `true` (sauf 1 Google) | comptes à mot de passe |

La distribution confirme le comportement attendu du script : `must_reset_password` est **vrai pour les comptes à mot de passe** (hachage non exportable par Firebase) et **faux pour les comptes Google**.

---

## 6. Stratégie de vérification

### 6.1 Tests du module de purge (`src/tests/db/purge.db.test.ts`, base `katalyst_test`)

Écrits **avant** l'implémentation (TDD).

| Cas | Ce qu'il prouve |
|---|---|
| Supprime une organisation marquée | Le marqueur fonctionne |
| Supprime les `users @e2e.local` orphelins | La 2ᵉ passe fonctionne |
| **Préserve l'organisation `katalyst`** | Le nettoyage ne détruit pas les données réelles |
| **Préserve un utilisateur au vrai email** | Aucun compte légitime n'est effacé |
| Cascade : users / cours / invitations de l'org supprimée disparaissent | Aucun orphelin |
| Refus si `DATABASE_URL` vise 5432 ou `masterplan365` | Garde-fou anti-mauvaise-base |
| Idempotence : deux exécutions = même résultat | Rejouable sans effet de bord |

Le cas **« préserve `katalyst` »** est le plus important : il prouve que la purge ne peut pas vider la base de développement.

### 6.2 Preuve en conditions réelles

Les tests ci-dessus tournent sur `katalyst_test`. Le script réel s'exécute sur `katalyst`. Une **exécution réelle documentée** est donc exigée, avec le compte **avant / après** :

- Avant : 678 organisations dont 673 de test
- Après : **0 organisation de test résiduelle**, 0 utilisateur `@e2e.local`

### 6.3 Vérifications par vague Firebase

| Vague | Preuve exigée |
|---|---|
| 1 | `typecheck` 0 · `lint` 0 · tests verts |
| 2 | idem |
| 3 | `npm ls firebase firebase-admin` → absents · `typecheck` 0 · `lint` 0 · **tous** les tests |
| Final | `grep` récursif → **0 occurrence** de `firebase` dans `src/` et `scripts/` |

### 6.4 Non-régression globale (état de référence à préserver)

| Contrôle | Attendu |
|---|---|
| `typecheck` | 0 erreur |
| `lint` | 0 erreur |
| Tests unitaires | **275** |
| Tests DB | **174** + nouveaux tests de purge |
| E2E | **76** |
| Audit contenu | **6/6** formations conformes |

---

## 7. Hors portée

| Élément | Raison |
|---|---|
| Vague 4 (artefacts de déploiement) | Décision d'infrastructure → **phase 8 proposée** |
| Fragilité de `e2e/health.spec.ts` | Test dépendant d'une donnée modifiable ; documenté, non corrigé ici |
| Dé-duplication des helpers E2E répétés | `RUN`, `cookieHeader`, `Pool` sont dupliqués dans 7 specs — refactoring distinct |
| Nettoyage de la base de dev existante | Fait par le script, mais relève de l'exécution, pas de la conception |

---

## 8. Risques et parades

| Risque | Parade |
|---|---|
| Un marqueur trop large efface une organisation légitime | Liste **explicite** de préfixes + test « préserve `katalyst` » + plafond de sécurité sur le nombre de suppressions |
| La purge vise la mauvaise base | Garde-fou §3.6 : refus si 5432 ou `masterplan365` |
| Un import caché casse à la vague 3 | 4 vagues vérifiées ; la vague 3 est le seul point de rupture, et il est encadré par la §5 |
| Processus qui ne rendent pas la main | `Pool` fermé dans un `finally` (§3.5) |
| Perte de la traçabilité des comptes importés | Contenu archivé en documentation **avant** suppression du script (§5.2) |
| La purge E2E supprime un compte admin réel | Marqueur `@e2e.local` uniquement ; les 11 comptes réels ne le portent pas |
