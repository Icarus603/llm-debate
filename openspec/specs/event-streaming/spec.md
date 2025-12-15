# event-streaming Specification

## Purpose
TBD - created by archiving change add-llm-debate-scaffold. Update Purpose after archive.
## Requirements
### Requirement: Live updates via SSE
The system SHALL provide a server-sent events (SSE) endpoint for streaming debate updates to the UI.

#### Scenario: UI receives new turns
- **WHEN** a debate produces a new persisted turn
- **THEN** the SSE stream emits an event describing the new turn
- **AND THEN** the UI can render the update without polling separate endpoints

### Requirement: Reconnectable streaming
The system SHALL allow the UI to reconnect and continue receiving updates for the same debate.

#### Scenario: Browser refreshes mid-debate
- **WHEN** the user refreshes the page
- **THEN** the UI can re-subscribe to SSE and continue receiving subsequent turn events

