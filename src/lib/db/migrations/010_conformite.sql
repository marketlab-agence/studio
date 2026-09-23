-- =============================================================================
-- 010 — Conformité : type d'organisation, domaine de formation, seuils
-- =============================================================================
-- Fondement : `@docs/katalyst/conformite-rnq-v10.md` (décret n° 2026-728).
--
-- Trois ajouts, chacun répondant à une exigence précise.
--
-- 1. `organizations.type` — DÉCISION UTILISATEUR (2026-09-23) : **prévoir les CFA sans
--    les implémenter**. L'indicateur 33 du RNQ ne porte que sur `L. 6313-1-4°`
--    (apprentissage). Katalyst relève de `L. 6313-1-1°` (actions de formation), donc
--    l'indicateur 33 est HORS PÉRIMÈTRE par défaut. Le champ rend le cas prévisible
--    sans engager de développement.
--
-- 2. `courses.content_domain` — remplace l'heuristique par mots-clés de
--    `inferDomain` (`src/actions/courseActions.ts`). Tant que le domaine repose sur
--    une déduction approximative, le filtrage des composants proposés à l'IA est
--    fragile : une formation « Git pour les commerciaux » serait mal classée.
--
-- 3. `platform_settings` — les SEUILS des indicateurs 19 et 20 sont fixés par des
--    arrêtés **non publiés**. DÉCISION UTILISATEUR (2026-09-23) : les implémenter en
--    **paramétrable**. Une table dédiée évite de coder ces valeurs en dur puis de
--    devoir les corriger à la publication des arrêtés.
--
-- Migration séparée : les migrations sont **forward-only**.
-- =============================================================================

-- --- 1. Type d'organisation ---------------------------------------------------
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'OF';

-- `OF` = organisme de formation (défaut), `CFA` = centre de formation d'apprentis,
-- `BC` = bilan de compétences, `VAE` = accompagnement VAE.
-- Contrainte ajoutée séparément pour rester rejouable.
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_type_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_type_check
  CHECK (type IN ('OF', 'CFA', 'BC', 'VAE'));

-- --- 2. Domaine de contenu d'une formation ------------------------------------
ALTER TABLE courses ADD COLUMN IF NOT EXISTS content_domain TEXT;

ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_content_domain_check;
ALTER TABLE courses ADD CONSTRAINT courses_content_domain_check
  CHECK (
    content_domain IS NULL
    OR content_domain IN ('*', 'git', 'ia', 'automatisation', 'gestion-projet', 'marketing', 'vente')
  );

COMMENT ON COLUMN courses.content_domain IS
  'Domaine de contenu, pour filtrer les composants proposés à l''IA. NULL = non déterminé, aucun filtrage.';

-- --- 3. Seuils réglementaires paramétrables -----------------------------------
-- Indicateurs 19 (« nombre d'intervenants par formation ») et 20 (« proportion d'heures
-- assurées par des intervenants permanents ») : les arrêtés ne sont pas publiés. Stocker
-- ces valeurs en base permet de les ajuster SANS redéploiement le jour de la publication.
--
-- ⚠️ Volontairement **au niveau plateforme** (et non par organisation) : ce sont des
-- seuils réglementaires, identiques pour tous. Les rendre par organisation laisserait
-- croire qu'un organisme peut choisir sa propre conformité.
CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  -- Indique si la valeur est **certaine** (sourcée) ou **provisoire** (en attente d'arrêté).
  is_provisional BOOLEAN NOT NULL DEFAULT true,
  -- Référence de la source, pour la traçabilité (exigence de l'indicateur 23 : veille légale).
  source     TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valeurs initiales : provisoires, en attente des arrêtés.
INSERT INTO platform_settings (key, value, is_provisional, source) VALUES
  ('rnq.indicator19.referent_pedagogique_threshold', 'null'::jsonb, true,
   'Décret 2026-728, indicateur 19 — seuil fixé par arrêté NON PUBLIÉ'),
  ('rnq.indicator20.permanent_teachers_ratio_threshold', 'null'::jsonb, true,
   'Décret 2026-728, indicateur 20 — seuil fixé par arrêté NON PUBLIÉ')
ON CONFLICT (key) DO NOTHING;
