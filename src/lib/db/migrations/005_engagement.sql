-- =============================================================================
-- 005 — Engagement, IA et base documentaire
-- =============================================================================
-- Notifications (design.md §13), studio IA et crédits (§14),
-- base documentaire avec recherche vectorielle (§23, ADR 0012).
-- =============================================================================

-- L'extension est déjà active via docker/init/01-init.sql ; on la garantit ici
-- pour tout environnement migré par cette voie (CI, production).
CREATE EXTENSION IF NOT EXISTS vector;

-- --- Notifications -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (
                    kind IN ('CHAPTER_OPENED', 'ACCESS_REMINDER', 'INACTIVITY_REMINDER', 'DEADLINE_REMINDER')
                  ),
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications (user_id) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  in_app  BOOLEAN NOT NULL DEFAULT true,
  email   BOOLEAN NOT NULL DEFAULT true,
  push    BOOLEAN NOT NULL DEFAULT false
);

-- --- Studio IA et crédits ----------------------------------------------------

-- Solde de crédits porté par l'ORGANISATION (ADR 0007, REQ-ORG-08) :
-- le propriétaire achète, les formateurs consomment.
CREATE TABLE IF NOT EXISTS ai_credits (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  balance         INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historique des générations : coût, prompt (construit en ACTIF), sources.
CREATE TABLE IF NOT EXISTS ai_generations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family              TEXT NOT NULL CHECK (family IN ('TTT', 'TTI', 'TTS', 'STT', 'TTV', 'EMBEDDING')),
  prompt              JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost                INT NOT NULL CHECK (cost >= 0),
  result_ref          TEXT,
  -- Traçabilité des sources documentaires utilisées (REQ-DOC-08).
  source_document_ids UUID[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_generations_org_idx ON ai_generations (organization_id, created_at DESC);

-- --- Base documentaire du formateur -----------------------------------------

-- Documentation attachée à une FORMATION, un CHAPITRE ou une LEÇON,
-- avec héritage : leçon > chapitre > formation (ADR 0012, REQ-DOC-04).
CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scope_type      TEXT NOT NULL CHECK (scope_type IN ('COURSE', 'CHAPTER', 'LESSON')),
  -- Identifiant de la cible : TEXT car `courses.id` est un slug, les autres des UUID.
  scope_id        TEXT NOT NULL,
  filename        TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  storage_key     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'EN_ATTENTE'
                    CHECK (status IN ('EN_ATTENTE', 'INDEXE', 'ERREUR')),
  uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_scope_idx ON documents (organization_id, scope_type, scope_id);

-- Segments vectorisés. 1536 dimensions : taille usuelle des embeddings utilisés.
-- `ON DELETE CASCADE` : supprimer un document supprime ses segments et vecteurs
-- (REQ-DOC-11) — aucun résidu.
CREATE TABLE IF NOT EXISTS document_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   vector(1536),
  position    INT NOT NULL
);

CREATE INDEX IF NOT EXISTS document_chunks_document_idx ON document_chunks (document_id);

-- Index de similarité. `ivfflat` est adapté aux volumes attendus et n'exige pas
-- de données existantes (contrairement à `hnsw` qui se construit à l'import).
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
