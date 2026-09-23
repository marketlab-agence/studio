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
| Dernière phase complétée | ✅ **Phases 0 à 5** · ✅ **Phase 4 — Authentification** (code complet : T4.1-T4.14, SAML inclus) |
| Phase en cours | ✅ **Phase 7 — Purge Firebase & nettoyage E2E terminée** : couplage Firebase **supprimé** (5 fichiers, 2 paquets) · nettoyage E2E **automatique avant/après** · base de dev **678 → 2 organisations** |
| 🔴 **DÉCISION ATTENDUE** | **Phase 7bis — cible de déploiement.** Artefacts Firebase **conservés volontairement** : `firebase.json`, `.firebaserc`, `apphosting.yaml`, `firestore.rules`, `.idx/`. Les retirer change la façon dont l'app se déploie. À trancher avec la phase 25 (déploiement portable). **Autre suivi ouvert** : révoquer la clé de service account dans la console Firebase (retirer la variable d'environnement ne l'invalide pas). |
| Prochaine phase | **Phase 8 — Internationalisation & transatlantique** (voir `adr/0008`) |
| Qualité | `typecheck` 0 · `lint` 0 · tests **27 suites / 275** · tests DB **16 suites / 185** · **E2E 76** |
| **Conformité — progrès mesuré** | **6/6 formations conformes** · `R2` : 142 constats → **0** · `R3` : 80 niveaux déclarés · `R6` : conforme · `R5.1` : 6/6 · `PLACEHOLDER_COMPONENTS` : **vide** |
| **Documentation** | `@docs/rework/` (3 f.) et `@docs/katalyst/` (4 f. dont `conformite-rnq-v10.md`, `regles-conformite.md`, `primitives-pedagogiques.md`) |
| CI | bloquants : lint, typecheck, tests, check:version, gitleaks, tests DB, E2E · report-only : build |
| Base locale | PostgreSQL **pgvector/pgvector:pg16** sur le port **5433** — **27 tables**, contenu seedé, 11 comptes importés |
| ✅ **Accès rétabli (2026-09-23)** | Mot de passe défini pour le Super Admin via `npm run db:set-password`. **La connexion Google fonctionne** — confirmé par l'utilisateur, **T4.3 validée**. |
| **Couplage Firestore** | ✅ **ROMPU** : `firebase-admin.ts`, `firebase.ts` et `local-data.ts` n'ont **plus aucun consommateur** dans `src/` |
| **Providers (10)** | ✅ Content, User, Settings, AI crédits, Document, Notification, Email, Storage, **Auth** — **9 implémentés**. Reste `PaymentProvider` (phase 24) |

### Commandes base de données

```
npm run db:migrate          # applique les migrations (dev, port 5433)
npm run db:migrate:test     # applique les migrations sur katalyst_test
npm run db:seed             # rejoue src/data/*.json (idempotent)
npm run db:seed:test        # seed sur la base de test
```
| Stack actuelle | Next.js 15, React 19, TypeScript, **PostgreSQL** (Firestore dé-couplé) |
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
13. **Aucune facturation GCP.** Contenu depuis `src/data/*.json`. Les **11 comptes** sont importés ; les **10 comptes email → reset forcé** (mots de passe non exportables).
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
30. *(décisions 30 à 45 archivées — voir `@memory/decisions-architecturales.md`)*

    ⚠️ **Elles restent valides et opposables** : tarification, registre des composants,
    schémas Zod, correction utilisateur sur « S » et « J », accès par période, arbitrages
    de la phase 3, socle d'authentification, MFA, Google OAuth, autorisation par rôle.
    Déplacées le 2026-09-23 pour respecter la règle des 200 lignes.

31. 🟢 **Phase 6 — conformité du contenu** (décret 2026-728 obtenu, gate G5 levé). **12 primitives génériques** (≥ 2 par niveau de Bloom), **13 placeholders Git reconfigurés** (`PLACEHOLDER_COMPONENTS` **vide**), **journal d'interaction** (`lesson_interactions`) rendant l'indicateur 19 opposable. Points durables :
    - **Les 13 placeholders étaient TOUS des simulateurs Git.** Le catalogue avait été construit autour d'**une seule formation** : aucune formation de vente, marketing, IA ou gestion de projet n'avait de composant interactif. C'est ce déséquilibre — non le nombre — qui était le vrai problème.
    - **Un composant admissible est pertinent pour ≥ 3 formations, sans modification de code.** Sinon c'est un contenu, pas un composant. Règle issue de la source REWORK : *« adapter le sujet, garder la structure »*.
    - **La 3ᵉ contrainte (trace auditable) est éliminatoire.** Un composant pédagogiquement excellent mais sans trace rend l'organisme **non conforme** (indicateur 19). Sur un LMS distanciel, « pertinent » ne suffit pas.
    - **`NULL` signifie « à compléter », jamais « aucun ».** Les 80 leçons existantes n'ont pas de `bloom_level` : leur en affecter un par défaut aurait été **inventer une donnée pédagogique**. Aucune migration ne peut le faire — seul le contenu le peut.
    - **Une erreur affichée vaut mieux qu'une erreur effacée.** Toutes les primitives conservent les erreurs de l'apprenant : elles montrent *où* il bloque, information la plus utile à l'encadrant.
    - **Déclarer une primitive sans l'ajouter aux tables domaines/Bloom la rend invisible.** `StepByStepRunner` a échoué **deux fois** ainsi ; seule la vérification automatisée de couverture l'a détecté. **Un test par exigence, pas par composant.**
    - **Progrès mesuré** : `R5.1` (appropriation) **0/6 → 6/6**. Bilan global **0/6** à cause de `R2` (142 constats d'objectifs) — du **contenu**, pas du code.

---

## Portes de décision ouvertes

| Gate | Où | Décision | Repli |
|---|---|---|---|
| G1 | Avant phase 4 | Fournisseur SAML (recommandé : Google Workspace + Microsoft Entra ID) | SSO reporté en Couche 2 |
| G2 | Avant phase 25 | o2switch supporte-t-il Docker + PostgreSQL ? (**non vérifié**) | VPS Docker (Hetzner/OVH/Scaleway) ou dédié |
| G3 | Avant phase 4 | Fournisseur email (SMTP / Resend / SES) | SMTP générique via `nodemailer` |
| G4 | Avant phase 17/24 | Fournisseurs IA + tarifs crédits + tarifs Stripe | Mode test |
| G5 | ~~Avant phase 20~~ | ✅ **LEVÉ (2026-09-23)** — décret **n° 2026-728** obtenu (texte intégral), consigné dans `@docs/katalyst/conformite-rnq-v10.md`. Reste à obtenir : le **guide de lecture V10** (ajuste les preuves, pas les exigences). | — |

---

## Incidents, pièges et blocages

> Déplacés dans `@memory/incidents-et-pieges.md` : ils expliquent des symptômes
> qu'on risque de rencontrer à nouveau, mais ne concernent pas l'état courant.
> Contenu : bugs résolus, blocages ouverts, pièges identifiés (Next, Jest,
> Playwright, Firebase, dépendances).

---

## Patterns et conventions confirmés

- `@/*` → `./src/*` (tsconfig + jest.config.mjs).
- Serveur : RSC + server actions ; client : server actions + React Query.
- shadcn/ui + Tailwind, variables CSS, base neutre. Charte cible : **1 seul accent (navy), fond blanc, neutres** — pas d'explosion de couleurs.
- Tests : Jest 29 + MSW + Testing Library, `src/tests/` miroir de `src/`. **jsdom uniquement → infra DB à créer.**
- Migrations : `.sql` numérotées, rejouables, réversibles.

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
- **Conformité RNQ V10** : `@docs/katalyst/conformite-rnq-v10.md` (décret 2026-728 intégral)
- **Méthode REWORK** : `@docs/rework/methodes.md` · `@docs/rework/formats.md` · `@docs/rework/exercices.md`
- **Cas de référence** : `@docs/katalyst/cas-client-immotech.md`
- Décisions 30-45 (archivées) : `@memory/decisions-architecturales.md`
- Incidents et pièges (archivés) : `@memory/incidents-et-pieges.md`
- Fin de phase : `@.kiro/workflows/phase-completion.md`
- Handoff : `@.kiro/hooks/session-handoff.md`
- Prochaine étape : `@.kiro/hooks/next-phase.md`
