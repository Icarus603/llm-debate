# Change: Add llm-debate monorepo scaffold

## Why
The project needs a minimal, spec-driven starting point to build a “two debaters + judge” LLM debate experience with live turn-by-turn updates and background execution.

## What Changes
- Define an initial monorepo layout for `apps/web` (Next.js), `apps/api` (FastAPI), and `apps/worker` (Celery).
- Define local development dependencies (Postgres + Redis) and baseline run workflows.
- Define the debate runtime (turn scheduling, persistence-first, background-safe execution).
- Define DeepSeek (OpenAI-compatible) integration requirements for the worker.
- Define event streaming requirements for live UI updates.

## Non-Goals
- Building a polished UI/UX, auth, multi-user support, or deployment automation.
- Adding tools/function-calling beyond what’s needed for the initial debate loop.
- Adding evals/leaderboards/analytics.

## Impact
- New capabilities introduced via delta specs:
  - `repo-structure`
  - `local-development`
  - `debate-runtime`
  - `llm-provider-deepseek`
  - `event-streaming`
- Expected new code (apply stage): Next.js app, FastAPI service, Celery worker, DB schema/migrations, and Docker Compose for local services.

