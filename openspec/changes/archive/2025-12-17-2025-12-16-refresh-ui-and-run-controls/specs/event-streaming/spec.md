# event-streaming Spec Delta

## MODIFIED Requirements
### Requirement: Live updates via SSE
The system SHALL provide a server-sent events (SSE) endpoint for streaming debate updates to the UI, including replay for reconnecting clients.

#### Scenario: UI reconnects without missing turns
- **GIVEN** the UI has rendered at least one turn event
- **WHEN** the UI reconnects to the same SSE stream after a disconnect
- **THEN** the UI can replay missed turns using `Last-Event-ID`
- **AND THEN** the server replays all persisted turns after that id in stable order
- **AND THEN** the server continues streaming new turn events as they are persisted

