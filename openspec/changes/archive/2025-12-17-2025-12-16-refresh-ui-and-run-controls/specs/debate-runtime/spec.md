# debate-runtime Spec Delta

## ADDED Requirements
### Requirement: Cancel/abort a debate
The system SHALL allow a user to cancel an in-progress or paused debate, transitioning it to a terminal “canceled” state.

#### Scenario: User cancels a running debate
- **GIVEN** a debate is `running`
- **WHEN** the user requests “Cancel”
- **THEN** the system marks the debate as `canceled`
- **AND THEN** the system does not enqueue additional steps

#### Scenario: Canceled debate does not run judge by default
- **GIVEN** a debate is `canceled`
- **WHEN** the system evaluates stop behavior
- **THEN** the system does not execute the final Judge step by default

### Requirement: Retry failed debate execution
The system SHALL allow retrying a failed debate run in a safe, idempotent way.

#### Scenario: User retries a failed debate
- **GIVEN** a debate is `failed`
- **WHEN** the user requests “Retry”
- **THEN** the system reconciles the next-step cursor from persisted turns (if needed)
- **AND THEN** the system re-enqueues the next step without duplicating previously persisted turns

## MODIFIED Requirements
### Requirement: Manual stop
The system SHALL allow a user to stop (pause) an active debate run and later resume.

#### Scenario: User stops a debate
- **WHEN** the user requests “Stop”
- **THEN** the worker completes the current in-progress step (if any)
- **AND THEN** the system stops enqueuing further debate steps
- **AND THEN** the debate transitions to `stopped`

#### Scenario: User resumes a stopped debate
- **GIVEN** a debate is `stopped`
- **WHEN** the user requests “Resume”
- **THEN** the system enqueues the next step from the persisted cursor
- **AND THEN** the debate transitions to `running`

