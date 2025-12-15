## ADDED Requirements

### Requirement: Local infrastructure
The system SHALL provide a local development setup that runs Postgres and Redis.

#### Scenario: Developer starts infra
- **WHEN** a developer starts local infrastructure
- **THEN** Postgres is available for the API/worker
- **AND THEN** Redis is available as a Celery broker

### Requirement: Host-run services in development
The system SHALL support running the web UI, API service, and worker directly on the developer machine in local development, while relying on Docker Compose only for infrastructure services.

#### Scenario: Developer runs apps locally
- **WHEN** a developer starts local infrastructure via Docker Compose
- **THEN** the developer can run `apps/web`, `apps/api`, and `apps/worker` as local processes
- **AND THEN** those local processes connect to Postgres and Redis via environment variables

### Requirement: Environment configuration
The system SHALL support configuring database, Redis, and DeepSeek settings via environment variables.

#### Scenario: Developer configures environment
- **WHEN** a developer sets environment variables for URLs and credentials
- **THEN** the API and worker can connect without code changes
