# debate-runtime Specification

## Purpose
TBD - created by archiving change add-llm-debate-scaffold. Update Purpose after archive.
## Requirements
### Requirement: Debate lifecycle
The system SHALL allow a user to create a debate and run it in discrete, persisted steps.

#### Scenario: Debate runs debater rounds and judges at end by default
- **WHEN** the debate is started
- **THEN** the system executes Debater A and Debater B steps in order for each round
- **AND THEN** each step persists a turn result to Postgres before the next step begins
- **AND WHEN** the debate reaches completion due to a stop condition (for example `max_rounds`)
- **THEN** the system executes a single Judge step to produce a final verdict by default
- **AND THEN** the debate transitions to a terminal status

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

### Requirement: Manual stop
The system SHALL allow a user to stop (pause) an active debate run and later resume.

#### Scenario: User stops a debate
- **WHEN** the user requests “Stop”
- **THEN** the system marks the debate as `stopping`
- **AND THEN** the worker completes the current in-progress step (if any)
- **AND THEN** the system stops enqueuing further debate steps
- **AND THEN** the debate transitions to `stopped`

#### Scenario: User resumes a stopped debate
- **GIVEN** a debate is `stopped`
- **WHEN** the user requests “Resume”
- **THEN** the system enqueues the next step from the persisted cursor
- **AND THEN** the debate transitions to `running`

### Requirement: Idempotent step advancement
The system SHALL ensure that each debate step (debate, round, actor) is persisted at most once, even under task retries or duplicate deliveries.

#### Scenario: Duplicate task delivery does not duplicate turns
- **GIVEN** a debate is running and the next step is available
- **WHEN** two worker tasks attempt to advance the same debate step
- **THEN** at most one turn is persisted for that (debate, round, actor)
- **AND THEN** the debate continues from the next step without corruption

### Requirement: Persisted next-step cursor
The system SHALL persist an explicit "next step" cursor for each debate to support efficient, reliable advancement.

#### Scenario: Worker advances from cursor
- **GIVEN** a debate has `next_round` and `next_actor` persisted
- **WHEN** the worker advances the debate
- **THEN** the worker uses the cursor to determine the step to execute
- **AND THEN** the worker updates the cursor atomically with the persisted turn

#### Scenario: Cursor reconciliation from turns
- **GIVEN** a debate cursor is missing or inconsistent
- **WHEN** the worker resumes the debate
- **THEN** the worker recomputes the next step from persisted turns
- **AND THEN** the worker repairs the persisted cursor before continuing

### Requirement: Debate discovery
The system SHALL allow a user to discover existing debates and their current status.

#### Scenario: User lists debates
- **WHEN** the user requests a list of debates
- **THEN** the system returns recent debates including status and basic progress information

### Requirement: Per-debate model overrides
The system SHALL allow overriding the DeepSeek model id for Debaters and Judge on a per-debate basis via persisted debate settings.

#### Scenario: Debate uses default models
- **GIVEN** a debate is created without specifying model overrides
- **WHEN** the worker runs Debater and Judge steps
- **THEN** the worker uses the environment-configured models (`DEEPSEEK_MODEL_DEBATER` and `DEEPSEEK_MODEL_JUDGE`)

#### Scenario: Debate overrides models via settings
- **GIVEN** a debate has `settings.model_debater` and/or `settings.model_judge`
- **WHEN** the worker runs Debater and Judge steps
- **THEN** the worker uses the per-debate model ids from settings for the corresponding actor

### Requirement: Structured judge verdict metadata
The system SHALL persist a structured Judge verdict for each Judge turn in turn metadata for reliable UI rendering.

#### Scenario: Judge verdict metadata is present
- **WHEN** the Judge step completes successfully
- **THEN** the persisted Judge turn includes verdict metadata keys: `summary`, `score_a`, `score_b`, `winner`, and `no_new_substantive_arguments`
- **AND THEN** the persisted Judge turn `content` remains a human-readable summary suitable for transcript display

#### Scenario: Judge output is invalid JSON
- **GIVEN** the Judge step returns invalid JSON
- **WHEN** the system persists the Judge turn
- **THEN** the system persists fallback verdict metadata with a safe default winner and scores
- **AND THEN** the system continues execution according to stop conditions without crashing

### Requirement: Explicit pro/con stances
The system SHALL support explicit pro/con stances for Debater A and Debater B based on a user-selected stance configured in the frontend at debate creation time.

#### Scenario: User selects Debater A stance
- **WHEN** a user creates a debate in the UI and selects Debater A as "pro" or "con"
- **THEN** the debate persists the selected stance in debate settings
- **AND THEN** Debater B uses the opposite stance for the same topic

#### Scenario: Prompts reflect stances
- **GIVEN** a debate has a persisted Debater A stance
- **WHEN** the worker runs Debater A and Debater B steps
- **THEN** Debater A's prompt instructs it to argue for its stance
- **AND THEN** Debater B's prompt instructs it to argue for the opposing stance

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

#### Scenario: Retry scope is next-step only
- **GIVEN** a debate is `failed` with persisted turns
- **WHEN** the user requests “Retry”
- **THEN** the system enqueues only the next step derived from the persisted cursor
- **AND THEN** the system does not rewind or re-run previously persisted steps

### Requirement: Explicit state categories
The system SHALL treat debate statuses as either non-terminal or terminal to prevent unexpected restarts.

#### Scenario: Terminal states block start/resume
- **GIVEN** a debate is in a terminal state (`completed` or `canceled`)
- **WHEN** the user requests “Start” or “Resume”
- **THEN** the system does not enqueue additional steps

### Requirement: Persisted step timing metadata
The system SHALL persist per-step execution timing in turn metadata when a step completes.

#### Scenario: Turn includes duration metadata
- **WHEN** the system persists a completed turn
- **THEN** the turn metadata includes `duration_ms` (or equivalent) for that step when available

