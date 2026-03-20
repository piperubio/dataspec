# datahub-cli Specification

## Purpose
CLI commands for managing DataHub integration: `dataspec datahub connect`, `dataspec datahub sync datasets`, `dataspec datahub sync sources`, `dataspec datahub sync lineage`.

## ADDED Requirements

### Requirement: DataHub CLI command group
The system SHALL provide a `dataspec datahub` command group with subcommands for DataHub operations.

#### Scenario: DataHub help output
- **WHEN** `dataspec datahub --help` is executed
- **THEN** the CLI SHALL display help information for the datahub command group including available subcommands

### Requirement: Connect command
The system SHALL provide `dataspec datahub connect` to validate DataHub connection.

#### Scenario: Connect with default configuration
- **WHEN** `dataspec datahub connect` is executed
- **THEN** the CLI SHALL use configuration from `platform.yaml` and attempt to connect to DataHub

#### Scenario: Connect with custom URL
- **WHEN** `dataspec datahub connect --gms-url "https://custom-datahub.example.com/api/gms"` is executed
- **THEN** the CLI SHALL attempt to connect to the specified URL

### Requirement: Sync datasets command
The system SHALL provide `dataspec datahub sync datasets` to sync datasets to DataHub.

#### Scenario: Sync datasets help
- **WHEN** `dataspec datahub sync datasets --help` is executed
- **THEN** the CLI SHALL display help for the sync datasets command including available options

#### Scenario: Sync datasets with name filter
- **WHEN** `dataspec datahub sync datasets --name "users_raw"` is executed
- **THEN** the CLI SHALL sync only the specified dataset

#### Scenario: Sync datasets with dry-run
- **WHEN** `dataspec datahub sync datasets --dry-run` is executed
- **THEN** the CLI SHALL output planned changes without executing them

#### Scenario: Sync datasets with incremental
- **WHEN** `dataspec datahub sync datasets --incremental` is executed
- **THEN** the CLI SHALL sync only datasets modified since last sync

### Requirement: Sync sources command
The system SHALL provide `dataspec datahub sync sources` to sync sources to DataHub.

#### Scenario: Sync sources help
- **WHEN** `dataspec datahub sync sources --help` is executed
- **THEN** the CLI SHALL display help for the sync sources command

#### Scenario: Sync sources with name filter
- **WHEN** `dataspec datahub sync sources --name "production_db"` is executed
- **THEN** the CLI SHALL sync only the specified source

#### Scenario: Sync sources with dry-run
- **WHEN** `dataspec datahub sync sources --dry-run` is executed
- **THEN** the CLI SHALL output planned changes without executing them

### Requirement: Sync lineage command
The system SHALL provide `dataspec datahub sync lineage` to sync lineages to DataHub.

#### Scenario: Sync lineage help
- **WHEN** `dataspec datahub sync lineage --help` is executed
- **THEN** the CLI SHALL display help for the sync lineage command

#### Scenario: Sync lineage for specific flow
- **WHEN** `dataspec datahub sync lineage --flow "users_etl"` is executed
- **THEN** the CLI SHALL sync only the lineage for the specified flow

#### Scenario: Sync lineage with dry-run
- **WHEN** `dataspec datahub sync lineage --dry-run` is executed
- **THEN** the CLI SHALL output planned changes without executing them

### Requirement: Global datahub flags
The system SHALL support common flags across all datahub subcommands.

#### Scenario: Override gms-url globally
- **WHEN** any datahub subcommand is executed with `--gms-url` flag
- **THEN** the CLI SHALL use the provided URL instead of configuration file

#### Scenario: Override token globally
- **WHEN** any datahub subcommand is executed with `--token` flag
- **THEN** the CLI SHALL use the provided token instead of configuration or environment

#### Scenario: JSON output format
- **WHEN** any datahub subcommand is executed with `--format json` flag
- **THEN** the CLI SHALL output results in JSON format
