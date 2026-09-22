# Incidents, pièges et blocages

> **Archive de `MEMORY.md`.** Déplacé ici parce que `MEMORY.md` doit rester court
> (règle des 200 lignes) pour remplir son rôle : être lu en entier au début de
> chaque session.
>
> Ces éléments restent utiles — ils expliquent des symptômes qu'on risque de
> rencontrer à nouveau — mais ils ne concernent pas l'état courant du projet.
>
> Dernier déplacement : phase 4 (`fc2c176`).

---

## Bugs résolus et leurs fixes

- `node_modules` corrompu — installation interrompue, paquet `firebase` sans fichiers `.mjs` → `Cannot resolve 'firebase/app'` en Turbopack. Fix : suppression de `node_modules/firebase` + `npm install --legacy-peer-deps` (`node_modules/firebase/app/dist/index.mjs`).
- `npm run dev -- --turbopack` ignoré (npm traite le flag comme config) → ajout du script `dev:turbo` dans `package.json`.
- `EPERM .next\trace` + « Port 3000 in use » → **deux instances `next dev` simultanées**. Un seul serveur à la fois sur ce dossier.
- Firestore `7 PERMISSION_DENIED: requires billing` → le repli `src/data/*.json` (`src/lib/local-data.ts`) n'a plus lieu d'être : **le couplage Firestore est rompu** (phase 3). `local-data.ts` est désormais **du code mort**.
- ✅ **`AuthContext.tsx:124` — fuite de listener, CORRIGÉE en phase 4** (`fc2c176`). `onAuthStateChanged` ignorait les valeurs de retour, donc `unsubscribeSnapshot()` n'était jamais appelé. La refonte a **supprimé l'abonnement** au lieu de le réparer : un seul appel au montage, rien à détacher. La fuite est donc impossible par construction, pas seulement évitée.
- `src/lib/firebase.ts:18-29` — la config Firebase était loguée en clair (apiKey, projectId…) → **corrigé** (`ddcf893`), 5 `console.log` retirés, import `FirestoreSettings` inutilisé supprimé.
- `src/app/pricing/page.tsx` — `AlertDialogTrigger` utilisé (L122) mais non importé : la page **plantait** au rendu du bouton de rétrogradation → **corrigé** (`c229f89`).
- `src/components/tutorial/QuizView.tsx` — `useEffect` appelé après un `return` précoce : violation des règles des Hooks → **corrigé** (`c05a534`), valeurs dérivées et effet remontés avant le return (optional chaining).
- **10 suites de tests ne s'exécutaient pas** (`Cannot find module 'msw/node'`) — 3 causes chaînées : (1) `msw/node` exposé avec `browser:null` → `customExportConditions: ['']` ; (2) jsdom n'implémente pas `fetch` (`Response is not defined`) → `jest-fixed-jsdom` ; (3) `msw` et `firebase` en ESM → **remplacement** de `transformIgnorePatterns` (next/jest ignore tout `node_modules` et jest combine les motifs en OU : un simple ajout ne peut pas « dé-ignorer » un paquet) → **corrigé** (`9938292`). Le même piège s'est reposé en phase 4 avec **`jose`**, à traiter dans **les deux** projets Jest.
- `.env.example` masqué par la règle `.env*` du `.gitignore` → **corrigé** (`f46f1bb`), négation `!.env.example` ajoutée.
- **Rebase interactif bloqué** (96 commits, 14 rejoués, 18 fichiers en conflit) laissé par Firebase Studio → **`rebase --abort`**, branche `master` restaurée, travail récupéré via stash + sauvegarde temp. Voir « Pièges ».
- ✅ **`Called end on pool more than once`** (phase 4) — `fullyParallel` répartit les tests d'un fichier entre plusieurs workers, et `afterAll` s'exécute dans **chacun**. Ne **pas** fermer le pool `pg` dans un spec Playwright.
- ✅ **`429` inexpliqués en E2E** (phase 4) — `webServer.env` de Playwright **remplace** l'environnement du serveur au lieu de le compléter. Sans recopie de `process.env`, le serveur perdait `NODE_ENV` et `.env.local`, et la limite de débit retombait à sa valeur stricte (5 inscriptions/heure). Corrigé par `...process.env` dans la configuration.

## Blocages ouverts

- **Port PostgreSQL 5433, pas 5432** : le port 5432 est occupé par `masterplan365-postgres-1` (projet tiers). **Ne jamais pointer `DATABASE_URL` sur 5432** — on écrirait dans la base d'un autre projet.
- **Un « vert » de test n'est une preuve que si le test s'exécute réellement.** Les tests DB étaient passés à vide via un `return` gracieux : ils sont désormais **stricts** (base injoignable = échec). `SKIP_DB_IF_UNAVAILABLE=1` existe mais doit rester exceptionnel.
- **[mineur]** Avertissement Jest sur le projet DB : `worker process failed to exit gracefully` — fuite de handle à investiguer (n'affecte pas les résultats).
- **`src/queries/**` = code mort** : importé nulle part. Typé pour T0.2, à supprimer en phase 16.
- **Modules Firebase = code mort** depuis la phase 3 : `src/lib/firebase-admin.ts`, `src/lib/firebase.ts`, `src/lib/local-data.ts` n'ont **plus aucun consommateur** (vérifié). À supprimer en phase 16, avec les dépendances `firebase` / `firebase-admin` de `package.json`.
- **Le build Next n'est pas vérifié** : étape CI en report-only (script `npm run build` en syntaxe Windows `cmd`).
- **Divergence de branche** : `master` a 96+ commits locaux contre 1 sur `origin/master`. Aucun push effectué.

---

## Pièges identifiés

- **Deux `next dev` simultanés = EPERM + conflit de port.** Toujours tuer l'instance avant d'en relancer une. Vaut aussi pour Playwright : `reuseExistingServer` réutilise **n'importe quel** serveur à l'écoute, y compris un serveur périmé qui ne connaît pas les variables d'environnement ajoutées depuis.
- ⚠️ **Un rebase interactif peut être laissé en plan par Firebase Studio.** Le dépôt a été trouvé à mi-rebase (96 commits, 14 rejoués). **Ne jamais commiter pendant un rebase**, et **`git rebase --abort` détruit les fichiers suivis modifiés** (les non suivis survivent). Toujours sauvegarder avant.
- ⚠️ **La branche `master` a divergé de `origin/master`** : 96 commits locaux contre 1 distant. Aucun push effectué. La divergence est probablement l'origine du rebase abandonné — à trancher avant tout `git push`.
- ⚠️ **OneDrive verrouille les fichiers** : `.git` et `node_modules` subissent des `Permission denied` lors des suppressions massives (`git stash -u`, `git clean`). Prévoir un backup avant toute opération destructrice.
- ⚠️ **`node_modules` a été corrompu par une installation interrompue** : 4 paquets identifiés avec des fichiers manquants (`firebase` sans `.mjs`, `framer-motion` et `html2canvas` sans aucun `.d.ts`, `msw` sans `SetupApi.d.mts`). **Réinstallation complète propre effectuée** (1996 paquets). En cas de symptôme bizarre (`Cannot resolve`, `TS7016`, type manquant), **soupçonner la corruption avant le code** et réinstaller.
- ⚠️ **Storybook était incohérent** : `@storybook/nextjs@10` avec tous les autres addons en `8.x` → peer deps contradictoires, et **le paquet cœur `storybook` n'était pas déclaré**. Aligné en 8 + cœur ajouté.
- ⚠️ **`@types/react` était en 18 alors que `react` est en 19** → inférence cassée. Corrigé.
- ⚠️ **Un `@types` désaligné masque les bons types.** `nodemailer` 10 embarque les siens ; `@types/nodemailer` 8 (majeure antérieure) les remplaçait par des types faux. Retiré. Vérifier `package.json` du paquet (`types`/`exports`) avant d'installer un `@types`.
- ⚠️ **`planId` vs `plan`** : le modèle utilisateur était incohérent (id `planId` dans le type et `AuthContext`, libellé `plan` dans les données et les pages admin). **Canonique : `planId`** (`free`/`premium`). Helper `planLabel()` dans `src/lib/users.ts` ; seed `users.json` normalisé.
- ⚠️ **react-markdown v9 ne fournit plus la prop `inline`** dans le composant `code`. Détecter un bloc par langue déclarée (`language-x`) ou présence d'un retour à la ligne.
- ⚠️ **`expect(valeur, message)` n'est pas typé dans cette version de Jest** — l'assertion échoue. Passer le contexte autrement (nom du test, ou `expect(...).toBe(...)` nu).
- ⚠️ **`process.env.NODE_ENV` est en lecture seule** dans les types de Next : passer par un cast pour le modifier en test.
- ⚠️ **`headersArray()` de Playwright renvoie des objets `{name, value}`**, pas des tuples.
- ⚠️ **`CardTitle` (shadcn) produit un `div`** : une page qui ne l'utilise que pour ses titres n'a **aucun titre** (WCAG 2.2 AA). Utiliser de vrais `h1`.
- ⚠️ **`jose` est ESM-only** : à transformer dans **les deux** projets Jest (jsdom et DB). Le test JWT doit tourner en **environnement Node** (jsdom n'a pas `crypto.subtle` et impose un realm où les `Uint8Array` échouent aux `instanceof` de `jose`).
- `npm run lint` était **interactif** (aucune config ESLint) → **résolu** (T0.1, commit `685213f`).
- **Typecheck : 64 → 0 erreur** (T0.2). Aucune erreur de typage connue à ce jour.
- `passport-saml` est **conçu pour Express** ; les route handlers Next ne sont pas un drop-in → **spike obligatoire avant G1**.
- Le JSON est à **2 niveaux** (cours → chapitre → leçon) ; le modèle cible en a **3** → **ETL** effectué en phase 2.
- **Isolation multi-tenant** : une requête de provider sans `scope` = fuite de données entre organisations. Le scope est **obligatoire dans l'interface** (ne compile pas sans) ; `assertScope()` le rejette aussi à l'exécution. 10 tests d'isolation couvrent **la lecture et l'écriture** (T3.12, `e1b2de1`).

---

## Invitations — décisions et garde-fous (phase 4, `7b35183`)

- **Le jeton d'invitation est stocké haché** (SHA-256). Une fuite de la base ne doit pas permettre de rejoindre une organisation. SHA-256 suffit : le jeton est aléatoire sur 32 octets.
- **Réinviter révoque l'invitation en attente** pour la même adresse. Sans cela, plusieurs liens resteraient valides en parallèle et l'émetteur croirait avoir remplacé ce qu'il n'a pas remplacé. C'est pourquoi il n'y a **pas** de contrainte d'unicité sur `(organization_id, email)` : un `UNIQUE` empêcherait de réinviter sans détruire l'historique.
- **Le rôle « Super Admin » est refusé** à la création d'une invitation : c'est un rôle *plateforme*. L'autoriser permettrait à un institut de s'octroyer des droits sur l'ensemble du service.
- **`FOR UPDATE` sur le jeton à l'acceptation** : deux clics simultanés sur le même lien ne doivent pas créer deux comptes. Vérifié par un test qui déclenche réellement la course.
- **L'invitation est consommée dans la même transaction que la création du compte** : jamais un lien brûlé sans compte, ni un compte sans lien consommé.
- **L'email nomme qui invite et quel rôle** : sans ces deux informations, le destinataire ne peut pas distinguer une invitation légitime d'un message frauduleux, et accepterait à l'aveugle.

## Piège récurrent — serveur E2E réutilisé (résolu)

`reuseExistingServer: true` produisait des **résultats faux silencieux** : un serveur démarré *avant* l'ajout d'une variable d'environnement ne la connaît pas, la limite de débit retombe à sa valeur stricte, et les tests échouent en **429 sans cause visible**. C'est arrivé **quatre fois** dans la phase 4.

Résolu en passant `reuseExistingServer` à **`false`**, y compris en local : un serveur déjà présent provoque désormais une erreur explicite (« port déjà utilisé ») au lieu d'un échec incompréhensible. On perd quelques secondes de démarrage, on gagne des diagnostics justes.

**Règle** : préférer une erreur franche à un résultat faux. Un test qui passe sur un état périmé ne prouve rien.

---

## Autorisation — le trou et le verrouillage (phase 4, `41c9520`)

- 🔴 **Une server action est un point d'entrée HTTP.** Elle est joignable directement, sans passer par la page qui l'affiche. Vérifier le rôle dans un composant React ne protège donc **rien**. Le `layout` admin ne contrôlait le rôle que côté client : n'importe quel utilisateur connecté pouvait appeler `updateUserRoleAction` et s'octroyer les droits d'admin. **Tout contrôle d'accès doit être dans l'action ou la route**, à l'endroit où elle s'exécute.
- 🔴 **Une liste de rôles codée en dur dérive toujours.** Le `layout` admin listait `['Super Admin', 'Admin', 'Modérateur']` et **omettait « Propriétaire »** : le propriétaire d'une organisation était enfermé hors de son propre espace. Le middleware le laissait passer, le layout bloquait le rendu, et **la page restait vide sans aucune erreur** — un symptôme très difficile à relier à sa cause. La liste vient désormais d'une source unique (`src/lib/auth/routes.ts`).
- ⚠️ **Ne pas avaler un refus d'autorisation dans un `try/catch`.** Le transformer en « aucune donnée » masque un problème de droits derrière un écran vide, sans trace exploitable. Un `ForbiddenError` doit remonter.
- ⚠️ **Une interface qui prétend modifier des permissions sans les modifier est pire qu'une interface absente** : un administrateur croirait avoir restreint un accès qui reste ouvert. La page `/admin/roles` simulait l'enregistrement ; elle décrit maintenant les règles réellement appliquées, en appelant les mêmes fonctions — elle ne peut pas mentir.
- **Se protéger d'une auto-rétrogradation** : un Propriétaire qui retirerait ses propres droits laisserait l'organisation sans administrateur.
- ⚠️ **Le rôle est porté par le jeton** : le modifier en base n'a d'effet qu'à la prochaine connexion (ou à l'expiration du jeton, 15 min). Les tests doivent donc **se reconnecter** après un changement de rôle, sinon ils valident un jeton périmé.

---

## Progression — la régression de la phase 4 (corrigée en phase 5, `d149a10`)

- 🔴 **Sortir d'un stockage ne suffit pas : il faut rebrancher celui qui le remplace.** La rupture avec Firestore a laissé la progression **en mémoire** pendant toute la phase 4 — les apprenants perdaient tout au rechargement. Le commit de rupture ne l'a pas signalé comme une régression fonctionnelle ; c'est en écrivant `MEMORY.md` que le manque est apparu.
- **Deux niveaux de progression, à ne pas fusionner** : `user_lesson_progress` = ce qui est **terminé** ; `user_course_progress` = **où l'on en est**. Les fusionner obligerait à inventer une ligne de progression pour chaque leçon.
- ⚠️ **Un `Set` ne survit pas à `JSON.stringify`** : il devient `{}`. La conversion tableau ↔ `Set` doit se faire à **un seul endroit** (`src/lib/progress/client.ts`), sinon elle s'oublie quelque part.
- ⚠️ **Ne pas persister depuis un `useEffect` qui observe l'état** : l'effet se déclenche aussi au **chargement initial** et réécrit ce qu'on vient de lire. Persister depuis le **point de mutation** (une action de l'utilisateur).
- ⚠️ **Une seconde source de vérité pour la même donnée diverge toujours.** `useTutorialProgress` maintenait son propre `Set` et sa propre lecture Firestore, en parallèle du contexte : une leçon pouvait être cochée dans un écran et décochée dans un autre. Réécrit en **vue dérivée**.
- ⚠️ **Décocher doit RETIRER en base.** Le serveur supprime les lignes `user_lesson_progress` absentes de la liste reçue. Sans ce retrait, une leçon décochée resterait comptée comme terminée et l'affichage mentirait.
- 🔎 **Constat produit** : une **inscription libre-service crée une organisation VIDE** (REQ-ORG-04). Le contenu seedé appartient à l'organisation `katalyst`, donc un nouvel inscrit n'y a **légitimement pas accès** (403). Trois tests E2E ont échoué sur ce point : le cloisonnement fonctionnait, c'est le test qui était en tort. **Conséquence à traiter un jour** : un inscrit seul voit un espace vide, sans contenu de démarrage.
