# local-development Spec Delta

## MODIFIED Requirements
### Requirement: Local infrastructure
The system SHALL provide a local development setup that runs Postgres and Redis, and can optionally run the full stack via Docker Compose.

#### Scenario: Developer starts full stack
- **WHEN** a developer runs Docker Compose for the project
- **THEN** Postgres and Redis are available for the API/worker
- **AND THEN** the API, worker, and web UI can be started within Docker without requiring local installs

### Requirement: Host-run services in development
The system SHALL support running the web UI, API service, and worker directly on the developer machine in local development, while relying on Docker Compose for infrastructure.

#### Scenario: Developer runs apps locally
- **WHEN** a developer starts local infrastructure via Docker Compose
- **THEN** the developer can run `apps/web`, `apps/api`, and `apps/worker` as local processes
- **AND THEN** those local processes connect to Postgres and Redis via environment variables

