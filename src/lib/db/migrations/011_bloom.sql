-- =============================================================================
-- 011 — Conformité : niveau de Bloom déclaré sur les leçons
-- =============================================================================
-- Fondement : `docs/katalyst/conformite-rnq-v10.md`, **indicateur 11** —
-- *« Le prestataire évalue l'atteinte par les publics bénéficiaires des objectifs de la
-- prestation. »*
--
-- ⚠️ Sans niveau déclaré, cette évaluation n'est **pas vérifiable** : l'audit ne peut pas
-- confronter l'objectif annoncé à l'évaluation proposée. C'est cette colonne qui rend la
-- règle R6 (`regles-conformite.md`) exécutable.
--
-- ⚠️ **NULLABLE, et c'est un choix.** Les 80 leçons existantes n'ont pas de niveau : leur
-- affecter une valeur par défaut serait **inventer une donnée pédagogique** — précisément ce
-- que la méthode REWORK interdit (« toute donnée non fournie est marquée [À COMPLÉTER],
-- jamais inventée »). `NULL` signifie donc **« à compléter »**, et l'audit le signale.
--
-- Migration séparée : les migrations sont **forward-only**.
-- =============================================================================

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS bloom_level TEXT;

ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_bloom_level_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_bloom_level_check
  CHECK (
    bloom_level IS NULL
    OR bloom_level IN ('Connaître', 'Comprendre', 'Appliquer', 'Analyser', 'Évaluer', 'Créer')
  );

COMMENT ON COLUMN lessons.bloom_level IS
  'Niveau de Bloom visé par l''objectif de la leçon. NULL = à compléter (jamais déduit par défaut).';

-- Index partiel : l'audit cherche précisément les leçons **sans** niveau.
CREATE INDEX IF NOT EXISTS lessons_bloom_level_missing_idx
  ON lessons (chapter_id) WHERE bloom_level IS NULL;
