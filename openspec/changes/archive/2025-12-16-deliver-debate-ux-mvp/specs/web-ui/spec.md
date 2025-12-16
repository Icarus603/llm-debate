## ADDED Requirements
### Requirement: Deep-linkable debate detail view
The system SHALL provide a web UI route that renders a single debate by id so a user can reload or share the URL and continue watching the debate.

#### Scenario: User opens debate detail by URL
- **GIVEN** a debate id exists
- **WHEN** the user navigates to `/debates/<id>`
- **THEN** the UI fetches debate details and renders the full persisted transcript
- **AND THEN** the UI subscribes to live updates so new turns appear without manual refresh

### Requirement: Debate discovery and navigation
The system SHALL provide a web UI view that lists recent debates and allows navigating to a selected debate.

#### Scenario: User navigates from list to detail
- **WHEN** the user views the home page
- **THEN** the UI shows a list of recent debates with status and basic progress
- **AND WHEN** the user selects a debate
- **THEN** the UI navigates to that debate’s detail route

### Requirement: Stance selection at creation
The system SHALL allow the user to select Debater A’s stance (pro or con) when creating a debate.

#### Scenario: User creates a debate with a stance
- **WHEN** the user creates a new debate in the UI
- **THEN** the UI provides a control to choose "Debater A: Pro" or "Debater A: Con"
- **AND THEN** the UI sends the selected stance to the API as part of debate creation

### Requirement: Judge verdict rendering
The system SHALL render Judge turns with a structured verdict UI derived from persisted turn metadata.

#### Scenario: Verdict card is shown for Judge turns
- **GIVEN** a debate transcript includes a Judge turn with verdict metadata
- **WHEN** the UI renders the transcript
- **THEN** the UI displays winner and scores (A/B) and a short summary for that Judge turn

### Requirement: Status and error visibility while running
The system SHALL surface debate status, stop reason, and last error in the UI while a debate runs in the background.

#### Scenario: User monitors a running debate
- **GIVEN** a debate is running
- **WHEN** the user views the debate detail page
- **THEN** the UI shows current status and progress (round/actor cursor or completed rounds)
- **AND THEN** if the debate fails, the UI shows the last error message
