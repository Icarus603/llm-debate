# Design: llm-debate scaffold

## Summary
Build a monorepo with a Next.js UI, a FastAPI backend, and a Celery worker. Debates run as background tasks (Celery) and persist each step to Postgres. The UI receives live updates via a FastAPI SSE endpoint that streams persisted events/turns.

## Architecture

### Components
- **Web (`apps/web`)**: Chat-style UI, debate controls, SSE client.
- **API (`apps/api`)**: CRUD for debates, SSE endpoint, enqueue/start/stop controls.
- **Worker (`apps/worker`)**: Celery tasks that execute debate steps and write results to Postgres.
- **Postgres**: Source of truth for debate state.
- **Redis**: Celery broker (and optional lightweight pub/sub later, if needed).

### Data flow (happy path)
1. User creates a debate (topic + settings) in the UI.
2. API stores the debate and enqueues the first background step.
3. Worker runs Debater A, writes turn output to Postgres, enqueues Debater B.
4. Worker runs Debater B, writes output, enqueues Judge.
5. Worker runs Judge, writes scoring/summary, checks stop conditions, enqueues next round if needed.
6. UI subscribes to SSE and renders new turns as they appear.

## Key decisions

### Persistence-first eventing
SSE should stream from Postgres-backed state (polling inside SSE is acceptable initially) so:
- Background runs don’t depend on keeping a socket open.
- The UI can reconnect safely.
- The system remains debuggable and replayable.

### Worker does LLM calls
DeepSeek calls happen inside Celery tasks (not request handlers) to avoid request timeouts and support retries.

### “Separate chain-of-thought” handling
DeepSeek may return fields such as `reasoning_content` (depending on model/options). Requirements should treat these as **private**:
- Not displayed in the UI.
- Not logged by default.
- Persisted only if explicitly enabled for debugging.

## Resolved decisions
- Local development runs `apps/web`, `apps/api`, and `apps/worker` on-host; Docker Compose runs only Postgres and Redis.
- Debate orchestration persists each step as a "turn" record; UI renders transcript from persisted turns.
