-- =============================================================================
-- 001 — Table des paramètres applicatifs
-- =============================================================================
-- Première migration du projet. Amorçage du système de migrations (phase 2).
-- Clé/valeur JSONB : les paramètres applicatifs sont peu nombreux et hétérogènes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valeur initiale, alignée sur src/data/settings.json.
INSERT INTO settings (key, value)
VALUES ('app', '{"instructorName": "Alex Dubois"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
