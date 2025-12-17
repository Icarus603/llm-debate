# llm-debate

Two debaters debate a topic round-by-round and a judge produces a final verdict. The debate runs in the background (Celery), persists every step to Postgres, and streams updates to the UI via SSE.

## Repo layout
- `apps/web`: Next.js UI (pnpm)
- `apps/api`: FastAPI service (Python/uv)
- `apps/worker`: Celery worker (Python/uv)
- `src/llm_debate`: shared backend code (API + worker)

## Docker (recommended)

### 1) Configure env
```bash
cp .env.example .env
```
Set `DEEPSEEK_API_KEY` in `.env`.

### 2) Build + run
```bash
docker compose up -d --build
```

Open:
- Web UI: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`

Stop:
```bash
docker compose down
```

Reset Docker DB (destructive):
```bash
docker compose down -v
```

Note: `docker-compose.yml` does not expose Postgres/Redis ports to the host (avoids port conflicts). If you need host access, use:
```bash
docker compose -f docker-compose.yml -f docker-compose.host.yml up -d --build
```

## Local development (no Docker)

This repo can also run fully on your machine.

### 1) Install + start Postgres + Redis (Homebrew)
```bash
brew install postgresql@17 redis
brew services start postgresql@17
brew services start redis
```

### 2) Create database (first time only)
```bash
createdb llm_debate
```

### 3) Configure env
```bash
cp .env.example .env
```
Set `DEEPSEEK_API_KEY` in `.env`.

### 4) Python: install + migrate + run
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

### 5) Web: install + run
```bash
pnpm -C apps/web install
pnpm -C apps/web dev
```

Open `http://localhost:3000`.

## UI tour (current MVP)
- Left: debates list (search + status chips + delete).
- Center: transcript timeline (live-updating).
- Right: controls (start/stop/resume/cancel/retry).

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
If `curl http://localhost:8000/...` returns an empty reply, you may have a proxy configured for localhost. Use `--noproxy '*'` or set `NO_PROXY=localhost,127.0.0.1`.
