# Project Context

## Purpose
`llm-debate` is a solo, local-first app where two LLM “debaters” and a third “judge/moderator” debate a user-provided topic in a chat UI. Debates run turn-by-turn, can continue in the background, and persist each step for replay and debugging.

## Tech Stack
- Web: Next.js (App Router) + TypeScript + pnpm
- API: FastAPI (Python) serving REST + SSE
- Worker: Celery (Python) for background debate execution
- Infra: Postgres (source of truth) + Redis (Celery broker), via Docker Compose in dev
- LLM provider: DeepSeek via OpenAI-compatible API (`base_url=https://api.deepseek.com`)

## Project Conventions

### Code Style
- Python:
  - Package manager: `uv`
  - Lint/format: `ruff`
  - Type checking: `mypy` (strict)
  - Tests: `pytest`
  - Rules: type hints + docstrings; no print debugging in app code
- Node:
  - Package manager: `pnpm`
  - Format: `prettier`
  - Lint: `eslint`
  - Type check: `tsc --noEmit --strict`

### Architecture Patterns
- Persistence-first: every debate step is persisted as a “turn” record in Postgres.
- Background-safe: LLM calls happen in Celery tasks, not request handlers.
- UI updates via SSE streaming persisted turns; clients can reconnect safely.
- Private reasoning (if returned by provider) is not displayed or logged by default.

### Testing Strategy
- Unit tests for orchestration/stop-condition logic via `pytest`.
- Manual local smoke script for end-to-end flow (requires running API + worker).

### Git Workflow
- Keep changes small and verifiable; prefer linear history.

## Domain Context
- A “round” consists of: Debater A → Debater B → Judge.
- The Judge produces structured scoring metadata and a displayable summary.

## Important Constraints
- Debates must be able to run while the UI is disconnected.
- Default stop conditions: `max_rounds=5`, `max_runtime_seconds=600`, `max_total_output_tokens=8000`, per-step caps (Debater 600, Judge 400), plus judge early-stop (2 consecutive “no new substantive arguments”).

## External Dependencies
- DeepSeek API (OpenAI-compatible chat completions)
- Postgres and Redis (local dev via Docker Compose)
