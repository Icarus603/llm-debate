## Tasks

1. - [x] Create monorepo layout (`apps/web`, `apps/api`, `apps/worker`) and shared tooling/config folders as needed.
2. - [x] Add local infrastructure with Docker Compose: `postgres` + `redis`, and document environment variables.
   - [x] Run `apps/web`, `apps/api`, and `apps/worker` as local processes in dev.
3. - [x] Implement persistence schema for debates, turns, and judge scoring; add migrations and seed/dev reset workflow.
4. - [x] Implement FastAPI endpoints:
   - [x] Create a debate with topic + settings
   - [x] Fetch debate state (turns/messages)
   - [x] Stream debate events via SSE
   - [x] Start/stop/resume a debate run (enqueue background work)
5. - [x] Implement Celery worker pipeline:
   - [x] Debater A step
   - [x] Debater B step
   - [x] Judge step (scoring + summary)
   - [x] Stop conditions (defaults: max_rounds=5, max_runtime_seconds=600, max_total_output_tokens=8000; manual stop; judge early-stop)
   - [x] Idempotency and retry safety
6. - [x] Implement DeepSeek client wrapper (OpenAI-compatible) with configurable `base_url`, model selection, and safe handling of any reasoning fields.
7. - [x] Implement Next.js chat UI:
   - [x] Show debate transcript with roles (Debater A, Debater B, Judge)
   - [x] Live updates via SSE
   - [x] Controls: start, stop, resume, new debate
8. - [x] Add baseline quality gates:
   - [x] Python: `uv`, `ruff`, `mypy`, `pytest`
   - [x] Node: `pnpm` + `prettier`, `eslint`, `tsc --noEmit --strict`
9. - [x] Add a minimal end-to-end test path (smoke) that can run locally:
   - [x] Start infra
   - [x] Create a debate
   - [x] Run 1 round
   - [x] Verify persisted turns and SSE output shape
10. - [x] Update `openspec/project.md` with the chosen stack, directory layout, and development conventions once the scaffold exists.

## Validation
- `openspec validate add-llm-debate-scaffold --strict`
- Apply-stage checks (when implemented):
  - `uv run ruff check . --fix`
  - `uv run mypy .`
  - `uv run pytest -q`
  - `pnpm -r lint` (TBD)
  - `pnpm -r typecheck` (TBD)
