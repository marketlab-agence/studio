-- Une leçon porte N composants pédagogiques ordonnés.
--
-- ⚠️ **Clé de substitution (`id`), pas `(lesson_id, component_name)`.** Le même
-- composant peut apparaître plusieurs fois dans une leçon : deux `StepByStepRunner`
-- sur deux procédures distinctes, deux `RecallQuiz` sur deux notions. Une clé
-- composite l'interdirait — c'est un cas explicitement demandé par l'utilisateur.
CREATE TABLE IF NOT EXISTS lesson_components (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      TEXT    NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  component_name TEXT    NOT NULL,
  position       INTEGER NOT NULL,
  -- Libellés et données du composant, dans la langue de la formation.
  -- `{}` = configuration par défaut du composant : il rend comme avant.
  config         JSONB   NOT NULL DEFAULT '{}',
  UNIQUE (lesson_id, position)
);

-- Analyse d'impact (« quelles leçons utilisent X ? ») et statistiques de couverture.
CREATE INDEX IF NOT EXISTS lesson_components_lesson_idx ON lesson_components (lesson_id, position);
CREATE INDEX IF NOT EXISTS lesson_components_name_idx   ON lesson_components (component_name);

-- Reprise des deux colonnes existantes : l'interactif d'abord, le visuel ensuite.
INSERT INTO lesson_components (lesson_id, component_name, position)
SELECT id, interactive_component_name, 0 FROM lessons WHERE interactive_component_name IS NOT NULL
ON CONFLICT (lesson_id, position) DO NOTHING;

INSERT INTO lesson_components (lesson_id, component_name, position)
SELECT id, visual_component_name, 1 FROM lessons WHERE visual_component_name IS NOT NULL
ON CONFLICT (lesson_id, position) DO NOTHING;

-- Attribution de la trace à l'INSTANCE qui l'a produite.
--
-- ⚠️ `NULL` autorisé : les traces existantes restent valides.
-- ⚠️ `ON DELETE SET NULL` et NON `CASCADE` : retirer un composant ne doit JAMAIS
-- détruire l'historique d'apprentissage — c'est une exigence (traçabilité, ind. 19),
-- pas un détail d'implémentation.
ALTER TABLE lesson_interactions
  ADD COLUMN IF NOT EXISTS lesson_component_id UUID NULL
  REFERENCES lesson_components(id) ON DELETE SET NULL;

-- Les deux colonnes d'origine disparaissent : la table de jointure est la seule source.
ALTER TABLE lessons DROP COLUMN IF EXISTS interactive_component_name;
ALTER TABLE lessons DROP COLUMN IF EXISTS visual_component_name;
