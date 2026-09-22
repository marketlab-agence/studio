-- =============================================================================
-- 007 — Connexion Google
-- =============================================================================
-- REQ-AUTH-02 (connexion via compte Google), REQ-AUTH-07 (les 2 comptes Google
-- importés se reconnectent sans friction).
--
-- On conserve l'identifiant **stable** renvoyé par Google (`sub`), et pas
-- seulement l'email :
--   - une adresse email peut changer côté Google, l'identifiant non ;
--   - sans lui, un changement d'adresse créerait un second compte au lieu de
--     retrouver l'existant ;
--   - il permet de détecter qu'un compte Google est déjà rattaché à un AUTRE
--     utilisateur, et de refuser plutôt que d'écraser silencieusement.
--
-- `UNIQUE` autorise plusieurs NULL : les comptes sans Google ne sont donc pas
-- contraints (Postgres considère chaque NULL comme distinct).
--
-- Un compte Google n'a **pas** de mot de passe local : `password_hash` reste
-- NULL, et `verifyPassword` retourne alors `false` sans erreur.
--
-- Migration séparée : les migrations sont **forward-only**, on ne réécrit pas
-- 002 déjà appliquée.
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

-- Contrainte d'unicité : un compte Google ne peut être rattaché qu'à un seul
-- utilisateur. Créée séparément pour rester rejouable (ADD COLUMN IF NOT EXISTS
-- ne gère pas les contraintes).
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_google_id_key;
ALTER TABLE users ADD CONSTRAINT users_google_id_key UNIQUE (google_id);

CREATE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id) WHERE google_id IS NOT NULL;
