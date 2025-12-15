## MODIFIED Requirements
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

