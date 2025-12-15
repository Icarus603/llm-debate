# debate-runtime Specification

## Purpose
TBD - created by archiving change add-llm-debate-scaffold. Update Purpose after archive.
## Requirements
### Requirement: Debate lifecycle
The system SHALL allow a user to create a debate and run it in discrete, persisted steps.

#### Scenario: User creates a debate
- **WHEN** a user provides a topic and debate settings
- **THEN** the system creates a new debate with an initial empty transcript

#### Scenario: Debate runs step-by-step
- **WHEN** the debate is started
- **THEN** the system executes Debater A, Debater B, and Judge steps in order
- **AND THEN** each step persists a turn result to Postgres before the next step begins

### Requirement: Persisted turns as source of truth
The system SHALL persist each debate step as a discrete "turn" record, which acts as the source of truth for orchestration and replay.

#### Scenario: Worker resumes from persisted state
- **WHEN** a worker task retries or the user resumes a debate
- **THEN** the worker determines the next step based on the last persisted turn(s)

### Requirement: Background-safe execution
The system SHALL support running debates while the UI is disconnected.

#### Scenario: UI disconnects during run
- **WHEN** the user closes the browser during an active debate
- **THEN** the worker continues executing remaining steps
- **AND THEN** the user can reconnect and view the full persisted transcript

### Requirement: Stop conditions
The system SHALL stop debate execution when a configured stop condition is met.

#### Scenario: Max rounds reached
- **WHEN** the debate reaches the configured maximum number of rounds
- **THEN** the system stops enqueuing further debate steps

### Requirement: Default stop conditions
The system SHALL provide safe default stop conditions for new debates.

#### Scenario: New debate uses default limits
- **WHEN** a user creates a debate without overriding stop condition settings
- **THEN** the debate uses `max_rounds = 5`
- **AND THEN** the debate uses `max_runtime_seconds = 600`
- **AND THEN** the debate uses `max_total_output_tokens = 8000`

### Requirement: Per-step output limits
The system SHALL cap output length for each debate step.

#### Scenario: Step output uses defaults
- **WHEN** the worker runs a Debater step with no per-step overrides
- **THEN** the Debater step uses `max_tokens = 600`
- **AND WHEN** the worker runs a Judge step with no per-step overrides
- **THEN** the Judge step uses `max_tokens = 400`

### Requirement: Judge early-stop
The system SHALL support ending the debate early based on Judge evaluation.

#### Scenario: Debate ends due to lack of new arguments
- **WHEN** the Judge reports "no new substantive arguments" for 2 consecutive rounds
- **THEN** the system stops enqueuing further debate steps

### Requirement: Manual stop
The system SHALL allow a user to stop an active debate run.

#### Scenario: User stops a debate
- **WHEN** the user requests "Stop"
- **THEN** the worker completes the current in-progress step (if any)
- **AND THEN** the system stops enqueuing further debate steps

