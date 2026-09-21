-- =============================================================================
-- 003 — Contenu : formations, regroupements, chapitres, leçons, quiz, formules
-- =============================================================================
-- Modèle de référence (ADR 0003) :
--   Formation → [regroupement libre] → Chapitre → Leçon (+ Quiz)
--
-- Le regroupement (« Semaine 1 », « Module A »…) est **facultatif** et son
-- intitulé est **libre** : c'est le formateur qui décide du titrage.
--
-- ⚠️ « S » et « J » dans les intitulés ne sont PAS des données.
-- Aucune colonne ne porte de code S.n.J.m, aucune règle « 1 leçon = 1 jour » ou
-- « 5 chapitres par semaine » : une leçon peut couvrir plusieurs jours. Le
-- formateur écrit ce qu'il veut dans `weeks.title`, `chapters.title`,
-- `lessons.title`.
--
-- L'ACCÈS PAR PÉRIODE (comme dans REWORK) est porté par `unlock_rules`, et peut
-- viser **la formation, le chapitre ou la leçon** (`unlock_rule_id` à chacun de
-- ces trois niveaux ; la FK est ajoutée en 004, quand la table existe).
--
-- IDENTIFIANTS : TEXT issus des données sources (slugs) — stables, lisibles,
-- et le seed reste idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS plans (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  description    TEXT,
  price          NUMERIC(10, 2) NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  features       JSONB NOT NULL DEFAULT '[]'::jsonb,
  courses        JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta            TEXT,
  recommended    BOOLEAN NOT NULL DEFAULT false,
  position       INT NOT NULL DEFAULT 0
);

-- Rattachées maintenant que `plans` existe.
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_fk;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_fk
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_fk;
ALTER TABLE users
  ADD CONSTRAINT users_plan_fk
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS courses (
  id                TEXT PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'Brouillon'
                      CHECK (status IN ('Brouillon', 'Plan', 'Publié')),
  -- Accès programmé au niveau de la formation (FK ajoutée en 004).
  unlock_rule_id    UUID,
  -- Traçabilité IA (REQ-MTH-09) : plan généré et paramètres de génération.
  plan              JSONB,
  generation_params JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courses_organization_idx ON courses (organization_id);

-- Regroupement visuel FACULTATIF : l'intitulé est libre (« Semaine 1 »,
-- « Module A »…). Aucun code, aucune contrainte de période.
CREATE TABLE IF NOT EXISTS weeks (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  position  INT NOT NULL,
  UNIQUE (course_id, position)
);

CREATE INDEX IF NOT EXISTS weeks_course_idx ON weeks (course_id);

CREATE TABLE IF NOT EXISTS chapters (
  id             TEXT PRIMARY KEY,
  course_id      TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- Rattaché à un regroupement, ou directement à la formation (NULL).
  week_id        UUID REFERENCES weeks(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  position       INT NOT NULL,
  unlock_rule_id UUID,
  UNIQUE (course_id, position)
);

CREATE INDEX IF NOT EXISTS chapters_course_idx ON chapters (course_id);
CREATE INDEX IF NOT EXISTS chapters_week_idx ON chapters (week_id);

CREATE TABLE IF NOT EXISTS lessons (
  id                         TEXT PRIMARY KEY,
  chapter_id                 TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  -- Identifiant d'origine, conservé pour la traçabilité de la reprise de données.
  source_id                  TEXT,
  title                      TEXT NOT NULL,
  objective                  TEXT NOT NULL,
  content                    TEXT NOT NULL DEFAULT '',
  type                       TEXT NOT NULL CHECK (
                               type IN (
                                 'VIDEO', 'AUDIO', 'CAPSULE', 'MISE_EN_PRATIQUE',
                                 'EVALUATION', 'TEXTE', 'IMAGE', 'MEDIA', 'LIEN'
                               )
                             ),
  -- Durée indicative en minutes : une leçon peut couvrir plusieurs jours.
  duration_minutes           INT CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  points                     INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  media_ref                  JSONB,
  -- Noms issus du catalogue de composants (src/components/registry/catalog.ts).
  interactive_component_name TEXT,
  visual_component_name      TEXT,
  -- Accès programmé au niveau de la leçon (FK ajoutée en 004).
  unlock_rule_id             UUID,
  position                   INT NOT NULL,
  UNIQUE (chapter_id, position)
);

CREATE INDEX IF NOT EXISTS lessons_chapter_idx ON lessons (chapter_id);

CREATE TABLE IF NOT EXISTS quizzes (
  id              TEXT PRIMARY KEY,
  chapter_id      TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  -- Seuil de réussite en pourcentage. Défaut REWORK : 80.
  passing_score   INT NOT NULL DEFAULT 80 CHECK (passing_score BETWEEN 0 AND 100),
  feedback_timing TEXT CHECK (feedback_timing IS NULL OR feedback_timing IN ('immediate', 'end'))
);

CREATE INDEX IF NOT EXISTS quizzes_chapter_idx ON quizzes (chapter_id);

CREATE TABLE IF NOT EXISTS questions (
  id                 TEXT PRIMARY KEY,
  quiz_id            TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text               TEXT NOT NULL,
  is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
  position           INT NOT NULL
);

CREATE INDEX IF NOT EXISTS questions_quiz_idx ON questions (quiz_id);

CREATE TABLE IF NOT EXISTS answers (
  id          TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT false,
  position    INT NOT NULL
);

CREATE INDEX IF NOT EXISTS answers_question_idx ON answers (question_id);
