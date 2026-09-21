-- =============================================================================
-- 004 — Apprentissage : déblocage, progression, points, cohortes, messagerie
-- =============================================================================
-- ADR 0004 (SSE pour la messagerie) et design.md §12 (déblocage configurable).
-- =============================================================================

-- Règles de déblocage : par date (« 5 août ») ou par condition.
-- La cadence (jour/semaine/mois/personnalisé) est définie par l'auteur du cours.
CREATE TABLE IF NOT EXISTS unlock_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind                  TEXT NOT NULL CHECK (kind IN ('DATE', 'COMPLETION', 'QUIZ_PASSED')),
  cadence               TEXT CHECK (cadence IS NULL OR cadence IN ('DAY', 'WEEK', 'MONTH', 'CUSTOM')),
  release_at            TIMESTAMPTZ,
  -- Échéance de fin de période (déclenche les rappels, phase 15).
  due_at                TIMESTAMPTZ,
  -- TEXT : les chapitres portent des identifiants issus des données sources.
  depends_on_chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
  min_score             INT CHECK (min_score IS NULL OR min_score BETWEEN 0 AND 100)
);

-- `chapters.unlock_rule_id` était déclarée sans FK (table pas encore créée).
ALTER TABLE chapters
  DROP CONSTRAINT IF EXISTS chapters_unlock_rule_fk;
ALTER TABLE chapters
  ADD CONSTRAINT chapters_unlock_rule_fk
  FOREIGN KEY (unlock_rule_id) REFERENCES unlock_rules(id) ON DELETE SET NULL;

-- Progression par leçon.
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, lesson_id)
);

-- Progression par formation : reprise au bon endroit, scores de quiz, vue courante.
CREATE TABLE IF NOT EXISTS user_course_progress (
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id          TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  quiz_scores        JSONB NOT NULL DEFAULT '{}'::jsonb,
  quiz_attempts      JSONB NOT NULL DEFAULT '{}'::jsonb,
  quiz_answers       JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_chapter_id TEXT,
  current_lesson_id  TEXT,
  current_view       TEXT NOT NULL DEFAULT 'lesson' CHECK (current_view IN ('lesson', 'quiz')),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- Grand livre des points : le solde se recalcule, il ne se stocke pas.
-- La contrainte d'unicité garantit qu'une activité ne crédite qu'une seule fois
-- (idempotence portée par la base, pas par le code applicatif).
CREATE TABLE IF NOT EXISTS points_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('LESSON', 'QUIZ', 'CHAPTER')),
  -- TEXT : identifiant de la leçon, du quiz ou du chapitre selon `source_type`.
  source_id   TEXT NOT NULL,
  points      INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS points_ledger_user_idx ON points_ledger (user_id);

-- Cohortes : créées par l'administration ; un apprenant peut en suivre plusieurs.
CREATE TABLE IF NOT EXISTS cohorts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  course_id   TEXT REFERENCES courses(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS cohorts_organization_idx ON cohorts (organization_id);

CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Clé composite : appartenance multiple autorisée (plusieurs cohortes).
  PRIMARY KEY (cohort_id, user_id)
);

CREATE INDEX IF NOT EXISTS cohort_members_user_idx ON cohort_members (user_id);

CREATE TABLE IF NOT EXISTS messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id      UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  author_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body           TEXT,
  attachment_key TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_cohort_idx ON messages (cohort_id, created_at DESC);

-- Suivi des lectures pour le compteur de messages non lus.
CREATE TABLE IF NOT EXISTS message_reads (
  cohort_id   UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cohort_id, user_id)
);
