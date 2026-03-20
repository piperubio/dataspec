# datahub-dataset-sync Specification

## Purpose
Synchronization of dataset definitions from dataspec to DataHub's dataset entities. Maps dataspec dataset concepts (name, storage, schema) to DataHub's dataset entity model.

## ADDED Requirements

### Requirement: Sync datasets to DataHub
The system SHALL provide a CLI command `dataspec datahub sync datasets` that synchronizes all dataset definitions to DataHub.

#### Scenario: Sync all datasets
- **WHEN** `dataspec datahub sync datasets` is executed
- **THEN** the CLI SHALL create or update all dataset entities in DataHub corresponding to dataspec datasets

#### Scenario: Sync specific dataset
- **WHEN** `dataspec datahub sync datasets --name users_raw` is executed
- **THEN** the CLI SHALL sync only the `users_raw` dataset to DataHub

#### Scenario: Sync with dry-run
- **WHEN** `dataspec datahub sync datasets --dry-run` is executed
- **THEN** the CLI SHALL output what would be synced without making any changes to DataHub

### Requirement: Dataset entity mapping
The system SHALL map dataspec dataset properties to DataHub dataset entity aspects.

#### Scenario: Map dataset name and platform
- **WHEN** a dataspec dataset `users_raw` with storage type `s3` is synced
- **THEN** the CLI SHALL create a DataHub dataset entity with `name: "users_raw"` and `platform: "s3"`

#### Scenario: Map dataset description and tags
- **WHEN** a dataspec dataset with `description: "Raw user data"` and `tags: ["pii", "users"]` is synced
- **THEN** the CLI SHALL set the `description` and `tags` aspects on the DataHub entity

#### Scenario: Map dataset storage configuration
- **WHEN** a dataspec dataset with storage `type: "s3"`, `bucket: "data-lake"`, `path: "raw/users"` is synced
- **THEN** the CLI SHALL include these details in the dataset's metadata aspects

### Requirement: Incremental dataset sync
The system SHALL support syncing only datasets that have changed since last sync.

#### Scenario: Incremental sync with modification detection
- **WHEN** `dataspec datahub sync datasets --since "2024-01-01T00:00:00Z"` is executed
- **THEN** the CLI SHALL sync only datasets modified after the specified timestamp

#### Scenario: Incremental sync based on file modification
- **WHEN** `dataspec datahub sync datasets --incremental` is executed
- **THEN** the CLI SHALL determine the last sync time from internal state and sync only changed datasets

### Requirement: Dataset sync error handling
The system SHALL handle errors during dataset sync gracefully.

#### Scenario: Partial sync failure
- **WHEN** syncing 10 datasets and the 5th fails
- **THEN** the CLI SHALL continue syncing the remaining 5 and report the failure at the end

#### Scenario: Batch processing for large datasets
- **WHEN** syncing more than 50 datasets
- **THEN** the CLI SHALL process them in batches of 50 to avoid API timeouts
