## MODIFIED Requirements
### Requirement: Live updates via SSE
The system SHALL provide a server-sent events (SSE) endpoint for streaming debate updates to the UI.

#### Scenario: UI receives new turns
- **WHEN** a debate produces a new persisted turn
- **THEN** the SSE stream emits an event describing the new turn
- **AND THEN** the UI can render the update without polling separate endpoints

#### Scenario: UI reconnects without missing turns
- **GIVEN** the UI has rendered at least one turn event
- **WHEN** the UI reconnects to the same SSE stream after a disconnect
- **THEN** the UI can replay missed turns using `Last-Event-ID` or an equivalent `after` cursor

