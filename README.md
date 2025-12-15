# llm-debate

Two debaters and a judge debate a topic. The debate runs in the background (Celery), persists every step to Postgres, and streams updates to the UI via SSE.

## Repo layout
- `apps/web`: Next.js UI (pnpm)
- `apps/api`: FastAPI service (Python/uv)
- `apps/worker`: Celery worker (Python/uv)
- `src/llm_debate`: shared backend code (API + worker)

## Local development

### 1) Start infrastructure
```bash
docker compose up -d
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
