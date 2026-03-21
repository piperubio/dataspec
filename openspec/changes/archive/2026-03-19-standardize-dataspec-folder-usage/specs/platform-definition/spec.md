# platform-definition Specification (Delta)

## MODIFIED Requirements

### Requirement: Define global platform architecture

The system SHALL provide a mechanism to declare the global data platform architecture in a `platform.yaml` file located inside the `dataspec/` folder.

#### Scenario: Platform configuration file exists

- **WHEN** a file named `platform.yaml` exists inside the `dataspec/` folder
- **THEN** the system SHALL parse the file and extract platform-wide configurations

#### Scenario: Platform configuration not found

- **WHEN** no `platform.yaml` file exists inside the `dataspec/` folder
- **THEN** the system SHALL treat this as an invalid configuration with an error indicating the expected location

#### Scenario: Legacy platform configuration at root

- **WHEN** a `platform.yaml` file exists at the workspace root (outside `dataspec/`)
- **THEN** the system SHALL NOT parse it and SHALL emit a warning suggesting migration to `dataspec/platform.yaml`

## ADDED Requirements

### Requirement: Platform configuration location validation

The system SHALL validate that the platform configuration is located in the correct folder.

#### Scenario: Valid platform configuration location

- **WHEN** `platform.yaml` is located at `dataspec/platform.yaml`
- **THEN** the system SHALL accept and parse the configuration

#### Scenario: Invalid platform configuration location

- **WHEN** `platform.yaml` is found at any location other than `dataspec/platform.yaml`
- **THEN** the system SHALL reject the configuration and emit an error indicating the correct location
