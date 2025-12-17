# event-streaming Specification

## Purpose
TBD - created by archiving change add-llm-debate-scaffold. Update Purpose after archive.
## Requirements
### Requirement: Live updates via SSE
The system SHALL provide a server-sent events (SSE) endpoint for streaming debate updates to the UI, including replay for reconnecting clients.

#### Scenario: UI reconnects without missing turns
- **GIVEN** the UI has rendered at least one turn event
- **WHEN** the UI reconnects to the same SSE stream after a disconnect
- **THEN** the UI can replay missed turns using `Last-Event-ID`
- **AND THEN** the server replays all persisted turns after that id in stable order
- **AND THEN** the server continues streaming new turn events as they are persisted

### Requirement: Reconnectable streaming
The system SHALL allow the UI to reconnect and continue receiving updates for the same debate, without missing persisted turns.

#### Scenario: Browser refreshes mid-debate
- **WHEN** the user refreshes the page
- **THEN** the UI can re-subscribe to SSE and continue receiving subsequent turn events

#### Scenario: Client replays missed events using Last-Event-ID
- **GIVEN** a client previously received a turn event with an SSE event id
- **WHEN** the client reconnects and supplies that id via `Last-Event-ID`
- **THEN** the server replays all persisted turns after that id in stable order
- **AND THEN** the server continues streaming new turn events as they are persisted

