## 1. API: Debate Settings & Readability
- [x] 1.1 Define a typed “debate settings” schema for accepted keys (including `debater_a_side`, max_*, model_*, and optional `prompt_version`) and validate `POST /debates` input against it.
- [x] 1.2 Ensure `GET /debates` and `GET /debates/{id}` return settings consistently (including defaults after merge) so the UI can display what actually ran.
- [x] 1.3 Add a small “status/progress” view model contract for the UI (status, stop_reason, last_error, completed_rounds/cursor).

## 2. Worker: Per-debate Overrides + Verdict Contract
- [x] 2.1 Read `model_debater` / `model_judge` from `debate.settings` with env fallback; add unit coverage for precedence.
- [x] 2.2 Standardize judge verdict metadata keys (winner/scores/summary/no_new_substantive_arguments) and ensure they are always present for judge turns (fallback values on invalid JSON).
- [x] 2.3 Update the execution schedule so the Judge runs once at the end by default (after debater rounds complete); confirm stop conditions still behave as specified with `max_rounds=5` defaults.
- [x] 2.4 Update prompts so Debater A/B follow explicit pro/con stances based on `debater_a_side`.

## 3. Web: Usable Navigation + Verdict UI
- [x] 3.1 Add `/debates/[id]` route that loads a debate by id, starts SSE from the last seen turn id, and renders transcript.
- [x] 3.2 Keep `/` as “create + list”, but make list items link to `/debates/[id]` (deep-linkable).
- [x] 3.3 Render judge turns with a verdict card (winner + scores + summary) derived from `turn.metadata`; include a compact “no new arguments” indicator.
- [x] 3.4 Add a lightweight status refresh loop (poll detail every 2–5s while viewing a debate) so status/progress/errors update even when no new turns arrive.
- [x] 3.5 Ensure controls are state-aware (disable Start/Resume/Stop appropriately based on debate status).
- [x] 3.6 Add a stance selector (“Debater A: Pro/Con”) to the create flow; keep model overrides out of the main UI.

## 4. Docker & DX
- [x] 4.1 Ensure `docker compose up -d --build` remains the recommended path; document per-debate model override behavior and env defaults.
- [x] 4.2 Add a short “troubleshooting” note for common local issues (port conflicts, resetting DB volume).

## 5. Validation
- [x] 5.1 Add/extend backend tests for settings validation and worker model override precedence (`pytest`).
- [x] 5.2 Run: `uv run ruff check . --fix`, `uv run mypy .`, `uv run pytest -q`.
- [x] 5.3 Run web checks: `pnpm -C apps/web lint`, `pnpm -C apps/web typecheck`.
- [x] 5.4 Manual smoke (Docker): create (choose stance) → start → open `/debates/<id>` in new tab mid-run → refresh → stop → resume; verify transcript continuity, stance adherence, and final verdict rendering. (Requires valid `DEEPSEEK_API_KEY`.)
