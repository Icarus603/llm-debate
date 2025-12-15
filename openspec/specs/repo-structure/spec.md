# repo-structure Specification

## Purpose
TBD - created by archiving change add-llm-debate-scaffold. Update Purpose after archive.
## Requirements
### Requirement: Monorepo layout
The system SHALL organize the project as a single repository containing a web UI, an API service, and a background worker.

#### Scenario: Repo structure exists
- **WHEN** a developer clones the repository
- **THEN** the repository contains `apps/web`, `apps/api`, and `apps/worker`
- **AND THEN** each app has a clear, documented entrypoint for local development

### Requirement: Shared conventions
The system SHALL document shared development conventions for Python and Node tooling, including the Node package manager choice (pnpm).

#### Scenario: Conventions are discoverable
- **WHEN** a developer searches for “how to run” or “how to lint/typecheck”
- **THEN** the repository provides a single place describing required commands and environment variables

