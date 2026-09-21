-- =============================================================================
-- 002 — Identité : organisations, utilisateurs, sessions
-- =============================================================================
-- ADR 0007 (multi-tenant léger) et ADR 0002 (Auth JWT).
--
-- Écarts assumés par rapport au modèle masterplan365 (lecture seule) :
--   - pas de hiérarchie d'organisations (YAGNI) ;
--   - `email` globalement unique : un utilisateur appartient à une seule
--     organisation et se connecte par email, comme avec Firebase Auth.
--     (masterplan365 utilise UNIQUE(email, organization_id) car il gère le
--     multi-organisation par utilisateur — hors périmètre ici.)
-- =============================================================================

-- organizations.owner_id référence users(id) et users.organization_id référence
-- organizations(id) : dépendance circulaire, donc la FK de owner_id est ajoutée
-- après la création de users.

CREATE TABLE IF NOT EXISTS organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  owner_id     UUID,
  logo_url     TEXT,
  brand_name   TEXT,
  accent_color TEXT,
  plan_id      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email                TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  role                 TEXT NOT NULL CHECK (
                         role IN ('Super Admin', 'Propriétaire', 'Admin', 'Modérateur', 'Utilisateur')
                       ),
  -- NULL pour les comptes OAuth (Google) : aucun mot de passe local.
  password_hash        TEXT,
  -- Les comptes repris de Firebase Auth ne peuvent pas récupérer leur mot de
  -- passe (Firebase n'expose pas les hachages) : réinitialisation forcée.
  must_reset_password  BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled   BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret    TEXT,
  avatar_url           TEXT,
  plan_id              TEXT,
  status               TEXT NOT NULL DEFAULT 'Actif' CHECK (status IN ('Actif', 'Inactif')),
  phone                TEXT,
  last_login           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_organization_idx ON users (organization_id);

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_owner_fk;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_owner_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Sessions : refresh token rotatif et révocable (ADR 0002).
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);
