# Design: Debate Runner Reliability MVP

## Overview
This MVP hardens the debate execution loop and reconnect behavior by (1) persisting an explicit “next step” cursor, (2) enforcing idempotency at the database layer, and (3) making SSE replay deterministic via `Last-Event-ID`.

The goal is not “high scale”; it is correctness under retries, crashes, and refreshes.

## Data Model

### Turn Idempotency
Add a **unique constraint** on `turns(debate_id, round, actor)`.
- This prevents duplicate turn records caused by races or duplicate task deliveries.
- The worker treats “already exists” as a no-op and advances cursor/re-enqueues as needed.

### Debate Cursor / State
Add minimal persisted fields to `debates` to make the next step explicit:
- `next_round` (int): the round number for the next step.
- `next_actor` (text): one of `debater_a | debater_b | judge`.
- `stop_reason` (text, nullable): why execution ended (limits reached, manual stop, judge early-stop).
- `last_error` (text, nullable): last failure message for debugging.

Cursor invariants:
- When `status=created`, `next_round=1`, `next_actor=debater_a`.
- After writing a `debater_a` turn: `next_actor=debater_b` (same round).
- After writing a `debater_b` turn: `next_actor=judge` (same round).
- After writing a `judge` turn: `next_round += 1` and `next_actor=debater_a`.

Backfill strategy:
- For existing debates, infer `next_round/next_actor` from the latest persisted turn (or initialize to round 1 / debater_a if no turns).
- If the cursor ever becomes inconsistent, recompute from turns in a single query and repair before continuing.

## Concurrency & Locking
Celery can deliver duplicate tasks and retries can overlap. The worker should:
- Acquire a **per-debate lock** at the start of `advance_debate` (prefer row-level `SELECT ... FOR UPDATE` on the debate row).
- Evaluate stop conditions and compute the next step from cursor (or reconcile from turns if needed).
- Persist the new turn and update cursor/state **in the same transaction**.

This ensures at-most-one step advances at a time per debate, and the unique constraint provides a second line of defense.

## Streaming & Reconnect
SSE events already use turn UUIDs as `id`. The MVP makes reconnect deterministic:
- If the client provides `Last-Event-ID`, the server emits all turns “after” that id, then continues streaming new ones.
- The server uses a stable ordering (created timestamp + id tie-break) so replay is consistent.

## API Additions
Add a simple `GET /debates` endpoint for “background run” UX:
- Sort by `updated_at DESC`, return a small default limit.
- Include status + cursor fields to show progress.

## Web UX
Minimal UX additions:
- Debates list: show topic, status, updated time, and completed rounds.
- Debate view: reconnect to SSE using the last seen event id and keep the transcript consistent across refreshes.

