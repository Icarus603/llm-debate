# Proposal: Deliver Debate UX MVP

## Why
The repo has a functional “happy path” (create → start → background run → SSE turns), but the user experience is still closer to a developer demo than an MVP: it’s hard to deep-link/share a debate, interpret judge results, and understand status/progress/errors while a debate runs in the background.

## Goals
- Make the UI usable end-to-end: create, navigate, watch live, and review finished debates via a stable URL.
- Make the Judge meaningful from day 1: show structured verdict (winner/scores) and the “no new arguments” signal.
- Allow per-debate run configuration (at least model overrides) while keeping safe defaults (`max_rounds=5`, etc.).
- Keep the system Docker-first and reliable (no local Redis/Postgres required; persisted turns remain the source of truth).

## Non-goals
- Token-by-token streaming or WebSockets.
- Authentication/multi-tenant sharing.
- Production deployment, autoscaling, or queue dashboards (Flower, etc.).
- Arbitrary user-supplied prompt injection UI (we will version prompts and allow only a small, explicit override surface).

## What Changes
- API:
  - Extend debate creation to accept a typed subset of settings (including optional per-debate model overrides).
  - Add/extend read endpoints so the web app can render a debate detail view by id (shareable link) and show progress/status/errors without manual refresh.
- Worker:
  - Respect per-debate model overrides (debater/judge) stored in `debate.settings`.
  - Change debate execution so the Judge runs once at the end by default.
  - Ensure judge verdict fields are persisted in turn metadata consistently (already present; standardize contract).
- Web:
  - Add dedicated routes for listing and for viewing a single debate (deep-linkable).
  - Render judge turns with a verdict card (winner/scores + summary) derived from persisted metadata.
  - Improve “background run” ergonomics: status/progress, last error, and a clear action set (start/resume/stop).
  - Allow the user to select Debater A’s stance (pro/con) at debate creation time in the frontend; Debater B uses the opposite stance.
  - Keep model overrides API-only (no mainline UI pickers; optional advanced panel later).
- Docs:
  - Document the MVP user flow and configuration knobs (env vars + per-debate settings).

## Acceptance Criteria
- A user can open `http://localhost:3000`, create a debate, start it, and watch turns arrive live.
- A user can refresh or open a new tab at a stable URL (e.g., `/debates/<id>`) and see the full transcript and live updates.
- Debater A and Debater B follow explicit pro/con stances based on the user’s selection at creation time.
- The Judge runs once at the end by default and displays a structured verdict (winner + scores + summary), not just plain text.
- A debate can be configured to use different DeepSeek model ids for debaters/judge without code changes.
- All of the above works via `docker compose up -d --build` (no local Redis/Postgres install).

## Decisions
- Judge runs once at the end by default.
- Debater A/B are explicitly “pro vs con”, with Debater A stance chosen in the frontend.
- Per-debate model overrides remain API-only / advanced (not part of the main UI flow).
