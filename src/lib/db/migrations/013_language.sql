-- =============================================================================
-- 013 — Langue du contenu (formation) et langue d'interface (utilisateur)
-- =============================================================================
-- Fondement : phase 8 (internationalisation). Deux colonnes DISTINCTES, deux
-- usages distincts : les confondre serait une erreur de conception.
-- `courses.language` est choisie par le CRÉATEUR et décrit le contenu ;
-- `users.language` est choisie par l'UTILISATEUR et décrit l'interface.
--
-- ⚠️ Le contenu pédagogique n'est JAMAIS traduit : une formation porte UNE
-- langue. Il n'existe pas « une même formation en FR et EN ».
--
-- ⚠️ `NOT NULL DEFAULT 'fr'` est délibéré pour `courses.language` : les 6
-- formations existantes sont réellement en français. Ce n'est pas une valeur de
-- remplissage, c'est leur état. Aucune donnée n'est inventée (méthode REWORK).
--
-- Migration séparée : les migrations sont forward-only.
-- =============================================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr';

ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT;

-- Contrainte : seules les locales supportées. ES est prévu par la structure
-- (REQ-I18N-02) mais non activé — la contrainte l'accepte déjà pour éviter une
-- migration supplémentaire le jour où il sera activé.
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_language_check;
ALTER TABLE courses ADD CONSTRAINT courses_language_check
  CHECK (language IN ('fr', 'en', 'es'));

-- `users.language` reste NULL tant que l'utilisateur n'a rien choisi : la
-- préférence d'interface se déduit alors de la locale du navigateur, elle n'est
-- pas figée en base. La contrainte autorise explicitement ce cas.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_language_check;
ALTER TABLE users ADD CONSTRAINT users_language_check
  CHECK (language IS NULL OR language IN ('fr', 'en', 'es'));
