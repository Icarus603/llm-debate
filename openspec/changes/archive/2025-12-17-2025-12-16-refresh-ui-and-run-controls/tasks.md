# Tasks: Refresh UI and Run Controls

## 1. Proposal Alignment
- [x] Confirm design direction: flat/no-shadow, `#FAF9F5` + `#FFFFFF`, pick a single accent color.
- [x] Confirm run control semantics: stop=pause, cancel=terminal without judge, retry=next step only.

## 2. Web UI Foundation (Tailwind + shadcn/ui)
- [x] Add Tailwind CSS to `apps/web` and migrate from custom CSS classes to Tailwind utilities.
- [x] Initialize shadcn/ui in `apps/web` and add a minimal component set: `button`, `input`, `select`, `badge`, `card`, `separator`, `sheet/drawer`, `sonner` (toast).
- [x] Implement theme tokens (paper background, flat borders, typography) and enforce “no shadows”.

## 3. Layout & Navigation
- [x] Implement 3-pane layout (sidebar / transcript / controls) with responsive behavior.
- [x] Debates list: search/filter, status chips, basic progress (round count), and clear empty/loading states.
- [x] Debate detail: deep link continues to work, and transcript renders in stable order with speaker labels.

## 4. Creation Flow + Advanced Panel
- [x] New debate form: topic + Debater A stance selector in the UI.
- [x] Advanced panel: allow setting model overrides and limits from the frontend (API remains the source of validation).
- [x] Error UX: inline field validation + non-blocking toast for network failures.

## 5. Run Controls + Status UX
- [x] Add UI controls for Start / Stop(Pause) / Resume / Cancel / Retry (context-aware enable/disable).
- [x] Show live status: current actor, current round, stop reason, and last error (if any).
- [x] Provide a clear terminal summary state (Completed/Failed/Canceled) and a pinned judge verdict card when present.

## 6. Streaming Reliability
- [x] Update SSE client to use `Last-Event-ID` replay semantics and robust reconnect behavior.
- [x] Remove or reduce polling to a minimal fallback, without missing turns.
- [x] Add a visible connection indicator (connected/reconnecting) for operator confidence.

## 7. Backend/Worker Semantics (Minimal, MVP)
- [x] Define and persist `canceled` state; add cancel endpoint; ensure worker respects it.
- [x] Make “retry” safe for `failed` debates (cursor reconciliation + idempotent turn persistence).
- [x] Ensure lock/single-flight semantics prevent duplicate step persistence under concurrency.

## 8. Docker Defaults & Docs
- [x] Update Docker web service to run `next build` + `next start` by default (document dev mode).
- [x] Update `README.md` with screenshots and a short “UI tour” + troubleshooting notes.

## 9. Validation
- [x] Python: `uv run ruff check . --fix`, `uv run mypy .`, `uv run pytest -q`
- [x] Web: `pnpm -C apps/web lint`, `pnpm -C apps/web typecheck`
- [x] Docker smoke: `docker compose up -d --build` and run `scripts/smoke_e2e.py`
