-- =============================================================================
-- 012 — Conformité : journal d'interaction pédagogique
-- =============================================================================
-- Fondement : `docs/katalyst/conformite-rnq-v10.md`, **indicateur 19** —
-- *« Le prestataire met à disposition du bénéficiaire des ressources pédagogiques et permet
-- à celui-ci de se les approprier. Lorsque des modules pédagogiques sont réalisés à distance,
-- le prestataire vérifie l'effectivité de leur suivi par les apprenants. »*
--
-- ⚠️ **Pourquoi une table dédiée.** Les tables de progression existantes ne suffisent pas :
-- - `user_lesson_progress` dit seulement « terminé » — aucune trace de l'appropriation ;
-- - `user_course_progress` porte les scores de quiz et la position, rien de plus.
--
-- Or le décret exige de vérifier l'**effectivité du suivi**. Source secondaire (digi-certif,
-- citant les attendus d'audit) : *« les relevés de connexion seuls ne suffisent plus »*.
-- Il faut des traces d'interaction : réponse donnée, tentative, correction commentée,
-- temps passé.
--
-- ⚠️ **Conçue à partir d'un cas d'usage réel** — `StepByStepRunner` (étape 14) est le premier
-- composant à produire une trace. Concevoir cette table sans cas concret aurait risqué de
-- mal la calibrer.
--
-- Migration séparée : les migrations sont **forward-only**.
-- =============================================================================

CREATE TABLE IF NOT EXISTS lesson_interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  -- Composant qui a produit la trace (nom du registre). Permet de savoir *comment*
  -- l'apprenant s'est approprié la ressource.
  component_name TEXT NOT NULL,

  -- Nature de l'interaction. Contrainte volontairement large : les 12 primitives produiront
  -- des traces de formes différentes, et figer une liste courte obligerait à migrer à chaque
  -- nouveau composant.
  kind        TEXT NOT NULL CHECK (
                kind IN (
                  'STEP_COMPLETED',   -- une étape validée (StepByStepRunner)
                  'ATTEMPT',          -- une tentative, réussie ou non
                  'ANSWER',           -- une réponse à une question
                  'FREE_TEXT',        -- une production libre (BuilderCanvas, DraftCoach)
                  'REVISION'          -- une correction après retour (DraftCoach)
                )
              ),

  -- Données de l'interaction : réponse, étapes, écart… Forme libre car elle dépend du
  -- composant. Le schéma du composant en garantit la structure côté application.
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Issue de l'interaction, si elle est évaluable. `NULL` = non applicable (consultation).
  outcome     TEXT CHECK (outcome IS NULL OR outcome IN ('SUCCESS', 'PARTIAL', 'FAILURE')),

  -- Durée d'interaction en secondes : c'est la mesure la plus directe de l'**effectivité**.
  -- `NULL` si non mesurée (ne pas mettre 0 : ce serait une donnée inventée).
  duration_seconds INT CHECK (duration_seconds IS NULL OR duration_seconds >= 0),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Requête principale de l'audit : « cet apprenant a-t-il interagi sur cette leçon ? »
CREATE INDEX IF NOT EXISTS lesson_interactions_learner_idx
  ON lesson_interactions (user_id, lesson_id, created_at DESC);

-- Requête de l'encadrant : « quelles interactions sur cette formation ? »
CREATE INDEX IF NOT EXISTS lesson_interactions_lesson_idx
  ON lesson_interactions (lesson_id, created_at DESC);

-- Requête de l'organisation (indicateur 19 : suivi à distance, par organisation).
CREATE INDEX IF NOT EXISTS lesson_interactions_org_idx
  ON lesson_interactions (organization_id, created_at DESC);
