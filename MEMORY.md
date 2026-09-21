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
| Dernière phase complétée | ✅ **Phase 0**, ✅ **Phase 0.5**, ✅ **Phase 1**, ✅ **Phase 2 — Schéma, migrations & seed** |
| Phase en cours | — |
| Prochaine phase | **Phase 3 — Providers (fin du couplage Firestore)** |
| Qualité | `typecheck` 0 · `lint` 0 · tests **10 suites / 37** · tests DB **7** · **E2E 5** |
| CI | bloquants : lint, typecheck, tests, check:version, gitleaks, tests DB, E2E · report-only : build |
| Base locale | PostgreSQL **pgvector/pgvector:pg16** sur le port **5433** — **26 tables**, contenu seedé, 12 comptes importés |

### Commandes base de données

```
npm run db:migrate          # applique les migrations (dev, port 5433)
npm run db:migrate:test     # applique les migrations sur katalyst_test
npm run db:seed             # rejoue src/data/*.json (idempotent)
npm run db:seed:test        # seed sur la base de test
npm run db:import-auth      # importe les comptes Firebase Auth (12)
```
| CI | bloquants : lint, typecheck, tests, check:version, gitleaks, tests DB · report-only : build |
| Base locale | PostgreSQL **pgvector/pgvector:pg16** sur le port **5433** (`katalyst`, `katalyst_test`) |
| Prochaine phase | Phase 0.5 — Walking Skeleton (`0.5` après clôture de la phase 0) |
| Stack actuelle | Next.js 15, React 19, TypeScript, Firestore (à remplacer) |
| Stack cible | Next.js 15 + PostgreSQL **multi-tenant** + JWT/Google OAuth + Stripe + SSE + **studio IA à crédits** + Capacitor |
| Plan | **29 phases** (0, 0.5, 1-27) — Couche 0 (fondations) · Couche 1 (migration) · Couche 2 (socle transverse : i18n, API, sécurité) · Couche 3 (produit REWORK + conformité + autonomie) |

---

## Décisions architecturales clés

1. **Backend natif Next** — Postgres accédé côté serveur (RSC, server actions, route handlers). Pas de backend Express séparé.
2. **PostgreSQL auto-hébergé**, agnostique. Voir `adr/0001-choix-postgresql.md`.
3. **Auth : JWT + bcrypt + Google OAuth + refresh tokens + MFA/TOTP + SSO SAML**, remplaçant Firebase Auth. Voir `adr/0002-auth-jwt-remplace-firebase.md`.
4. **Modèle de formation de référence** : profondeur du cours GitHub (11 chapitres, 37 leçons, seul cours avec quiz) + **100 % de leçons interactives**. Voir `adr/0003-modele-formation-reference.md`.
5. **Hiérarchie pédagogique = Semaine / Jour** : `S.1.J.2` (S = semaine de formation, J = jour). Un chapitre se termine sur une semaine (lundi→vendredi). **PAS de « semestre »** — correction explicite de l'utilisateur.
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
- Firestore `7 PERMISSION_DENIED: requires billing` → repli `src/data/*.json` (`src/lib/local-data.ts`), temporaire jusqu'à la phase 7.
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
- **Isolation multi-tenant** : une requête de provider sans `scope` = fuite de données entre organisations. Le scope est **obligatoire dans l'interface** (ne compile pas sans) + tests d'isolation dédiés (T3.11).

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
