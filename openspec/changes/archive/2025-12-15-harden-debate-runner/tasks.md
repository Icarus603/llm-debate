## 1. Database & Persistence
- [x] 1.1 Add a unique constraint for turns on `(debate_id, round, actor)` and keep existing indexes.
- [x] 1.2 Add debate cursor/state fields (e.g., `next_round`, `next_actor`, `stop_reason`, `last_error`) and backfill for existing debates from persisted turns.
- [x] 1.3 Add an Alembic migration and verify upgrade/downgrade locally.

## 2. Worker Reliability
- [x] 2.1 Advance debate steps inside a transaction with a per-debate lock (row lock or advisory lock).
- [x] 2.2 Make step writes idempotent using the unique constraint (no “duplicate insert” races).
- [x] 2.3 Update cursor/state atomically with the persisted turn.
- [x] 2.4 Record failures in persisted debate state and transition to `failed` when unrecoverable.

## 3. API & Streaming
- [x] 3.1 Add `GET /debates` (simple ordering + limit) so users can find background debates.
- [x] 3.2 Update SSE `/debates/{id}/events` to support `Last-Event-ID` replay based on turn id and a stable ordering strategy.
- [x] 3.3 Add/adjust API schemas for debate cursor/status fields.

## 4. Web UX
- [x] 4.1 Add a debates list view/panel with status and basic progress (completed rounds, last updated).
- [x] 4.2 Improve reconnect handling using `Last-Event-ID` (persist last seen turn id in component state).

## 5. Validation
- [x] 5.1 Add unit tests for cursor advancement and idempotency (duplicate deliveries do not create extra turns).
- [x] 5.2 Run `uv run ruff check .`, `uv run mypy .`, `uv run pytest -q`.
- [ ] 5.3 Run a local manual smoke: create → start → refresh mid-run → stop → resume (confirm transcript continuity). (Requires running API/worker/web and a valid `DEEPSEEK_API_KEY`.)
