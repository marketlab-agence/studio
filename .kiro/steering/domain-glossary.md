# Steering — Glossaire métier Katalyst

> Vocabulaire de référence. Toute divergence entre le code et ce glossaire est un bug de nommage.

## Structure pédagogique

| Terme | Définition | Convention |
|---|---|---|
| **Formation** | Ensemble pédagogique complet sur un outil (ex. « Git & GitHub : Le Guide Complet »). | `Course` en code |
| **Regroupement** | Bloc visuel **facultatif** rassemblant des chapitres (ex. « Semaine 1 », « Module A »). L'intitulé est **libre** et décidé par le formateur. | `Week` en code (table `weeks`) |
| **Chapitre** | Section contenant des leçons et un quiz. Peut être rattaché à un regroupement, ou directement à la formation. | `Chapter` en code |
| **Leçon** | Plus petite unité d'apprentissage, typée. **Peut couvrir plusieurs jours.** | `Lesson` en code |

> ⚠️ **« S » (semaine) et « J » (jour) sont des LIBELLÉS, pas des données.**
> Le formateur écrit ce qu'il veut dans les intitulés — il peut y mettre « S1.J2 ».
> **Aucune colonne ne porte de code `S.n.J.m`**, et il n'existe **aucune règle**
> « 1 leçon = 1 jour » ni « 5 chapitres par semaine » : **une leçon peut durer
> plusieurs jours**. Ne jamais dériver de numérotation depuis la position.
>
> ⚠️ **Ne jamais utiliser « semestre »** (correction explicite de l'utilisateur).

**Ce qui structure le rythme** : les **règles d'accès** (`unlock_rules`),
applicables à la formation, au chapitre ou à la leçon — ouverture à une date,
échéance, cadence (`DAY`/`WEEK`/`MONTH`/`CUSTOM`) ou condition (`COMPLETION`,
`QUIZ_PASSED`). Voir `@.kiro/specs/katalyst/design.md` §3.1 et §12.

## Types de leçon

| Type | Rôle |
|---|---|
| `VIDEO` | Vidéo (lien YouTube, Vevo, ou média hébergé) |
| `CAPSULE` | Contenu court de connaissance (texte, image, média) |
| `MISE_EN_PRATIQUE` | Pratique guidée (simulateur interactif) |
| `EVALUATION` | Quiz / évaluation |
| `TEXTE` | Leçon textuelle (markdown) |
| `IMAGE` | Leçon illustrée |
| `MEDIA` | Audio / fichier |
| `LIEN` | Ressource externe |

## Interactivité et composants

> Depuis la phase 8bis (voir `adr/0013`), une leçon porte **N composants ordonnés**
> (table `lesson_components`, clé de substitution `UUID`). Les anciens champs
> `interactiveComponentName` / `visualComponentName` **n'existent plus**.

| Terme | Définition |
|---|---|
| **Composant interactif** | Simulateur manipulable par l'apprenant. **Produit une trace** (indicateur 19). Cible ≥ 2 par leçon quand c'est pertinent — **plancher non bloquant : 0 est autorisé** (une leçon notionnelle peut n'avoir aucun exercice in-app). |
| **Composant visuel** | Diagramme/visualisation **non manipulable**, **illustratif**. **Aucune obligation de niveau Bloom** et **aucune trace** exigée (le décret ne les mentionne pas). |
| **`kind`** | Attribut du **catalogue** (`interactive` \| `visual`), à sens réglementaire : il détermine **qui doit produire une trace**. Plus stocké sur la leçon. |
| **`config`** | `{ labels, data }` d'une **instance** de composant. Les **libellés sont des données** (jamais traduits) ; `{}` rend le composant comme avant, par défaut. |
| **Registre** | `src/components/registry/` — source unique des composants : `catalog.ts` (métadonnées + schémas Zod, **sans import React**) et `index.ts` (liaison au rendu). Alimente l'UI, l'IA et l'outil de création. |

## Déblocage et progression

| Terme | Définition |
|---|---|
| **Drip** | Libération progressive du contenu. |
| **Déblocage par date** | Une leçon s'ouvre à une date donnée (badge type « 5 août »). |
| **Déblocage conditionnel** | Une leçon s'ouvre si une condition est remplie (chapitre précédent terminé, quiz réussi). |
| **États de leçon** | ✅ terminé · ▶ en cours (débloqué) · 🔒 verrouillé |
| **Progression** | Avancement d'un apprenant, par leçon / chapitre / semaine / formation. |

## Engagement

| Terme | Définition |
|---|---|
| **Points** | Récompense attribuée par activité (ex. 20 pts par leçon, quiz). Stockés dans un **ledger**, jamais un simple compteur. |
| **Récapitulatif par type** | Agrégat de complétion par type de leçon (ex. `Vidéo 8/8`, `Capsule 27/27`). |
| **Effet de fin** | Animation/écran de félicitation à la fin d'une leçon ou d'un chapitre. |

## Social

| Terme | Définition |
|---|---|
| **Cohorte** | Groupe d'apprenants créé par l'admin (ex. `IAFORMATEUR_20260803G1`). Un apprenant peut appartenir à **plusieurs** cohortes. |
| **Messagerie** | Chat formateur ↔ apprenants, par cohorte, avec compteur de non-lus. |

## Technique

| Terme | Définition |
|---|---|
| **Provider** | Implémentation interchangeable derrière une interface (`ContentProvider`, `AuthProvider`, `EmailProvider`, `StorageProvider`, `PaymentProvider`…). |
| **Walking skeleton** | Tranche verticale minimale validant toute la pile avant la migration de masse. |
| **Strangler Fig** | Migration progressive : l'ancien et le nouveau coexistent, bascule par domaine. |
| **ADR** | Architecture Decision Record — décision tracée avec contexte et conséquences. |
| **Gate** | Porte de décision à lever avant une phase donnée. |

## Organisation et autonomie

| Terme | Définition |
|---|---|
| **Organisation** | Espace autonome (institut, académie, formateur indépendant) avec ses membres, ses formations et sa marque. Voir `adr/0007`. |
| **Propriétaire** | Rôle gérant son organisation : facturation, marque, membres, formations. |
| **Super Admin** | Rôle d'exploitation de la plateforme (toutes organisations). |
| **Scope** | `OrgScope` — contexte obligatoire de toute requête d'un provider (`organizationId`, `userId`, `role`). Sans scope, une méthode ne compile pas. |
| **Autonomie** | Capacité d'un formateur/institut à créer son espace, inviter, créer, publier et acheter **sans intervention du propriétaire de la plateforme**. |

## Méthodologie REWORK

> Référentiel complet : `@.kiro/steering/rework-methodology.md`

| Terme | Définition |
|---|---|
| **CPA²** | Concevoir (~60 %) → Produire (~30 %) → Animer → Analyser. Cadre structurant de toute production pédagogique. |
| **ACTIF** | Structure d'un prompt : **A**ction, **C**ontexte, **T**onalité, **I**dentité, **F**ormat. |
| **Identimètre** | Analyse du public en 5 piliers (personnel, professionnel, niveau, attentes, freins). |
| **Bloom** | Taxonomie à 6 niveaux (Connaître → Créer) pour formuler les objectifs pédagogiques. |
| **QQOQCCP** | Analyse de la demande en 7 axes (Quoi, Qui, Où, Quand, Comment, Combien, Pourquoi). |
| **SAVI** | Gestion d'une animation difficile : Sécuriser, Agir, Valoriser, Impliquer. |
| **Déroulé 6 colonnes** | Document fil rouge : objectifs, modalités, méthodes, activités, matériel, durée. |
| **Fiche programme** | Canevas commercial en 17 rubriques. |
| **Gate pédagogique** | Aval obligatoire entre deux phases du pipeline de création — aucun saut possible. |
| **[À COMPLÉTER]** | Marqueur d'une donnée non fournie. **Jamais inventée.** |
| **TTT / TTI / TTS / STT / TTV** | Familles IA : texte→texte, texte→image, texte→voix, voix→texte, texte→vidéo. |
| **Crédits IA** | Solde consommable par les formateurs pour la génération (porté par l'organisation). |

## Conformité

| Terme | Définition |
|---|---|
| **Qualiopi** | Certification qualité obligatoire des organismes de formation français (7 critères / 32 indicateurs). ⚠️ Référentiel officiel non encore obtenu — gate **G5**. |
| **C.1-C.8** | Référentiel France Compétences « Exercer la mission de formateur en entreprise » (RS7379). |
| **Dossier de preuves** | Export, par formation, des éléments démontrant la conformité (analyse de demande, objectifs, déroulé, évaluations, bilan). |

## Internationalisation

| Terme | Définition |
|---|---|
| **Locale** | Langue + conventions régionales. Supportées : **FR et EN (obligatoires)**, ES (optionnel). |
| **Clé de traduction** | Identifiant d'une chaîne dans le catalogue. Aucune chaîne en dur dans les composants. |
| **Lint i18n** | Vérification bloquante : une clé absente d'une langue obligatoire fait échouer le build. |
| **Contenu multilingue** | Le contenu pédagogique (formations, leçons) porte sa locale — ce n'est pas une colonne texte unique. |
| **Transatlantique** | Utilisable hors de France et hors du français (FR + EN). |

## API et sécurité

| Terme | Définition |
|---|---|
| **API centrale** | Surface unique versionnée `/api/v1/*` par laquelle passe toute donnée destinée à un client. |
| **Chaîne obligatoire** | auth → scope → autorisation → validation Zod → handler. Aucune route ne la contourne. |
| **BOLA** | Broken Object Level Authorization — vulnérabilité n°1 des API (OWASP API Top 10) ; contrée par le `OrgScope`. |
| **Journal d'audit** | Trace des actions sensibles : qui, quoi, quand, depuis où. |
| **En-têtes de sécurité** | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy. |
| **SAQ A** | Périmètre PCI minimal, atteint grâce au checkout **hébergé** Stripe. |

## IA — risque et sécurité

| Terme | Définition |
|---|---|
| **Injection de prompt** | Contenu traité comme une *donnée* et interprété par le modèle comme une *instruction*. Risque n°1 (OWASP LLM01). |
| **Donnée inerte** | Principe : le contenu importé n'est jamais exécuté comme instruction. |
| **Hiérarchie d'instructions** | Priorité : système > utilisateur > contenu fourni. |
| **Validation de sortie** | Toute sortie IA est validée par un schéma Zod ; non conforme → rejetée (OWASP LLM02). |
| **Liste blanche d'outils** | Les outils IA sont limités et scopés au `OrgScope` (OWASP LLM06). |
| **Provenance** | Marquage du contenu généré par IA + traçabilité des documents sources (AI Act). |

## Base documentaire

| Terme | Définition |
|---|---|
| **Content prompting** | Modèle d'échange REWORK : fournir un contenu (PDF, texte, vidéo) comme base de génération. |
| **Héritage documentaire** | Leçon > chapitre > formation : le document le plus spécifique prime. |
| **Segment** | Portion de document indexée et vectorisée. Seuls les segments pertinents entrent dans le prompt. |
| **pgvector** | Extension PostgreSQL open-source pour la recherche vectorielle. Aucune base externe requise. |
| **Traçabilité des sources** | `source_document_ids` enregistrés par génération → « d'où vient ce contenu ? ». |

## Normes

| Terme | Définition |
|---|---|
| **OWASP ASVS** | Référentiel de vérification de sécurité applicative. |
| **OWASP Top 10 / API Top 10** | Vulnérabilités web et API les plus courantes. |
| **OWASP LLM Top 10** | Vulnérabilités des applications LLM (LLM01 injection, LLM02 sortie non sécurisée, LLM06 fuite). |
| **WCAG 2.2 AA** | Standard d'accessibilité — exigé par Qualiopi (C.1/C.3/C.4) et la loi. |
| **SOC 2** | Référentiel d'audit (Security, Availability, Confidentiality, Processing Integrity, Privacy). |
| **NIS2** | Directive UE 2022/2555 — risque, chaîne d'approvisionnement, incidents, continuité. |
| **AI Act** | Règlement UE sur l'IA : niveaux de risque, transparence du contenu généré. |
| **NIST AI RMF** | Cadre de gestion du risque IA (gouverner, cartographier, mesurer, gérer). |
