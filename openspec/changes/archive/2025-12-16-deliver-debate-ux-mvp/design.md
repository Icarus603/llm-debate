# Design: Debate UX MVP

## Overview
This MVP focuses on making the existing end-to-end flow usable and navigable:
- A debate has a stable, shareable identity (`debate_id`) and a first-class detail page.
- The transcript is still the source of truth (persisted `turns`), streamed to the UI via SSE.
- Judge output is treated as a structured verdict (stored in `turn.metadata`) with a UI rendering contract.
- Small, explicit run configuration is supported per debate via `debate.settings` overrides (starting with model ids).

This is intentionally not a “production architecture” redesign. It is incremental: keep Postgres as truth, keep Celery for background execution, and keep SSE for live UI.

## Data Model & Contracts

### Debate Settings (per-debate overrides)
We keep `debates.settings` as JSONB, but define a typed subset the API accepts/returns.

Proposed keys (all optional overrides unless noted):
- `debater_a_side` (string, one of `pro|con`, default `pro`) (set via the frontend create flow)
- `max_rounds` (int, default 5)
- `max_runtime_seconds` (int, default 600)
- `max_total_output_tokens` (int, default 8000)
- `max_tokens_debater` (int, default 600)
- `max_tokens_judge` (int, default 400)
- `model_debater` (string, default from env `DEEPSEEK_MODEL_DEBATER`)
- `model_judge` (string, default from env `DEEPSEEK_MODEL_JUDGE`)
- `prompt_version` (string, default `v1`) (optional for this MVP; used to make prompt behavior reproducible)
- `judge_mode` (string, default `end`) (optional; for this MVP the default behavior is Judge-at-end)

Worker selection precedence:
`debate.settings[model_*]` (if present) → environment defaults.

Stance rules:
- If `debater_a_side=pro`, Debater A argues for the topic and Debater B argues against.
- If `debater_a_side=con`, Debater A argues against the topic and Debater B argues for.

### Judge Verdict (structured)
Judge turns already persist verdict-like metadata. This MVP standardizes a stable contract:
- `metadata.score_a` (0–10)
- `metadata.score_b` (0–10)
- `metadata.winner` in `{a,b,tie}`
- `metadata.no_new_substantive_arguments` (boolean)
- `metadata.summary` (string)

UI rule:
- Render a “Verdict” card for `actor=judge` using these metadata fields when present.
- Still render `turn.content` as the human-readable summary (source of truth for transcript display).

## API & UI Interaction

### Read flow
The UI needs two kinds of reads:
1. “Discovery”: list recent debates (already `GET /debates`).
2. “Detail”: fetch a debate with its turns (`GET /debates/{id}`) and subscribe to SSE (`GET /debates/{id}/events`).

For status/progress updates while a debate runs, this MVP prefers a simple strategy:
- Continue streaming only turns via SSE.
- Poll the debate detail (or a lightweight `GET /debates/{id}`) on a low cadence while the SSE connection is open (e.g., every 2–5 seconds).

This avoids adding a second SSE event type while still keeping UI state accurate.

### Navigation
Next.js adds:
- `/` for “create + list”
- `/debates/[id]` for “detail + transcript + controls”

The list links to detail pages (deep-linkable/shareable).

## Background Execution & Status Semantics
Status expectations:
- `created` → `running` after start/resume
- `running` → `completed|failed|stopped`
- `stopping` is a transient state used for “stop after current step”

Judge scheduling:
- Debater turns run for each round while stop conditions are not met.
- After completion due to stop conditions (for example `max_rounds`), the system runs a single Judge step to produce a final verdict and then marks the debate completed.
- Manual stop may end the debate without a final judge verdict in this MVP.

The UI should surface:
- `status`, `stop_reason`, `last_error`
- basic progress: completed rounds derived from cursor fields

## Testing & Validation
Minimum coverage for this MVP:
- API schema validation for accepted `settings` keys (reject unknown / wrong types).
- Worker uses per-debate model override precedence.
- Web renders judge verdict card based on metadata (unit/component test if existing tooling supports it; otherwise manual smoke described in tasks).
