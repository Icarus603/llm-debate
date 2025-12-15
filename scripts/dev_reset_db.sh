#!/usr/bin/env bash
set -euo pipefail

# WARNING: This resets the local dev database data.

docker compose up -d postgres

docker compose exec -T postgres psql -U postgres -d llm_debate -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
SQL

uv run alembic upgrade head

