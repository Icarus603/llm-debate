# web-ui Spec Delta

## ADDED Requirements
### Requirement: Flat light design system
The system SHALL present a flat, light UI theme suitable for long-form reading and live monitoring.

#### Scenario: User opens the UI
- **WHEN** the user visits the web UI
- **THEN** the page background uses `#FAF9F5`
- **AND THEN** primary surfaces use `#FFFFFF`
- **AND THEN** the UI uses flat 1px borders (no shadows/elevation)

### Requirement: Structured layout for monitoring
The system SHALL provide a stable layout that separates navigation, transcript reading, and run controls.

#### Scenario: User monitors a running debate
- **GIVEN** a debate exists
- **WHEN** the user views the debate detail page
- **THEN** the UI provides distinct areas for: debate list/navigation, transcript, and controls/settings
- **AND THEN** the transcript remains readable and scrollable independent of controls

### Requirement: Advanced settings panel
The system SHALL provide an “Advanced” UI panel for per-debate runtime settings without cluttering the primary controls.

#### Scenario: User configures an advanced setting
- **WHEN** the user opens the advanced panel
- **THEN** the UI allows optional configuration of model overrides and stop/output limits
- **AND THEN** the UI submits these settings during debate creation or update

## MODIFIED Requirements
### Requirement: Status and error visibility while running
The system SHALL surface debate status, stop reason, last error, and streaming connection status in the UI while a debate runs in the background.

#### Scenario: User monitors a running debate
- **GIVEN** a debate is running
- **WHEN** the user views the debate detail page
- **THEN** the UI shows current status and progress (round/actor cursor or completed rounds)
- **AND THEN** the UI shows the SSE connection state (connected/reconnecting)
- **AND THEN** if the debate fails, the UI shows the last error message and a retry action

