# MEMORY.md — Katalyst

> Fichier de continuité. **À lire en premier au début de CHAQUE session.**
> Règle des 200 lignes : au-delà, archiver dans `memory/[sujet].md` et remplacer par un lien.
> Vérifier la fraîcheur par rapport à `AGENTS.md` et `VERSION`.

---

## État actuel du projet

| Champ | Valeur |
|---|---|
| Version | `0.1.0` (voir `VERSION`) |
| Branche Git active | à renseigner |
| Dernière phase complétée | ✅ **Phase 0**, ✅ **Phase 0.5**, ✅ **Phase 1**, ✅ **Phase 2 — Schéma, migrations & seed**, ✅ **Phase 3 — Providers** |
| Phase en cours | 🔄 **Phase 4 — Authentification** · *socle serveur + routes + middleware faits* (T4.1, T4.2, T4.6, T4.7, provider de T4.4/T4.8) ; **restent** OAuth Google, SAML, endpoints MFA, fin du reset forcé, refonte `AuthContext` |
| Prochaine tâche | **T4.8 (suite)** : endpoint `forgot-password`/`reset-password` + email + page — débloque la reconnexion des **10 comptes importés** |
| Qualité | `typecheck` 0 · `lint` 0 · tests **17 suites / 147** · tests DB **8 suites / 95** · **E2E 16** |
| CI | bloquants : lint, typecheck, tests, check:version, gitleaks, tests DB, E2E · report-only : build |
| Base locale | PostgreSQL **pgvector/pgvector:pg16** sur le port **5433** — **27 tables**, contenu seedé, 12 comptes importés |
| **Couplage Firestore** | ✅ **ROMPU** : `firebase-admin.ts`, `firebase.ts` et `local-data.ts` n'ont **plus aucun consommateur** dans `src/` |
| **Providers (10)** | ✅ Content, User, Settings, AI crédits, Document, Notification, Email, Storage, **Auth** — **9 implémentés**. Reste `PaymentProvider` (phase 24) |

### Commandes base de données

```
npm run db:migrate          # applique les migrations (dev, port 5433)
npm run db:migrate:test     # applique les migrations sur katalyst_test
npm run db:seed             # rejoue src/data/*.json (idempotent)
npm run db:seed:test        # seed sur la base de test
npm run db:import-auth      # importe les comptes Firebase Auth (12)
```
| Stack actuelle | Next.js 15, React 19, TypeScript, **PostgreSQL** (Firestore dé-couplé, modules encore présents mais morts) |
| Stack cible | Next.js 15 + PostgreSQL **multi-tenant** + JWT/Google OAuth + Stripe + SSE + **studio IA à crédits** + Capacitor |
| Plan | **29 phases** (0, 0.5, 1-27) — Couche 0 (fondations) · Couche 1 (migration) · Couche 2 (socle transverse : i18n, API, sécurité) · Couche 3 (produit REWORK + conformité + autonomie) |

---

## Décisions architecturales clés

1. **Backend natif Next** — Postgres accédé côté serveur (RSC, server actions, route handlers). Pas de backend Express séparé.
2. **PostgreSQL auto-hébergé**, agnostique. Voir `adr/0001-choix-postgresql.md`.
3. **Auth : JWT + bcrypt + Google OAuth + refresh tokens + MFA/TOTP + SSO SAML**, remplaçant Firebase Auth. Voir `adr/0002-auth-jwt-remplace-firebase.md`.
4. **Modèle de formation de référence** : profondeur du cours GitHub (11 chapitres, 37 leçons, seul cours avec quiz) + **100 % de leçons interactives**. Voir `adr/0003-modele-formation-reference.md`.
5. 🔴 ~~**Hiérarchie pédagogique = Semaine / Jour** : `S.1.J.2`~~ → **ANNULÉE par la décision 35** (2026-09-21). « S » et « J » ne sont pas des données mais des **libellés de titrage** décidés par le formateur, et **une leçon peut couvrir plusieurs jours**. Ce qui subsiste : **pas de « semestre »**, et un **regroupement facultatif** (`weeks`) à intitulé libre.
6. **Déblocage (drip)** : par **date de sortie** (badges type « 5 août ») ET par condition (chapitre précédent, quiz réussi).
7. **Gamification** : points par leçon (ex. 20 pts), modal de fin de leçon (« Félicitations ! … Vous avez gagné ⭐ 20 points »), récapitulatif par type.
8. **Cohortes** : multi-cohortes par apprenant, créées par l'admin (nommage type `IAFORMATEUR_20260803G1`). Chat formateur ↔ apprenants avec compteur de non-lus.
9. **Temps réel : SSE natif Next** (pas Socket.IO, pas de tiers). Voir `adr/0004-temps-reel-sse.md`.
10. **Paiement : Stripe** derrière une abstraction `PaymentProvider` (swappable).
11. **Zero vendor lock-in** : abstractions `ContentProvider`, `UserProvider`, `SettingsProvider`, `AuthProvider`, `EmailProvider`, `StorageProvider`, `PaymentProvider`, `AICreditProvider`, `NotificationProvider`, `DocumentProvider`. Sélection par variables d'environnement.
12. **Mobile : Capacitor** dès la Couche 2 (précédent masterplan365 : `android/`, `ios/`, `fastlane/`).
13. **Aucune facturation GCP.** Contenu depuis `src/data/*.json`. Les **12 comptes** sont importés ; les **10 comptes email → reset forcé** (mots de passe non exportables).
14. **Suivi : modèle `.kiro`** adapté de masterplan365 (lecture seule sur masterplan365, jamais modifié).
15. **Registre de composants obligatoire** (`src/components/registry.ts`) : source unique pour l'UI, l'IA et l'outil de création. Aujourd'hui `LessonView.tsx` importe 37 composants en dur et l'IA reçoit une liste séparée → désynchronisation.
16. **Méthodologie REWORK = moteur pédagogique** de Katalyst (CPA², ACTIF, Bloom, Identimètre, QQOQCCP, SAVI, déroulé 6 colonnes, fiche 17 rubriques, pipeline à gates). Voir `adr/0005-methodologie-rework.md` et `.kiro/steering/rework-methodology.md`. Source : `1. Consulting IA/Formation REWORK/`.
17. **Conformité Qualiopi = objectif produit** ; dossier de preuves exportable. Socle disponible : référentiel C.1-C.8. **RNQ V10 identifié** : décret **n° 2026-728 du 1er août 2026**, **33 indicateurs**, en vigueur au **1er novembre 2026** (source Légifrance, lu le 2026-09-21). Gate **G5** = récupérer le guide de lecture V10. Voir `adr/0006-conformite-qualiopi.md`.
18. **Multi-tenant léger (organisations)** — **révision de l'ancien non-goal NG-01**. Instituts/académies doivent être autonomes avec isolation des données et marque propre. Le `scope` (`OrgScope`) est **obligatoire** dans les providers. Voir `adr/0007-multi-tenant-organisations.md`.
19. **Studio de génération IA + crédits** : TTT, TTI, TTS, STT, TTV, consommables par les formateurs, coût affiché avant génération, résultat éditable, mention de transparence IA.
20. **Déblocage configurable par l'auteur** : cadence jour / semaine / mois / personnalisé + échéances, avec notifications d'ouverture, d'accès, d'inactivité et d'échéance.
21. **Audio = contenu de première classe** (au même titre que texte, vidéo, image) + métadonnées d'accessibilité obligatoires sur tout média.
22. **Internationalisation (transatlantique)** — **révision de l'ancien non-goal NG-04**. **FR + EN obligatoires**, ES optionnel. Routage `/fr` `/en`, zéro chaîne en dur, lint i18n bloquant, contenu multilingue. Voir `adr/0008-internationalisation.md`.
23. **API centrale versionnée** `/api/v1/*` avec chaîne obligatoire : auth → scope → autorisation → validation Zod → handler. OpenAPI généré depuis Zod. Voir `adr/0009-api-centrale-securite.md`.
24. **Sécurité** : en-têtes, CSRF, anti-force brute, journal d'audit, chiffrement, analyse de dépendances (`npm audit`, `gitleaks`), RGPD, procédure d'incident.
25. **Défenses anti prompt-injection** — 7 niveaux (hiérarchie d'instructions, délimitation, validation de sortie Zod, aucune écriture directe, outils en liste blanche scopés, détection/journalisation, provenance). Normes : **OWASP LLM Top 10**. Voir `adr/0010-defense-prompt-injection.md`.
26. **Conformité SOC 2 / NIS2 « le juste nécessaire »** : contrôles structurels documentés, **aucune certification revendiquée**. Voir `adr/0011-conformite-soc2-nis2.md`.
27. **Base documentaire du formateur** (content prompting REWORK à **3 niveaux** : formation / chapitre / leçon, avec héritage) + **pgvector** pour la recherche sémantique + traçabilité des sources. Voir `adr/0012-base-documentaire.md`.
28. **Normes retenues** : OWASP ASVS, OWASP Top 10, OWASP API Top 10, **OWASP LLM Top 10**, RGPD, **WCAG 2.2 AA**, SOC 2, NIS2, ISO 27001 (réf.), AI Act, NIST AI RMF, PCI DSS SAQ A, ISO 25010. Référentiel : `@.kiro/steering/security-standards.md`.
29. **Patterns réutilisés de masterplan365** (lecture seule) : `authenticate.ts`, `auth.ts`, `rateLimiter`/`sanitizeInput`/`validation`, `aiGuard`/`tierQuotaGuard`, `lib/audit`, `storageProvider`, `llmProvider`, `pgvector/pgvector:pg16`, `.gitleaks.toml`, workflows `deploy-{aws,gcp,azure}`, i18n `_t('fr','en')`.
30. **Tarification** : modèle par organisation (Découverte 0 € · Formateur ~39 € · Institut ~149 € · CFA/Entreprise sur devis) + **crédits IA rechargeables**. Document sourcé : `@.kiro/specs/katalyst/pricing.md`. ⚠️ **Les tarifs de REWORK ne sont pas publics** — le positionnement repose sur les marchés Qualiopi (0-992 €/mois) et LMS (29-598 $/mois). Les montants Katalyst sont des **[PROPOSITION]** à valider.
31. **Registre des composants** (`src/components/registry/`) : source unique pour le rendu, l'IA et la validation. Découpé en `catalog.ts` (**métadonnées seules, aucun import React** — utilisable serveur, IA, tests) et `index.ts` (liaison aux composants, réservée au rendu). 46 composants : **33 interactifs, 13 visuels**. `LessonView` : 173 → 96 lignes, 46 imports → 1.
32. **Schémas Zod partagés** (`src/lib/schemas/content.ts`) : source unique des contrats du contenu (9 types de leçon, numérotation `S.n.J.m`, audit de conformité). **N'importe aucun composant React** — sinon le bundle client embarquerait les 46 composants.
33. **Numérotation Semaine/Jour** : `formatWeekCode`, `formatChapterCode`, `parseChapterCode`, `DAYS_PER_WEEK = 5`. Types **inférés** des schémas (pas de duplication).
34. 🔴 **13 des 33 composants « interactifs » sont des coquilles statiques** — mesuré : aucun `useState`/`onClick`/`onChange`/`onDrag`. Ex. `GitCommandSimulator` affiche un bouton « Exécuter » **sans handler** ; `WorkflowDesigner` affiche « glisser-déposer » sans implémentation. Marqués `status: 'placeholder'`, exclus des propositions de l'IA et refusés par `assertUsableComponent`. **La promesse produit « la compétence par la pratique » est donc partiellement non tenue** : les rendre réellement interactifs relève de la **phase 6**, et REQ-CNT-02 (100 % de leçons interactives) n'est pas atteignable avant.
35. 🔴 **CORRECTION UTILISATEUR (2026-09-21) — « S » et « J » ne sont PAS des données.** Ce sont des **libellés de titrage** décidés par le formateur. Conséquences, toutes appliquées :
   - colonnes `weeks.code` et `chapters.code` **supprimées** ; plus aucun code `S.n.J.m` en base ;
   - helpers `formatWeekCode` / `formatChapterCode` / `parseChapterCode` / `DAYS_PER_WEEK` **supprimés** ;
   - règle « 5 chapitres par semaine » **supprimée** : **une leçon peut couvrir plusieurs jours** ;
   - l'ETL **n'invente plus de regroupement** (`weeks` est vide au seed) ;
   - `weeks` reste comme **regroupement visuel facultatif** à intitulé libre ; `chapters.week_id` est nullable.
36. **Accès par période conservé et étendu** : `unlock_rule_id` existe sur **`courses`, `chapters` ET `lessons`**. Une règle d'accès peut donc viser la formation, le chapitre ou la leçon — ouverture à une date, échéance, cadence (`DAY`/`WEEK`/`MONTH`/`CUSTOM`) ou condition (`COMPLETION`/`QUIZ_PASSED`). C'est ce mécanisme qui porte le rythme, **pas** un découpage en semaines.
37. **Phase 3 — quatre arbitrages d'expert sur la couche providers** (tranchés faute de règle préalable, chacun **verrouillé par un test**) :
    - `chapters.description` **ajoutée** (`003_content.sql`) : sans la colonne, chaque enregistrement de chapitre **perdait silencieusement** la description au round-trip.
    - `saveChapters` **libère la plage de positions** avant de les réassigner (`+10000`, puis position définitive) : respecte `UNIQUE (course_id, position)` **sans** contrainte `DEFERRABLE` ni transaction explicite. Vérifié par un test de réordonnancement complet.
    - `saveChapters` **ne supprime plus les leçons** (*upsert* + rejet des seules leçons disparues) : un `DELETE` emportait `user_lesson_progress` (`ON DELETE CASCADE`, `004_learning.sql:45`) à **chaque édition de contenu**. Test dédié : la progression survit à une réécriture de leçon.
    - `getRequestScope` utilise `cache()` de **React** (mémoïsation *par requête*) et non une variable de module : celle-ci aurait survécu entre requêtes et **figé la première organisation**, cassant l'isolation au moment de la phase 4.
    - `T3.10` (« conserver `providers/firestore/` comme filet ») est **obsolète** : le couplage est intégralement retiré, il n'y a plus de filet à garder.
38. **Phase 3 (suite) — les cinq derniers providers** (T3.5→T3.9). Trois principes appliqués partout :
    - **Aucun canal indisponible n'est passé sous silence.** `NotificationProvider.dispatch` retourne `delivered` **et** `skipped` avec un motif ; le push (sans transport avant la Couche 2) est donc déclaré, jamais silencieusement ignoré. Même logique pour le message d'erreur de configuration S3, qui **nomme les variables d'environnement** manquantes et non les champs internes.
    - **Une opération multi-tables réussit ou échoue en bloc.** `withTransaction` (ajouté à `pool.ts`) porte l'ingestion d'un document et ses segments, ainsi que le débit de crédits et sa journalisation. Les lectures, elles, ne prennent **pas** de transaction : une instruction ne justifie pas de monopoliser une connexion.
    - **Ce qui est délicat est isolé et prouvé indépendamment.** La signature SigV4 est un module pur, confronté au **vecteur officiel AWS** `get-vanilla` ; le reste du transport S3 est vérifié structurellement, faute de bucket réel. La recherche vectorielle est vérifiée avec des **vecteurs fabriqués à la main**, ce qu'un vrai modèle d'embedding ne permettrait pas de prédire.
    - **Gate G3 non bloquant** : le repli documenté (SMTP générique) a été implémenté plutôt que d'attendre l'arbitrage. Le transport `memory` sert aux tests et au développement local. Le choix d'un fournisseur email reste ouvert **sans impact sur le code appelant**.
    - **Bug réel trouvé par les tests** : les noms d'en-têtes HTTP sont insensibles à la casse, mais l'accès aux propriétés JavaScript ne l'est pas — un appelant passant `Host` ou `X-Amz-Date` voyait ses en-têtes **ignorés de la signature** (valeur `undefined`). Normalisation en minuscules avant toute recherche.
39. **Phase 4 — socle d'authentification** (T4.1, provider de T4.2, crypto de T4.4, serveur de T4.8). Décisions et pièges :
    - **`jose` et non `jsonwebtoken`** : le middleware Next s'exécute en **Edge runtime**, où les API Node (`crypto`, `Buffer`) n'existent pas. `jose` s'appuie sur Web Crypto et sert donc le middleware **et** les route handlers avec un seul code de vérification.
    - **`bcryptjs` (JS pur) et non `bcrypt` natif** : aucune compilation, donc pas d'échec d'installation (antécédents de `node_modules` corrompu). **Coût mesuré sur ce projet** : 91 ms (10), 175 ms (11), **287 ms (12)** → coût 12 retenu.
    - **TOTP sans dépendance** : RFC 6238 est bien spécifié et publie des vecteurs de test, donc l'implémentation est **prouvée** (RFC 4226 annexe D + RFC 6238 annexe B) — même approche que SigV4.
    - **Rien de secret en clair** : mots de passe par bcrypt ; refresh tokens et jetons de réinitialisation par SHA-256. SHA-256 suffit ici (32 octets aléatoires, non devinables) : un KDF lent n'apporterait rien et ralentirait chaque requête.
    - **Non-énumération des comptes** : message **et type** identiques pour « email inconnu » et « mot de passe erroné » ; le mot de passe est vérifié **même si le compte est introuvable**, sinon le temps de réponse révélerait quels emails existent.
    - **Rotation + détection de réutilisation** : présenter un refresh token déjà révoqué révoque **toutes** les sessions de l'utilisateur. Corollaire contre-intuitif mais correct : le jeton de la session suivante déclenche alors lui aussi une détection de réutilisation, pas « jeton inconnu ».
    - **Limite bcrypt de 72 octets** : au-delà, l'entrée est **tronquée en silence**. La politique refuse donc explicitement, en comptant les **octets** et non les caractères (40 caractères accentués = 80 octets).
    - **Pièges d'infrastructure de test** : `jose` est ESM-only → à transformer dans **les deux** projets Jest (jsdom et DB) ; le test JWT tourne en **environnement Node** (jsdom n'a pas `crypto.subtle` et impose un realm où les `Uint8Array` échouent aux `instanceof` de `jose`) ; `JWT_SECRET` de test posé dans le setup DB.
    - **Migration 006** (et non un ajout à 002) : les migrations sont **forward-only**, on ne réécrit pas une migration déjà appliquée.
40. **Phase 4 — routes, cookies et middleware** (T4.2, T4.6, T4.7). Trois points à retenir :
    - **Deux cookies, pas un.** L'accès va partout (`path: /`) ; le refresh est **restreint à `/api/auth`** : il ne circule donc jamais sur une requête de page ordinaire. Les deux sont `httpOnly` (vol par XSS neutralisé), `secure` **en production seulement** (sinon le cookie ne serait jamais posé en HTTP local). Conséquence utile : le middleware **ne voit pas** le refresh token, une session expirée y est donc traitée comme une absence de session.
    - **Le middleware est un filtre, pas une frontière d'autorisation.** Il tourne en **Edge**, sans accès à la base : il vérifie le jeton d'accès (sans état) et rien d'autre. Le contrôle réel (rôle, appartenance à l'organisation) reste dans chaque route et server action. Ne pas s'appuyer sur le middleware pour de l'autorisation.
    - **Redirection ouverte** : `?redirect=` est une faille d'autant plus convaincante que l'utilisateur vient de saisir ses identifiants **sur le bon domaine**. Sont refusés : URL absolues, `//exemple` (relative au protocole), antislashs (normalisés en `/` par certains navigateurs), caractères de contrôle.
    - **Limitation de débit** : une tentative **refusée n'est pas enregistrée**, sinon un client qui insiste repousserait indéfiniment sa propre échéance. `RATE_LIMIT_MULTIPLIER` existe pour les tests et la CI (les tests E2E partagent une seule IP et atteindraient la limite d'inscription) et est **ignoré en production** — le désactiver silencieusement ouvrirait le bourrage d'identifiants.
    - **`JWT_SECRET` vit dans `.env.local`** (gitignoré, vérifié via `git check-ignore`). Il est **absent** de `.env.example` en valeur : le serveur de développement refuse de signer sans lui, avec un message qui donne la commande de génération.
    - **Pièges de test rencontrés** : `process.env.NODE_ENV` est en **lecture seule** dans les types de Next (passer par un cast) ; `headersArray()` de Playwright renvoie des objets `{name, value}`, **pas** des tuples.

---

## Portes de décision ouvertes

| Gate | Où | Décision | Repli |
|---|---|---|---|
| G1 | Avant phase 4 | Fournisseur SAML (recommandé : Google Workspace + Microsoft Entra ID) | SSO reporté en Couche 2 |
| G2 | Avant phase 25 | o2switch supporte-t-il Docker + PostgreSQL ? (**non vérifié**) | VPS Docker (Hetzner/OVH/Scaleway) ou dédié |
| G3 | Avant phase 4 | Fournisseur email (SMTP / Resend / SES) | SMTP générique via `nodemailer` |
| G4 | Avant phase 17/24 | Fournisseurs IA + tarifs crédits + tarifs Stripe | Mode test |
| G5 | Avant phase 20 | **RNQ Qualiopi** — décret **n° 2026-728** identifié (**33 indicateurs**, en vigueur 01/11/2026) ; reste à récupérer le **guide de lecture V10** | Guide V10 à obtenir |

---

## Bugs résolus et leurs fixes

- `node_modules` corrompu — installation interrompue, paquet `firebase` sans fichiers `.mjs` → `Cannot resolve 'firebase/app'` en Turbopack. Fix : suppression de `node_modules/firebase` + `npm install --legacy-peer-deps` (`node_modules/firebase/app/dist/index.mjs`).
- `npm run dev -- --turbopack` ignoré (npm traite le flag comme config) → ajout du script `dev:turbo` dans `package.json`.
- `EPERM .next\trace` + « Port 3000 in use » → **deux instances `next dev` simultanées**. Un seul serveur à la fois sur ce dossier.
- Firestore `7 PERMISSION_DENIED: requires billing` → le repli `src/data/*.json` (`src/lib/local-data.ts`) n'a plus lieu d'être : **le couplage Firestore est rompu** (phase 3). `local-data.ts` est désormais **du code mort**.
- `AuthContext.tsx:124` — `onAuthStateChanged` ignore les valeurs de retour → `unsubscribeSnapshot()` jamais appelé (**fuite de listener**). À corriger en phase 4.
- `src/lib/firebase.ts:18-29` — la config Firebase était loguée en clair (apiKey, projectId…) → **corrigé** (`ddcf893`), 5 `console.log` retirés, import `FirestoreSettings` inutilisé supprimé.
- `src/app/pricing/page.tsx` — `AlertDialogTrigger` utilisé (L122) mais non importé : la page **plantait** au rendu du bouton de rétrogradation → **corrigé** (`c229f89`).
- `src/components/tutorial/QuizView.tsx` — `useEffect` appelé après un `return` précoce : violation des règles des Hooks → **corrigé** (`c05a534`), valeurs dérivées et effet remontés avant le return (optional chaining).
- **10 suites de tests ne s'exécutaient pas** (`Cannot find module 'msw/node'`) — 3 causes chaînées : (1) `msw/node` exposé avec `browser:null` → `customExportConditions: ['']` ; (2) jsdom n'implémente pas `fetch` (`Response is not defined`) → `jest-fixed-jsdom` ; (3) `msw` et `firebase` en ESM → **remplacement** de `transformIgnorePatterns` (next/jest ignore tout `node_modules` et jest combine les motifs en OU : un simple ajout ne peut pas « dé-ignorer » un paquet) → **corrigé** (`9938292`). Résultat : 8/10 suites, 15 tests passent.
- `.env.example` masqué par la règle `.env*` du `.gitignore` → **corrigé** (`f46f1bb`), négation `!.env.example` ajoutée.
- **Rebase interactif bloqué** (96 commits, 14 rejoués, 18 fichiers en conflit) laissé par Firebase Studio → **`rebase --abort`**, branche `master` restaurée, travail récupéré via stash + sauvegarde temp. Voir « Pièges ».

### Blocages ouverts

- **Port PostgreSQL 5433, pas 5432** : le port 5432 est occupé par `masterplan365-postgres-1` (projet tiers). **Ne jamais pointer `DATABASE_URL` sur 5432** — on écrirait dans la base d'un autre projet.
- **Un « vert » de test n'est une preuve que si le test s'exécute réellement.** Les tests DB étaient passés à vide via un `return` gracieux : ils sont désormais **stricts** (base injoignable = échec). `SKIP_DB_IF_UNAVAILABLE=1` existe mais doit rester exceptionnel.
- **[mineur]** Avertissement Jest sur le projet DB : `worker process failed to exit gracefully` — fuite de handle à investiguer (n'affecte pas les résultats).
- **`src/queries/**` = code mort** : importé nulle part. Typé pour T0.2, à supprimer en phase 16.
- **Modules Firebase = code mort** depuis la phase 3 : `src/lib/firebase-admin.ts`, `src/lib/firebase.ts`, `src/lib/local-data.ts` n'ont **plus aucun consommateur** (vérifié). À supprimer en phase 16, avec les dépendances `firebase` / `firebase-admin` de `package.json`.
- **Le build Next n'est pas vérifié** : étape CI en report-only (script `npm run build` en syntaxe Windows `cmd`).
- **Divergence de branche** : `master` a 96+ commits locaux contre 1 sur `origin/master`. Aucun push effectué.

---

## Patterns et conventions confirmés

- `@/*` → `./src/*` (tsconfig + jest.config.mjs).
- Serveur : RSC + server actions ; client : server actions + React Query.
- shadcn/ui + Tailwind, variables CSS, base neutre. Charte cible : **1 seul accent (navy), fond blanc, neutres** — pas d'explosion de couleurs.
- Tests : Jest 29 + MSW + Testing Library, `src/tests/` miroir de `src/`. **jsdom uniquement → infra DB à créer.**
- Migrations : `.sql` numérotées, rejouables, réversibles.

---

## Pièges identifiés

- **Deux `next dev` simultanés = EPERM + conflit de port.** Toujours tuer l'instance avant d'en relancer une.
- ⚠️ **Un rebase interactif peut être laissé en plan par Firebase Studio.** Le dépôt a été trouvé à mi-rebase (96 commits, 14 rejoués). **Ne jamais commiter pendant un rebase**, et **`git rebase --abort` détruit les fichiers suivis modifiés** (les non suivis survivent). Toujours sauvegarder avant.
- ⚠️ **La branche `master` a divergé de `origin/master`** : 96 commits locaux contre 1 distant. Aucun push effectué. La divergence est probablement l'origine du rebase abandonné — à trancher avant tout `git push`.
- ⚠️ **OneDrive verrouille les fichiers** : `.git` et `node_modules` subissent des `Permission denied` lors des suppressions massives (`git stash -u`, `git clean`). Prévoir un backup avant toute opération destructrice.
- ⚠️ **`node_modules` a été corrompu par une installation interrompue** : 4 paquets identifiés avec des fichiers manquants (`firebase` sans `.mjs`, `framer-motion` et `html2canvas` sans aucun `.d.ts`, `msw` sans `SetupApi.d.mts`). **Réinstallation complète propre effectuée** (1996 paquets). En cas de symptôme bizarre (`Cannot resolve`, `TS7016`, type manquant), **soupçonner la corruption avant le code** et réinstaller.
- ⚠️ **Storybook était incohérent** : `@storybook/nextjs@10` avec tous les autres addons en `8.x` → peer deps contradictoires, et **le paquet cœur `storybook` n'était pas déclaré**. Aligné en 8 + cœur ajouté.
- ⚠️ **`@types/react` était en 18 alors que `react` est en 19** → inférence cassée. Corrigé.
- ⚠️ **`planId` vs `plan`** : le modèle utilisateur était incohérent (id `planId` dans le type et `AuthContext`, libellé `plan` dans les données et les pages admin). **Canonique : `planId`** (`free`/`premium`). Helper `planLabel()` dans `src/lib/users.ts` ; seed `users.json` normalisé.
- ⚠️ **react-markdown v9 ne fournit plus la prop `inline`** dans le composant `code`. Détecter un bloc par langue déclarée (`language-x`) ou présence d'un retour à la ligne.
- `npm run lint` était **interactif** (aucune config ESLint) → **résolu** (T0.1, commit `685213f`).
- **Typecheck : 64 → 0 erreur** (T0.2). Aucune erreur de typage connue à ce jour.
- `passport-saml` est **conçu pour Express** ; les route handlers Next ne sont pas un drop-in → **spike obligatoire avant G1**.
- **Aucune capacité email dans Katalyst** → `EmailProvider` requis en phase 3, sinon le reset de mot de passe (phase 4) est infaisable.
- Le JSON est à **2 niveaux** (cours → chapitre → leçon) ; le modèle cible en a **3** (+ semaine) → **ETL nécessaire** en phase 2.
- **Isolation multi-tenant** : une requête de provider sans `scope` = fuite de données entre organisations. Le scope est **obligatoire dans l'interface** (ne compile pas sans) ; `assertScope()` le rejette aussi à l'exécution. 10 tests d'isolation couvrent **la lecture et l'écriture** (T3.12, `e1b2de1`).

---

## Préférences utilisateur

- Réponses **concises**, en français.
- **Preuves avant affirmation** : pas de chiffre sans source.
- Ne jamais modifier `masterplan365` (lecture seule).
- L'utilisateur corrige et affine : ne pas inventer, demander si le silence est ambigu.
- Mode build : agir avec expertise, tracer le plan **avant** de toucher au code.

---

## Références

- Plan d'exécution : `@.kiro/specs/katalyst/tasks.md`
- Exigences : `@.kiro/specs/katalyst/requirements.md`
- Architecture : `@.kiro/specs/katalyst/design.md`
- Fin de phase : `@.kiro/workflows/phase-completion.md`
- Handoff : `@.kiro/hooks/session-handoff.md`
- Prochaine étape : `@.kiro/hooks/next-phase.md`
