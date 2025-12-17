# Change: Refresh UI and Run Controls

## Why
The current web UI is dark, visually dated, and structurally hard to use while monitoring a live debate. As debates run in the background, users need clearer status, controls, and reconnection behavior to confidently start/stop/resume runs and review the final judge verdict.

## What Changes
- Adopt `Tailwind CSS` + `shadcn/ui` for a consistent, modern UI system.
- Redesign the UI to a flat, light “paper” theme (page background `#FAF9F5`, surfaces `#FFFFFF`, no shadows).
- Restructure the web app into a stable, scalable layout:
  - Left: debates list and “new debate” entry point
  - Center: transcript timeline (live-updating)
  - Right: controls + settings (with an “Advanced” panel)
- Improve run control semantics and visibility (pause/stop, resume, cancel/abort, retry failed).
- Improve SSE reconnection ergonomics (prefer `Last-Event-ID`; client reconnect without missing turns).
- Make the Docker web service run in production mode by default (`next build` + `next start`), while preserving a dev workflow.

## Non-Goals (This MVP)
- User accounts / authentication / multi-user tenancy
- “Judge every round” mode (judge runs once at end by default remains unchanged)
- Complex analytics dashboards or cost tracking beyond basic per-turn metadata display
- Fine-grained moderation policies beyond the existing “reasoning privacy” rule

## Acceptance Criteria
- Web UI renders in a light theme using `#FAF9F5` and `#FFFFFF`, with flat borders (no elevation/shadows).
- The UI has a clear, consistent structure for: debate discovery, creation, and live monitoring.
- Users can:
  - Create a debate and select Debater A stance (Pro/Con)
  - Start, stop/pause, resume a debate run
  - Cancel/abort a run (terminal state) and see that state in the UI
  - See “failed” runs and retry from the UI (at least a minimal “retry” action)
- Live updates are reliable across refresh/reconnect (no missing turns).
- Docker Compose can run the full stack without requiring local Postgres/Redis installs.

## Impact
- Affected specs:
  - `web-ui` (layout, design system, controls, advanced panel)
  - `event-streaming` (reconnection details)
  - `debate-runtime` (run control semantics)
  - `local-development` (docker defaults for web)
- Affected areas (expected, not exhaustive):
  - `apps/web/*` (Tailwind/shadcn setup and UI refactor)
  - API routes & worker orchestration for new run control endpoints/semantics
  - `docker-compose.yml`, `Dockerfile.web`

## Open Questions
1. Accent color choice for actions within the light theme. **Confirmed:** `#237CC9`.
2. Whether “Cancel/abort” should skip final judging. **Confirmed:** yes — cancel is terminal and does not run the judge.
3. Whether “Retry” should re-run only the next step or allow “re-run from round N”. **Confirmed:** retry next-step only (no rewind/edit history in this MVP).
