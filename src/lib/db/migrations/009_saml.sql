-- =============================================================================
-- 009 — SSO SAML (REQ-AUTH-05, gate G1)
-- =============================================================================
-- La configuration SAML appartient à l'ORGANISATION (ADR 0007) : chaque institut
-- a son propre fournisseur d'identité, son propre certificat, sa propre URL.
-- Elle est stockée en JSONB sur `organizations`, comme dans le modèle
-- masterplan365 (`organizations.saml_config`).
--
-- Forme attendue :
--   {
--     "enabled":     true,
--     "entryPoint":  "https://idp.exemple.fr/sso",   -- URL SSO du fournisseur
--     "certificate": "-----BEGIN CERTIFICATE-----…",  -- certificat de signature
--     "provider":    "azure-ad" | "okta" | "google" | "generic",
--     "entityId":    "…"                              -- identifiant attendu
--   }
--
-- ⚠️ Le certificat est OBLIGATOIRE et non facultatif : sans lui, aucune signature
-- d'assertion n'est vérifiée, et n'importe qui peut forger une identité. Le code
-- refuse une configuration sans certificat (le modèle masterplan365 retombait
-- sur une chaîne vide, ce qui désactivait silencieusement la vérification).
--
-- ⚠️ La paire de clés du fournisseur de service (nous) vit dans les variables
-- d'environnement, PAS ici, et n'est JAMAIS régénérée automatiquement : un
-- certificat SP qui change à chaque redémarrage casse la confiance configurée
-- chez le fournisseur d'identité.
--
-- Migration séparée : les migrations sont **forward-only**.
-- =============================================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS saml_config JSONB;

-- Retrouver rapidement les organisations ayant activé le SSO (résolution par
-- domaine, écran de connexion).
CREATE INDEX IF NOT EXISTS organizations_saml_enabled_idx
  ON organizations ((saml_config ->> 'enabled'))
  WHERE saml_config IS NOT NULL;
