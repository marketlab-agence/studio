-- =============================================================================
-- 008 — Invitations (REQ-ORG-05)
-- =============================================================================
-- Un institut doit pouvoir inviter ses formateurs et ses apprenants sans que
-- l'éditeur intervienne. L'invitation porte le **rôle** à attribuer et
-- l'**organisation** d'accueil.
--
-- ⚠️ Le jeton est stocké **haché** (SHA-256), jamais en clair : une fuite de la
-- base ne doit pas permettre de rejoindre une organisation. SHA-256 suffit —
-- le jeton est aléatoire sur 32 octets, donc rien à ralentir par un KDF lent.
--
-- Pas de contrainte d'unicité sur `(organization_id, email)` : réinviter doit
-- être possible (l'invité a perdu le premier lien, ou a changé d'adresse). Les
-- invitations précédentes non acceptées sont révoquées par le code, pas par le
-- schéma — un `UNIQUE` empêcherait de réinviter sans supprimer l'historique.
--
-- Migration séparée : les migrations sont **forward-only**.
-- =============================================================================

CREATE TABLE IF NOT EXISTS invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  -- Rôle attribué à l'acceptation. Un invité ne peut pas devenir « Super Admin »
  -- (rôle plateforme) : la contrainte est appliquée par le code, qui n'expose que
  -- les rôles d'organisation.
  role            TEXT NOT NULL CHECK (
                    role IN ('Super Admin', 'Propriétaire', 'Admin', 'Modérateur', 'Utilisateur')
                  ),
  token_hash      TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  -- Renseigné à l'acceptation : un lien ne sert qu'une fois.
  accepted_at     TIMESTAMPTZ,
  -- Renseigné à la révocation (réinvitation, retrait).
  revoked_at      TIMESTAMPTZ,
  invited_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invitations_organization_idx ON invitations (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations (lower(email));
CREATE INDEX IF NOT EXISTS invitations_expiry_idx ON invitations (expires_at);
