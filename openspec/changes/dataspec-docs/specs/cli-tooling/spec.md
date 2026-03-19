## ADDED Requirements

### Requirement: Provide model inspection command
The system SHALL provide a CLI command `dataspec inspect` that displays detailed information about platform resources.

#### Scenario: Inspect platform overview
- **WHEN** a user runs `dataspec inspect`
- **THEN** the CLI SHALL display a summary of the platform including resource counts and storage backends

#### Scenario: Inspect specific dataset
- **WHEN** a user runs `dataspec inspect dataset users_raw`
- **THEN** the CLI SHALL display detailed information about the specified dataset including layer, storage, contract, and producing/consuming flows

#### Scenario: Inspect specific flow
- **WHEN** a user runs `dataspec inspect flow users_pipeline`
- **THEN** the CLI SHALL display detailed information about the specified flow including steps, inputs, and outputs

#### Scenario: Inspect lineage
- **WHEN** a user runs `dataspec inspect lineage users_analytics`
- **THEN** the CLI SHALL display the upstream and downstream lineage for the specified dataset
