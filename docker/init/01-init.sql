-- =============================================================================
-- Katalyst — Initialisation PostgreSQL (premier démarrage uniquement)
-- =============================================================================
-- Exécuté automatiquement par l'image pgvector/pgvector:pg16.
-- Pour rejouer : supprimer le volume (docker compose -f docker-compose.dev.yml down -v).
-- =============================================================================

-- Base dédiée aux tests d'intégration (2e projet Jest "node", tâche T0.7).
CREATE DATABASE katalyst_test;

-- Extension vectorielle : recherche sémantique sur la base documentaire (ADR 0012).
\connect katalyst
CREATE EXTENSION IF NOT EXISTS vector;

\connect katalyst_test
CREATE EXTENSION IF NOT EXISTS vector;
