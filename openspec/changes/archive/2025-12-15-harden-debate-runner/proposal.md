# Proposal: Harden Debate Runner

## Why
The current runner works for a happy-path demo but can produce duplicate turns or confusing UI behavior under retries, concurrent task deliveries, and client reconnects. The next MVP should make debate execution and streaming resilient so “live-turn-by-turn” and “runs in background” are dependable.

## Goals
- Make step advancement idempotent under Celery retries and duplicate deliveries.
- Introduce an explicit, persisted “next step” state so the worker does not need to infer progress from a full turn scan.
- Make SSE reconnect deterministic: a client can reconnect with `Last-Event-ID` and not miss turns.
- Expose minimal “background run” UX: list debates with status/progress and jump into a debate.

## Non-goals
- WebSockets or token-by-token streaming.
- Multi-tenant auth, permissions, or sharing.
- Production deployment, scaling, or queue observability tooling (Flower, etc.).
- Streaming partial “in-progress” LLM output.

## What Changes
- Database: add a uniqueness guarantee for turns per (debate, round, actor); add persisted cursor fields on the debate for `next_round` and `next_actor` (and minimal stop metadata).
- Worker: advance debates under a transaction/lock; write turn + cursor updates atomically; stop cleanly with explicit reasons; avoid duplicate enqueues.
- API: add `GET /debates` for a lightweight “background debates” list; update `/events` semantics to support `Last-Event-ID` replay by turn id.
- Web: add a debates list panel showing status and basic progress; improve SSE reconnect handling.

## Acceptance Criteria
- No duplicate turns are persisted for the same (debate, round, actor) under retries or concurrent deliveries.
- A debate can be stopped and will not enqueue further steps after the current step finishes.
- SSE reconnect with `Last-Event-ID` replays missed turns and continues streaming new ones.
- UI can show a list of existing debates and their status, and opening a debate displays a complete transcript.

## Impact / Risks
- Requires a schema migration.
- Cursor fields must be kept consistent with turns; implementation should reconcile from turns when needed (e.g., legacy rows or corruption).

