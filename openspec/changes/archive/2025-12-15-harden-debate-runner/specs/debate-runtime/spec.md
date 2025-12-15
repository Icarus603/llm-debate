## ADDED Requirements
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

