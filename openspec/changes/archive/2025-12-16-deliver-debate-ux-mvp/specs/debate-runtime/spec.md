## ADDED Requirements
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

## MODIFIED Requirements
### Requirement: Debate lifecycle
The system SHALL allow a user to create a debate and run it in discrete, persisted steps.

#### Scenario: Debate runs debater rounds and judges at end by default
- **WHEN** the debate is started
- **THEN** the system executes Debater A and Debater B steps in order for each round
- **AND THEN** each step persists a turn result to Postgres before the next step begins
- **AND WHEN** the debate reaches completion due to a stop condition (for example `max_rounds`)
- **THEN** the system executes a single Judge step to produce a final verdict by default
- **AND THEN** the debate transitions to a terminal status

## REMOVED Requirements
### Requirement: Judge early-stop
**Reason**: With “Judge-at-end by default”, per-round judge evaluation is not available to drive early-stop.

#### Scenario: Per-round judge early-stop is not applied by default
- **GIVEN** a debate is running with default settings
- **WHEN** debater rounds progress
- **THEN** the system does not end early based on consecutive per-round judge "no new substantive arguments" signals
