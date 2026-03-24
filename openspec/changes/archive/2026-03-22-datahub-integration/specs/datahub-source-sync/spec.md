# datahub-source-sync Specification

## Purpose

Synchronization of source definitions from dataspec to DataHub's data platform entities. Maps dataspec source concepts (type, entities) to DataHub's data platform metadata.

## ADDED Requirements

### Requirement: Sync sources to DataHub

The system SHALL provide a CLI command `dataspec datahub sync sources` that synchronizes source definitions to DataHub.

#### Scenario: Sync all sources

- **WHEN** `dataspec datahub sync sources` is executed
- **THEN** the CLI SHALL create or update all data platform entities in DataHub corresponding to dataspec sources

#### Scenario: Sync specific source

- **WHEN** `dataspec datahub sync sources --name production_db` is executed
- **THEN** the CLI SHALL sync only the `production_db` source to DataHub

#### Scenario: Sync with dry-run

- **WHEN** `dataspec datahub sync sources --dry-run` is executed
- **THEN** the CLI SHALL output what would be synced without making any changes to DataHub

### Requirement: Source entity mapping

The system SHALL map dataspec source properties to DataHub data platform and container entities.

#### Scenario: Map source type to platform

- **WHEN** a dataspec source `production_db` with type `database` is synced
- **THEN** the CLI SHALL create a DataHub data platform entity with type `database`

#### Scenario: Map source entities to containers

- **WHEN** a dataspec source `production_db` with entities `["users", "orders"]` is synced
- **THEN** the CLI SHALL create container entities for each entity within the platform

#### Scenario: Map source metadata

- **WHEN** a dataspec source with `description: "Production PostgreSQL database"` and `tags: ["production"]` is synced
- **THEN** the CLI SHALL set the `description` and `tags` aspects on the DataHub entity

### Requirement: Source sync error handling

The system SHALL handle errors during source sync gracefully.

#### Scenario: Partial sync failure

- **WHEN** syncing multiple sources and one fails
- **THEN** the CLI SHALL continue syncing the remaining sources and report the failure at the end

#### Scenario: Unknown source type

- **WHEN** a dataspec source with type `custom_type` (not in the allowed set) is synced
- **THEN** the CLI SHALL skip the source and log a warning with the source name
