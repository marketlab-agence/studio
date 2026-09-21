-- =============================================================================
-- 003 — Contenu : formations, semaines, chapitres, leçons, quiz, formules
-- =============================================================================
-- Modèle de référence (ADR 0003, design.md §3) :
--   Formation → Semaine (S.n) → Chapitre (S.n.J.m) → Leçon (+ Quiz)
-- Numérotation : S = semaine de formation, J = jour (lundi → vendredi).
--
-- IDENTIFIANTS : les entités de contenu portent des identifiants **TEXT issus
-- des données sources** (slugs, ex. « intro-to-git »), et non des UUID générés.
-- Raison : ils sont stables, lisibles, et rendent le seed **idempotent** —
-- le rejouer ne duplique rien. Les entités dynamiques (utilisateurs, cohortes,
-- messages, documents) gardent des UUID.
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
  -- Traçabilité IA (REQ-MTH-09) : plan généré et paramètres de génération.
  plan              JSONB,
  generation_params JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courses_organization_idx ON courses (organization_id);

CREATE TABLE IF NOT EXISTS weeks (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- Code « S1 », « S2 »… (voir formatWeekCode dans src/lib/schemas/content.ts)
  code      TEXT NOT NULL,
  title     TEXT,
  position  INT NOT NULL,
  UNIQUE (course_id, code)
);

CREATE INDEX IF NOT EXISTS weeks_course_idx ON weeks (course_id);

-- Un chapitre se déroule sur une semaine (lundi → vendredi).
CREATE TABLE IF NOT EXISTS chapters (
  id             TEXT PRIMARY KEY,
  week_id        UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  -- Code « S.1.J.2 » (formatChapterCode)
  code           TEXT NOT NULL,
  title          TEXT NOT NULL,
  position       INT NOT NULL,
  unlock_rule_id UUID,
  UNIQUE (week_id, code)
);

CREATE INDEX IF NOT EXISTS chapters_week_idx ON chapters (week_id);

CREATE TABLE IF NOT EXISTS lessons (
  id                         TEXT PRIMARY KEY,
  chapter_id                 TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  -- Identifiant d'origine, conservé pour la traçabilité de la reprise de données.
  code                       TEXT,
  title                      TEXT NOT NULL,
  objective                  TEXT NOT NULL,
  content                    TEXT NOT NULL DEFAULT '',
  type                       TEXT NOT NULL CHECK (
                               type IN (
                                 'VIDEO', 'AUDIO', 'CAPSULE', 'MISE_EN_PRATIQUE',
                                 'EVALUATION', 'TEXTE', 'IMAGE', 'MEDIA', 'LIEN'
                               )
                             ),
  duration_minutes           INT CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  points                     INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  media_ref                  JSONB,
  -- Noms issus du catalogue de composants (src/components/registry/catalog.ts).
  interactive_component_name TEXT,
  visual_component_name      TEXT,
  position                   INT NOT NULL
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
