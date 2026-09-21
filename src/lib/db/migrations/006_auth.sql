-- =============================================================================
-- 006 — Authentification : réinitialisation de mot de passe
-- =============================================================================
-- REQ-AUTH-06 : les comptes repris de Firebase Auth ne peuvent pas récupérer
-- leur mot de passe (Firebase n'expose pas les hachages). Ils doivent donc
-- pouvoir en définir un nouveau par un lien reçu par email.
--
-- ⚠️ Le jeton est stocké **haché** (SHA-256), jamais en clair : une fuite de la
-- base ne doit pas permettre de réinitialiser les mots de passe. SHA-256 suffit
-- ici, contrairement aux mots de passe : le jeton est aléatoire sur 32 octets,
-- donc non devinable — il n'y a rien à ralentir par un KDF lent.
--
-- Migration séparée (et non un ajout à 002) : les migrations sont
-- **forward-only**, on ne réécrit pas une migration déjà appliquée.
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  -- Renseigné à la première utilisation : un lien ne sert qu'une fois.
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id);

-- Jetons expirés ou déjà utilisés : purge périodique (tâche planifiée, phase 20).
CREATE INDEX IF NOT EXISTS password_reset_tokens_expiry_idx ON password_reset_tokens (expires_at);
