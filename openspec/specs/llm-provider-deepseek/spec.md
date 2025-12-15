# llm-provider-deepseek Specification

## Purpose
TBD - created by archiving change add-llm-debate-scaffold. Update Purpose after archive.
## Requirements
### Requirement: DeepSeek OpenAI-compatible client
The system SHALL integrate with DeepSeek using its OpenAI-compatible API shape for chat completions.

#### Scenario: Worker requests a completion
- **WHEN** the worker submits a `model` and `messages` to DeepSeek
- **THEN** the system receives an assistant message suitable for appending to the debate transcript

### Requirement: Configurable base URL and model selection
The system SHALL allow configuring DeepSeek `base_url` and model IDs through environment variables.

#### Scenario: Switch models without code changes
- **WHEN** a developer changes the configured model ID
- **THEN** new debate turns use the updated model selection

### Requirement: Reasoning privacy
The system SHALL NOT display private reasoning fields (for example, `reasoning_content`) in the UI by default.

#### Scenario: Reasoning is hidden
- **WHEN** DeepSeek returns a response that includes private reasoning fields
- **THEN** the UI only shows the public `content`

