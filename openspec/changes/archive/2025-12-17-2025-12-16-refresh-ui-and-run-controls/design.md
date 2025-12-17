# Design: Refresh UI and Run Controls

## Overview
This MVP focuses on two outcomes:
1) a modern, flat, light UI built on `Tailwind CSS` + `shadcn/ui`, and
2) clearer, more controllable debate execution that remains background-safe and reconnectable.

The project remains “persistence-first”: Postgres persisted turns are the source of truth, and the UI is a consumer that renders stored state + live events.

## UI Architecture

### Design Tokens (Light, Flat)
- Page background: `#FAF9F5` (paper)
- Surfaces/cards: `#FFFFFF`
- Border: warm neutral (e.g., `#E7E5E0`) at `1px`, no shadows
- Text: near-black for body, muted neutral for secondary
- Accent: `#237CC9` for CTA and focus states

Implementation details (apply stage):
- Use Tailwind for layout/spacing/typography.
- Use shadcn/ui components for form controls, dialog/drawer, toast, tabs, etc.
- Enforce “no shadow” via global component styles and Tailwind utility usage.

### Layout (Desktop-first, Responsive)
- **Left sidebar**: debate list, status chips, “New debate”.
- **Main**: transcript timeline with speaker sections (Debater A/B/Judge), auto-scroll toggle, and pinned final verdict card when available.
- **Right panel**: controls and settings:
  - Primary: Start/Stop/Resume/Cancel
  - Secondary: status/progress, errors, last event time
  - Advanced accordion: model overrides, per-step tokens, runtime limits.

On mobile:
- Sidebar and controls become drawers/sheets; transcript stays primary.

### Data Flow
- Initial page load fetches `GET /debates` (list) and `GET /debates/:id` (detail).
- Live updates: connect to SSE for the current debate.
  - Reconnect uses `Last-Event-ID` when available to replay missed turns.
  - Client maintains a local “last seen” event id, updated on each received turn.
- Polling is reduced to a lightweight fallback (or removed) once SSE resume is reliable.

## Run Controls & Orchestration

### Status Model
Keep a simple lifecycle that maps to user expectations:
- `created` → `running` → (`stopped` | `completed` | `failed` | `canceled`)

Semantics:
- **Stop/Pause**: do not enqueue additional steps after the current step completes.
- **Resume**: enqueue work for the next persisted cursor.
- **Cancel/Abort**: terminal; do not enqueue additional steps; does not run the judge by default.
- **Retry**: for `failed` debates, re-enqueue the next step after cursor reconciliation.

### Reliability Patterns
- Prefer idempotent advancement at the DB layer (unique step key) so retries do not duplicate turns.
- Add a per-debate “single-flight” lock for worker advancement to avoid concurrent cursor updates.
- Treat network/provider errors as retriable; validation/data-corruption errors as terminal.

## Docker & Environment
- Docker Compose remains the default for local stack.
- Web service runs production mode by default for consistent behavior; dev mode remains documented as an option.
