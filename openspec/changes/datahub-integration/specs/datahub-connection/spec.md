# datahub-connection Specification

## Purpose
Configuration and connection management for DataHub's GraphQL API. Handles authentication, endpoint configuration, and connection health checks.

## ADDED Requirements

### Requirement: DataHub configuration in platform.yaml
The system SHALL support a `datahub` section in `platform.yaml` with `gms_url` and optional `token` fields.

#### Scenario: DataHub configuration with token
- **WHEN** `platform.yaml` contains a `datahub` section with `gms_url: "https://datahub.example.com/api/gms"` and `token: "secret-token"`
- **THEN** the system SHALL store these values as the DataHub connection configuration

#### Scenario: DataHub configuration with environment variable reference
- **WHEN** `platform.yaml` contains a `datahub` section with `gms_url` and `token: "${DATAHUB_TOKEN}"`
- **THEN** the system SHALL resolve the token from the `DATAHUB_TOKEN` environment variable at runtime

#### Scenario: DataHub configuration without token
- **WHEN** `platform.yaml` contains a `datahub` section with only `gms_url`
- **THEN** the system SHALL treat the configuration as unauthenticated (public DataHub instance)

### Requirement: DataHub connection validation
The system SHALL provide a mechanism to validate the DataHub connection before sync operations.

#### Scenario: Valid DataHub connection
- **WHEN** `dataspec datahub connect` is executed with a valid `gms_url` and valid token
- **THEN** the CLI SHALL exit with code 0 and output a success message with the DataHub version

#### Scenario: Invalid DataHub URL
- **WHEN** `dataspec datahub connect` is executed with an unreachable `gms_url`
- **THEN** the CLI SHALL exit with code 1 and output a connection error message

#### Scenario: Invalid DataHub token
- **WHEN** `dataspec datahub connect` is executed with an invalid or expired token
- **THEN** the CLI SHALL exit with code 1 and output an authentication error message

### Requirement: DataHub configuration overrides
The system SHALL support CLI-level configuration overrides for `gms_url` and `token`.

#### Scenario: Override gms_url via CLI flag
- **WHEN** `dataspec datahub sync datasets --gms-url "https://other-datahub.example.com/api/gms"` is executed
- **THEN** the CLI SHALL use the provided URL instead of the one in `platform.yaml`

#### Scenario: Override token via CLI flag
- **WHEN** `dataspec datahub sync datasets --token "override-token"` is executed
- **THEN** the CLI SHALL use the provided token instead of the one in `platform.yaml` or environment variable
