# Spec — Design technique Katalyst

> Document d'architecture de référence. Toute implémentation qui s'en écarte doit être justifiée par un ADR.

---

## 1. Vue d'ensemble

```
Next.js 15 (App Router) — un seul déployable
├─ Server Components ......... lecture (via providers)
├─ Server Actions ............ mutations (via providers)
├─ Route Handlers ............ API + SSE + webhooks
└─ Client Components ......... UI, hooks, EventSource
         │
         ▼
   Couche Providers  (interfaces)
         │
         ├─ PostgresContentProvider / UserProvider / SettingsProvider
         ├─ JwtAuthProvider
         ├─ SmtpEmailProvider
         ├─ LocalStorageProvider / S3StorageProvider
         └─ StripePaymentProvider
         │
         ▼
   PostgreSQL (Docker, portable)
```

**Décision** : backend **natif Next** (ADR implicite — voir `MEMORY.md` §Décisions 1). Aucun service Express séparé.

---

## 2. Couche providers (zero vendor lock-in)

Chaque dépendance externe est derrière une interface, sélectionnée par variable d'environnement.

```ts
// src/lib/providers/index.ts
export interface ContentProvider {
  listCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | null>;
  listWeeks(courseId: string): Promise<Week[]>;
  listChapters(weekId: string): Promise<Chapter[]>;
  listLessons(chapterId: string): Promise<Lesson[]>;
  // …mutations
}

export interface AuthProvider {
  register(email: string, password: string, name: string): Promise<User>;
  login(email: string, password: string): Promise<Session>;
  loginWithGoogle(code: string): Promise<Session>;
  refresh(refreshToken: string): Promise<Session>;
  logout(sessionId: string): Promise<void>;
}

export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

export interface StorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

export interface PaymentProvider {
  createCheckoutSession(planId: string, userId: string): Promise<string>;
  handleWebhook(payload: unknown, signature: string): Promise<void>;
}
```

| Variable | Valeurs | Défaut |
|---|---|---|
| `DATA_PROVIDER` | `postgres` \| `local` | `postgres` |
| `AUTH_PROVIDER` | `jwt` | `jwt` |
| `EMAIL_PROVIDER` | `smtp` \| `resend` | `smtp` |
| `STORAGE_PROVIDER` | `local` \| `s3` | `local` |
| `PAYMENT_PROVIDER` | `stripe` | `stripe` |

**Règle** : aucun type de fournisseur ne remonte dans `src/types/` ni dans un composant.

---

## 3. Modèle de données

### 3.1 Hiérarchie pédagogique

```
courses
 └─ weeks            (S — semaine de formation)
     └─ chapters     (numéroté S.n.J.m)
         ├─ lessons  (typées, datées, pointées)
         └─ quizzes
```

**Numérotation** : `S.1.J.2` = Semaine 1, Jour 2. Un chapitre se termine sur **une semaine (lundi→vendredi)**.

### 3.2 Schéma (extrait)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Super Admin','Admin','Modérateur','Utilisateur')),
  password_hash TEXT,                    -- NULL pour comptes OAuth
  must_reset_password BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  avatar_url TEXT,
  plan_id TEXT REFERENCES plans(id),
  status TEXT DEFAULT 'Actif',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('Brouillon','Plan','Publié')),
  plan JSONB,               -- CreateCourseOutput (traçabilité IA)
  generation_params JSONB,  -- CreateCourseInput
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,               -- 'S1', 'S2'
  title TEXT,
  position INT NOT NULL
);

CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  code TEXT NOT NULL,               -- 'S.1.J.2'
  title TEXT NOT NULL,
  position INT NOT NULL,
  unlock_rule_id UUID REFERENCES unlock_rules(id)
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  code TEXT,                        -- 'S.1.J.2.1'
  title TEXT NOT NULL,
  objective TEXT,
  content TEXT,                     -- markdown
  type TEXT NOT NULL CHECK (type IN
    ('VIDEO','CAPSULE','MISE_EN_PRATIQUE','EVALUATION','TEXTE','IMAGE','MEDIA','LIEN')),
  duration_minutes INT,
  points INT DEFAULT 0,
  media_ref JSONB,                  -- {provider:'youtube'|'vevo'|'image'|'audio'|'file', url, ...}
  interactive_component_name TEXT,  -- ← depuis registry.ts
  visual_component_name TEXT,       -- ← depuis registry.ts
  position INT NOT NULL
);

CREATE TABLE unlock_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('DATE','COMPLETION','QUIZ_PASSED')),
  release_at TIMESTAMPTZ,           -- pour DATE (badge « 5 août »)
  depends_on_chapter_id UUID REFERENCES chapters(id),  -- pour COMPLETION
  min_score INT                      -- pour QUIZ_PASSED
);

CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,        -- 'LESSON' | 'QUIZ' | 'CHAPTER'
  source_id UUID NOT NULL,
  points INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, source_type, source_id)   -- ← garantit « une seule fois »
);

CREATE TABLE user_lesson_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,               -- 'IAFORMATEUR_20260803G1'
  course_id TEXT REFERENCES courses(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cohort_members (
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cohort_id, user_id)   -- ← multi-cohortes autorisé
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  body TEXT,
  attachment_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
```

**Invariant clé** : `points_ledger` a une contrainte `UNIQUE (user_id, source_type, source_id)` → **l'idempotence de l'attribution des points est garantie par la base**, pas par le code.

### 3.3 Conversion 2 → 3 niveaux (ETL)

Le JSON actuel : `courses[].id` ↔ `tutorials[].courseId`, chaque tutorial = 1 chapitre avec `lessons[]`.
Cible : insérer une **semaine par défaut** (`S1`) entre la formation et les chapitres, et **dériver le code S/J** depuis la position.

```
courses[i]        → courses
tutorials[courseId]  → chapters (rattachés à une week S1 générée)
tutorial.lessons[]   → lessons
quizzes[id]          → quizzes + questions + answers
```

Le mapping est **validé** : le seed échoue si le nombre de chapitres/leçons ne correspond pas au JSON source.

---

## 4. Authentification

Calqué sur masterplan365 (voir `adr/0002-auth-jwt-remplace-firebase.md`) :

- **Mots de passe** : `bcrypt`.
- **Session** : JWT d'accès (court) + **refresh token** en base (rotation, révocable) — cookie **httpOnly**.
- **Google OAuth** : `GET /api/auth/google` → redirection ; `GET /api/auth/google/callback` → échange de code, liaison par email.
- **MFA/TOTP** : `setup` / `verify` / `challenge` / `status`.
- **SSO SAML** : ⚠️ **`passport-saml` est conçu pour Express** — spike obligatoire avant la phase 4 (gate **G1**). Repli : `@node-saml/node-saml` appelé directement dans un route handler.
- **Reset forcé** : les 10 comptes importés ont `must_reset_password = true` → redirigés vers `forgot-password` au premier login. Les 2 comptes Google se connectent directement.
- **Rate limiting** par endpoint + validation **Zod**.
- **Protection des routes** : middleware Next.

---

## 5. Expérience d'apprentissage

### Types de leçon et rendu

| Type | Rendu | Accessibilité requise |
|---|---|---|
| `VIDEO` | Lecteur intégré (YouTube/Vevo) via `mediaRef` | Sous-titres |
| `AUDIO` | Lecteur audio + téléchargement | **Transcription** |
| `CAPSULE` | Contenu court (markdown + image) | — |
| `MISE_EN_PRATIQUE` | Composant interactif du registre | — |
| `EVALUATION` | Quiz | — |
| `TEXTE` | Markdown | — |
| `IMAGE` | Image + légende | **Texte alternatif** |
| `MEDIA` | Fichier téléchargeable | Format alternatif |
| `LIEN` | Ressource externe | — |

> **L'audio est un contenu de première classe** (REQ-LRN-02), au même titre que le texte, la vidéo et l'image.
> **Tout média porte ses métadonnées d'accessibilité** (REQ-LRN-07) — exigence C.3 du référentiel France Compétences.

### Déblocage

Évalué **côté serveur** (REQ-UNL-04). Trois états : ✅ terminé · ▶ débloqué · 🔒 verrouillé.
Deux mécanismes : **date** (`release_at`, badge « 5 août ») et **condition** (`COMPLETION`, `QUIZ_PASSED`).

### Gamification

- Points par activité → `points_ledger` (idempotent par contrainte SQL).
- **Écran de fin de leçon** : « Félicitations ! / Bien joué, vous avez réussi cette activité ! / Vous avez gagné ⭐ N points / Continuer → ».
- Récapitulatif par type : `Vidéo 8/8`, `Capsule 27/27`, `Mise en pratique 5/5`, `Évaluation 1/1`.

---

## 6. Cohortes et messagerie (SSE)

- Cohorte créée par l'admin, un apprenant peut en avoir **plusieurs**.
- Chat par cohorte, temps réel via **SSE** (`EventSource`) : voir `adr/0004-temps-reel-sse.md`.
- Route handler `GET /api/messages/stream?cohortId=…` (SSE) + `POST /api/messages`.
- Compteur de non-lus (badge type « 9 »).
- ⚠️ **Spike requis** : `EventSource` en WebView Capacitor.

---

## 7. Registre de composants

```ts
// src/components/registry.ts
export type ComponentKind = 'interactive' | 'visual';
export interface RegistryEntry {
  name: string;
  kind: ComponentKind;
  description: string;   // ← injectée dans le prompt IA
  component: React.ComponentType<any>;
}
export const REGISTRY: Record<string, RegistryEntry> = { /* 37 entrées */ };
export const listByKind = (kind: ComponentKind) => Object.values(REGISTRY).filter(e => e.kind === kind);
```

Consommé par : `LessonView` (rendu), `suggest-lesson-components-flow` (liste IA), l'outil de création (validation).

---

## 8. Stratégie de test

| Niveau | Environnement | Périmètre |
|---|---|---|
| Unitaire | `jsdom` | Logique pure, hooks, utils, composants |
| Intégration | `node` | Providers + Postgres (`katalyst_test`) |
| E2E | navigateur | Parcours critiques (login, leçon, quiz, paiement) |

**Infrastructure à créer** (phase 0/2) : 2ᵉ projet Jest `node`, base `katalyst_test`, migrations appliquées avant les tests, isolation par transaction.

---

## 9. Migration (Strangler Fig)

Pendant les phases 3-7, l'ancien et le nouveau **coexistent** :

1. `providers/firestore/` conservé comme filet.
2. Bascule **par domaine** via `DATA_PROVIDER` (contenu d'abord, puis utilisateurs).
3. Chaque domaine basculé est vérifié avant le suivant.
4. `providers/firestore/` supprimé en phase 7.

**Pas de big-bang.** Un domaine qui casse ne casse pas tout.

---

## 10. Walking skeleton (phase 0.5)

Tranche verticale minimale, avant toute migration de masse :

```
Docker Postgres → pool singleton → SettingsProvider (1 méthode)
   → 1 page RSC qui lit → 1 route handler → 1 test node vert → CI verte
```

Valide : Next + Postgres + pooling sous HMR + CI + pattern provider + infra de test.
**Si le squelette ne tient pas, aucune phase suivante ne tiendra.**

---

## 11. Environnements, secrets, rollback

| Environnement | Base | Secrets |
|---|---|---|
| `dev` | Docker local | `.env.local` |
| `staging` | Postgres dédié | coffre |
| `prod` | Postgres dédié + sauvegardes | coffre |

- **Rollback** : chaque migration réversible ; **dump avant migration** ; procédure dans `@.kiro/workflows/phase-completion.md`.
- **Secrets** : jamais versionnés, jamais côté client, jamais logués.

---

## 12. Déblocage configurable

La cadence est **définie par l'auteur de la formation**, pas figée par la plateforme.

```sql
CREATE TABLE unlock_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('DATE','COMPLETION','QUIZ_PASSED')),
  cadence TEXT CHECK (cadence IN ('DAY','WEEK','MONTH','CUSTOM')),  -- granularité
  release_at TIMESTAMPTZ,                       -- DATE : badge « 5 août »
  due_at TIMESTAMPTZ,                           -- échéance de fin (REQ-UNL-06)
  depends_on_chapter_id UUID REFERENCES chapters(id),
  min_score INT
);
```

| Cadence | Effet |
|---|---|
| `DAY` | 1 chapitre débloqué par jour |
| `WEEK` | 1 chapitre par semaine (lundi→vendredi) — **modèle REWORK par défaut** |
| `MONTH` | 1 chapitre par mois |
| `CUSTOM` | Dates explicites par chapitre/leçon |

**Évaluation côté serveur** (REQ-UNL-04) : aucun contournement client possible.
**Échéance** (REQ-UNL-06) : chaque chapitre/leçon/quiz peut avoir une période limite, ce qui alimente les rappels (phase 12).

---

## 13. Notifications

| Événement | Déclencheur | Canal |
|---|---|---|
| **Ouverture** | Un chapitre/leçon devient accessible | in-app + email |
| **Accès** | Rappel de disponibilité | in-app |
| **Inactivité** | Contenu non entamé avant l'échéance | email (+ push) |
| **Échéance** | Fin de période approche | email (+ push) |

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  in_app BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT true,
  push BOOLEAN DEFAULT false
);
```

**Implémentation** : `NotificationProvider` (phase 3) + **planificateur interne** (tâche récurrente évaluant les règles) — ⚠️ spike : pas de cron externe (contrainte d'agnosticité).

---

## 14. Studio de génération IA & crédits

Les formateurs génèrent du contenu **dans l'application**, en consommant des **crédits IA** achetés.

### Familles couvertes (REQ-AIC-02)

| Famille | Usage dans Katalyst |
|---|---|
| **TTT** | Cours, contenus, quiz |
| **TTI** | Visuels, illustrations de leçon |
| **TTS** | Voix off, leçons audio |
| **STT** | Transcription, sous-titres (accessibilité) |
| **TTV** | Vidéos pédagogiques |

### Modèle de crédits

```sql
CREATE TABLE ai_credits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  family TEXT NOT NULL CHECK (family IN ('TTT','TTI','TTS','STT','TTV')),
  prompt JSONB,                -- construit en ACTIF
  cost INT NOT NULL,
  result_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Invariants** :
- **Coût affiché avant génération** (REQ-AIC-04) — jamais de débit surprise.
- Débit et historique dans la même transaction.
- **Aperçu + édition avant intégration** (REQ-AIC-06) — le résultat n'est jamais injecté d'office.
- **Mention de transparence IA** sur tout contenu généré (REQ-AIC-07, AI Act).
- Prompts construits en **ACTIF** (Action, Contexte, Tonalité, Identité, Format) et alignés CPA².

### Ergonomie (REQ-AIC-08)

L'auteur ne quitte jamais son contexte d'édition : panneau latéral de génération, aperçu en place, insertion en un geste. Voir `@.kiro/steering/rework-methodology.md` §10.

---

## 15. Méthodologie REWORK dans l'outil de création

Le pipeline **à gates** est encodé dans l'application (REQ-MTH-01) — aucun saut de phase possible.

```
1. Cahier des charges   → GATE VERROU   (QQOQCCP + Identimètre)
2. Programme            → Concevoir     (Bloom, déroulé 6 col., fiche 17 rubriques)
3. Production           → Produire      (studio IA : TTT/TTI/TTS/STT/TTV)
4. Animation            → Animer        (brise-glace, plan d'animation, SAVI)
5. Analyse              → Analyser      (éval à chaud, analyse IA, bilan C.8)
```

**Règles encodées** :
- Objectif pédagogique validé contre la formule Bloom (verbes interdits : « comprendre », « savoir »).
- **Contrôle arithmétique** du déroulé 6 colonnes : dépassement signalé **avant** validation.
- Donnée non fournie → `[À COMPLÉTER]`, **jamais inventée** (REQ-MTH-08).
- **Justification obligatoire de chaque usage IA** (REQ-MTH-09).
- Seuil de réussite sommatif par défaut : **80 %**.

Référentiel complet : `@.kiro/steering/rework-methodology.md`.

---

## 16. Conformité Qualiopi

⚠️ **Le référentiel national qualité (RNQ) n'est pas présent dans le corpus fourni.** Le gate **G5** conditionne la phase 15.

Ce qui est disponible et exploitable dès maintenant : le **référentiel France Compétences C.1-C.8** (« Exercer la mission de formateur en entreprise », RS7379), adjacent à Qualiopi.

| Comp. | Exigence | Adossée à |
|---|---|---|
| C.1 | Analyser la demande | QQOQCCP + Identimètre (phase 14) |
| C.2 | Concevoir (+ IA justifiée) | Bloom + déroulé 6 col. (phase 14) |
| C.3 | Supports multimodaux + accessibilité | Studio IA + métadonnées (phases 8, 13) |
| C.4 | Logistique + handicap | Checklist handicap (phase 15) |
| C.5 | Posture | SAVI (phase 14) |
| C.6 | Méthodes actives + remédiation | Exercices + SAVI-Agir (phase 14) |
| C.7 | Évaluer les acquis | Quiz, critères transparents (phase 14) |
| C.8 | Bilan | Éval à chaud + analyse + rapport (phase 15) |

**Livrable clé** : un **dossier de preuves exportable** par formation (REQ-QLF-02), qui est la valeur différenciante de Katalyst vis-à-vis d'un organisme de formation.

Voir `@.kiro/specs/katalyst/adr/0006-conformite-qualiopi.md`.

---

## 17. Multi-tenant léger — organisations autonomes

Voir `@.kiro/specs/katalyst/adr/0007-multi-tenant-organisations.md`.

### Modèle

```
organizations
 └─ users            (organization_id)
     ├─ courses      (organization_id)
     │   └─ weeks → chapters → lessons
     └─ cohorts      (organization_id) → cohort_members
 ├─ ai_credits       (au niveau ORGANISATION)
 ├─ subscription     (au niveau ORGANISATION)
 └─ notifications    (organization_id)
```

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES users(id),
  logo_url TEXT,
  brand_name TEXT,
  accent_color TEXT,                 -- dérive de la charte (REQ-DSG-01)
  plan_id TEXT REFERENCES plans(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

`organization_id` est ajouté sur : `users`, `courses`, `cohorts`, `notifications`, `ai_credits`, `ai_generations`, `subscriptions`, `messages` (via cohorte).

### Isolation — règle non négociable

```ts
// src/lib/providers/types.ts — le scope est OBLIGATOIRE
export interface ContentProvider {
  listCourses(scope: OrgScope): Promise<Course[]>;
  getCourse(scope: OrgScope, id: string): Promise<Course | null>;
  // …aucune méthode sans `scope`
}

export interface OrgScope { organizationId: string; userId: string; role: Role; }
```

**Une méthode de provider sans `scope` ne doit pas compiler.** L'isolation est **structurelle**, pas déclarative. Toute requête SQL générée inclut `WHERE organization_id = $1`.

**Test d'isolation obligatoire** (REQ-ORG-02) : un utilisateur de l'organisation A ne peut lire **aucune** ligne de l'organisation B — test automatisé sur chaque entité.

### Rôles

| Rôle | Périmètre |
|---|---|
| **Super Admin** | Exploitation de la plateforme (toutes organisations) |
| **Propriétaire** | Son organisation : facturation, marque, membres, formations |
| **Admin** | Son organisation : membres, formations |
| **Modérateur** | Son organisation : modération, messagerie |
| **Utilisateur** | Son organisation : apprentissage |

### Autonomie (phase 21)

| Étape | Sans intervention externe |
|---|---|
| Créer son espace | Inscription libre-service → organisation créée |
| Inviter | Formateurs et apprenants par email |
| Créer une formation | Pipeline REWORK + studio IA (méthode et templates inclus) |
| Acheter | Abonnement + crédits IA en self-service |
| Exploiter | Notifications, suivi, dossier de preuves Qualiopi exportable |

**Personas** : formateur indépendant, coach, professeur, institut, académie — **même modèle, aucun code spécifique** (REQ-ORG-11).

### Facturation

Abonnement **et** crédits IA portés par l'**organisation** (REQ-ORG-08), pas par l'utilisateur. Le propriétaire gère ; les membres consomment selon leurs permissions.

---

## 18. Internationalisation (transatlantique)

Voir `adr/0008`. **FR et EN obligatoires**, ES optionnel.

```
/fr/...   /en/...        → routage par locale
```

- **Catalogues** : `locales/{fr,en}/translation.json` (pattern masterplan365 `_t('fr','en')`).
- **Zéro chaîne en dur** : toute chaîne passe par une clé. Lint i18n **bloquant** : clé absente d'une langue obligatoire → **build en erreur**.
- **Formats** : dates, nombres, devises, fuseaux via l'API d'internationalisation native.
- **Contenu multilingue** : le modèle porte la locale. Une formation existe en FR et EN ; la traduction est **assistée par IA** (famille TTT du studio, phase 17).
- **Locale de repli** : FR, documentée.

> Conséquence de conception : le contenu pédagogique est une **donnée multilingue**, pas une colonne texte.

---

## 19. API centrale

Voir `adr/0009`. Surface unique **`/api/v1/*`**.

```
Requête
  → authentification (JWT)
  → scope organisation (OrgScope)      ← obligatoire
  → autorisation (rôle)
  → validation Zod                     ← y compris params d'URL
  → handler (délègue au provider)
  → sérialisation
```

| Règle | Raison |
|---|---|
| Aucune route ne contourne la chaîne | Un seul point de contrôle |
| **Autorisation au niveau objet** | OWASP API Top 10 — BOLA |
| Aucune logique métier dans les routes | Testabilité, cohérence |
| **OpenAPI généré depuis Zod** | Contrat unique, pas de dérive |
| Erreurs normalisées, sans fuite interne | Ne pas révéler la structure |
| Limitation de débit par IP **et** utilisateur | Abus et coûts |

**Server Components** conservent l'accès direct aux providers (interne) — l'API sert le client, le mobile et les tiers.

---

## 20. Sécurité

Voir `adr/0009` et `@.kiro/steering/security-standards.md`.

| Domaine | Mesure | Norme |
|---|---|---|
| En-têtes | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy | OWASP Top 10 (A05) |
| CSRF | Jeton sur les mutations + `SameSite` | OWASP Top 10 (A01) |
| Force brute | Verrouillage progressif (login/reset/MFA) | ASVS |
| Audit | Journal des actions sensibles | SOC 2, NIS2 |
| Chiffrement | TLS + au repos | RGPD, ISO 27001 |
| Dépendances | `npm audit`, `gitleaks` en CI | OWASP Top 10 (A06), NIS2 |
| RGPD | Rétention, suppression, export | RGPD |
| Incident | Procédure + responsable | NIS2, SOC 2 |
| IA | Garde-fous et quotas | OWASP LLM Top 10 |

**Isolation multi-tenant** = contrôle de sécurité de premier rang (ADR 0007), testé automatiquement.

---

## 21. Défenses contre l'injection de prompt

Voir `adr/0010`. Normes : **OWASP LLM Top 10** (LLM01, LLM02, LLM06), NIST AI RMF.

Défense en profondeur — **sept niveaux**, aucun suffisant seul :

1. **Hiérarchie d'instructions** : système > utilisateur > contenu (**donnée inerte**).
2. **Délimitation et échappement** du contenu non fiable.
3. **Validation de sortie par schéma Zod** (LLM02) — sortie non conforme rejetée.
4. **Aucune exécution ni écriture directe** depuis l'IA — aperçu + édition humaine.
5. **Outils en liste blanche**, limités au `OrgScope` (LLM06).
6. **Détection et journalisation** des motifs d'injection + alerte sur pic.
7. **Provenance** : marquage du contenu généré (AI Act) + traçabilité des sources.

**Surface d'attaque** : documents importés (content prompting), prompts du studio, aide contextuelle, contenu de leçon.

**Limite assumée** : l'injection de prompt n'est **pas résolue** dans l'état de l'art. Ces défenses **réduisent** le risque et le rendent **non destructif** (l'IA n'a aucun privilège d'écriture) — elles ne l'éliminent pas.

---

## 22. Conformité SOC 2 / NIS2 — « le juste nécessaire »

Voir `adr/0011`. Principe : **contrôles structurels documentés, sans certification**.

| Contrôle | SOC 2 | NIS2 |
|---|---|---|
| Contrôle d'accès (RBAC + scope) | Security | Risque |
| Journal d'audit | Security | Incident |
| Chiffrement | Confidentiality | Risque |
| Sauvegardes + restauration testée | Availability | Continuité |
| Supervision + alertes | Availability | Détection |
| Vulnérabilités (`npm audit`, `gitleaks`) | Security | Chaîne d'appro. |
| Gestion de changement (CI, revue) | Processing Integrity | Risque |
| Rétention / suppression (RGPD) | Privacy | Risque |
| Réponse à incident | Security | **Obligation** |
| Registre des fournisseurs | Confidentiality | **Chaîne d'appro.** |

**Écart assumé** : aucune certification revendiquée sans audit (REQ-CMP-06). Les obligations juridiques NIS2 dépendent du statut de l'exploitant.

---

## 23. Base documentaire du formateur (content prompting)

Voir `adr/0012`.

```
Formation  → documents (disponibles pour TOUTES ses leçons)
  Chapitre → documents (disponibles pour ses leçons)
    Leçon  → documents (les plus spécifiques)
```

**Héritage** : leçon > chapitre > formation.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('COURSE','CHAPTER','LESSON')),
  scope_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'EN_ATTENTE'
    CHECK (status IN ('EN_ATTENTE','INDEXE','ERREUR')),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),           -- pgvector
  position INT NOT NULL
);
```

**Pipeline** : upload → `StorageProvider` → extraction texte → découpage → **vectorisation** → index pgvector.

**Récupération** : similarité vectorielle, **limitée au `OrgScope`** et à la chaîne d'héritage. Seuls les segments pertinents entrent dans le prompt (recommandation REWORK : « extraire la page utile plutôt que 300 pages »).

**Traçabilité** : `ai_generations.source_document_ids` — « d'où vient ce contenu ? » (Qualiopi, ADR 0006).

**Sécurité** : les documents sont des **données**, jamais des instructions (ADR 0010). Suppression → segments et vecteurs supprimés.
