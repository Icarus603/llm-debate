# llm-debate

Two debaters debate a topic round-by-round and a judge produces a final verdict. The debate runs in the background (Celery), persists every step to Postgres, and streams updates to the UI via SSE.

## Repo layout
- `apps/web`: Next.js UI (pnpm)
- `apps/api`: FastAPI service (Python/uv)
- `apps/worker`: Celery worker (Python/uv)
- `src/llm_debate`: shared backend code (API + worker)

## Local development

### Option A: Docker (recommended)
This runs Postgres, Redis, API, worker, and web UI in Docker. You do not need Redis installed locally.

```bash
export DEEPSEEK_API_KEY=your_key
docker compose up -d --build
```

Open `http://localhost:3000`.

The Docker web container runs in production mode (`next build` + `next start`) for consistent behavior. For hot-reload UI development, use Option B.

## UI tour (current MVP)
- Left: debates list (search + status chips).
- Center: transcript timeline (live-updating).
- Right: controls (start/stop/resume/cancel/retry) and a pinned final verdict when present.

Stop everything:
```bash
docker compose down
```

### Option B: Host-run apps + Docker infra

### 1) Start infrastructure
```bash
docker compose -f docker-compose.yml -f docker-compose.host.yml up -d postgres redis
```

### 2) Configure env
```bash
cp .env.example .env
```

### 3) Python: install + migrate + run
```bash
uv sync
uv run alembic upgrade head

uv run uvicorn llm_debate.api.main:app --reload --port 8000
uv run celery -A llm_debate.worker.celery_app worker -l info
```

Reset dev DB (destructive):
```bash
./scripts/dev_reset_db.sh
```

### 4) Web: install + run
```bash
pnpm -C apps/web install
pnpm -C apps/web dev
```

Open `http://localhost:3000`.

## Quality gates
```bash
uv run ruff check . --fix
uv run mypy .
uv run pytest -q

pnpm -C apps/web lint
pnpm -C apps/web typecheck
```

## Manual smoke test
Requires API + worker running:
```bash
uv run python scripts/smoke_e2e.py
```

## Advanced configuration (API-only)
Per-debate model overrides can be set on `POST /debates` via `settings.model_debater` and `settings.model_judge`.

## Troubleshooting
- Port conflicts: only the web (`3000`) and api (`8000`) ports are published by default; if you use `docker-compose.host.yml`, Postgres (`5432`) and Redis (`6379`) are also published.
- Reset local state (destructive): `docker compose down -v` removes the Postgres volume and clears all debates.
