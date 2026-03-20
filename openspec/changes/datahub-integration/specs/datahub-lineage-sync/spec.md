# datahub-lineage-sync Specification

## Purpose
Synchronization of flow-defined lineages to DataHub's lineage graph. Maps dataspec flow steps (extract, transform, load) to DataHub's dataset-to-dataset lineage edges.

## ADDED Requirements

### Requirement: Sync lineages to DataHub
The system SHALL provide a CLI command `dataspec datahub sync lineage` that synchronizes flow-defined lineages to DataHub.

#### Scenario: Sync all lineages
- **WHEN** `dataspec datahub sync lineage` is executed
- **THEN** the CLI SHALL create or update all lineage edges in DataHub corresponding to dataspec flows

#### Scenario: Sync specific flow lineage
- **WHEN** `dataspec datahub sync lineage --flow users_etl` is executed
- **THEN** the CLI SHALL sync only the lineage edges for the `users_etl` flow

#### Scenario: Sync with dry-run
- **WHEN** `dataspec datahub sync lineage --dry-run` is executed
- **THEN** the CLI SHALL output what would be synced without making any changes to DataHub

### Requirement: Flow-to-lineage mapping
The system SHALL map dataspec flow steps to DataHub dataset lineage edges.

#### Scenario: Map transform step to lineage edge
- **WHEN** a flow with a `transform` step reading from `users_raw` and writing to `users_refined` is synced
- **THEN** the CLI SHALL create a DataHub lineage edge from `users_raw` to `users_refined`

#### Scenario: Map multi-step flow lineage
- **WHEN** a flow with steps extract(orders_raw) → transform(orders_raw → orders_refined) → load(orders_refined → orders_serving) is synced
- **THEN** the CLI SHALL create two lineage edges: `orders_raw` → `orders_refined` and `orders_refined` → `orders_serving`

#### Scenario: Map load step to lineage edge
- **WHEN** a flow with a `load` step reading from `users_refined` and writing to `users_serving` is synced
- **THEN** the CLI SHALL create a DataHub lineage edge from `users_refined` to `users_serving`

### Requirement: Lineage edge metadata
The system SHALL include flow metadata on lineage edges.

#### Scenario: Lineage edge with flow name
- **WHEN** a lineage edge is created for flow `users_etl`
- **THEN** the CLI SHALL set the DataHub lineage edge metadata to include the flow name and type `dataspec`

#### Scenario: Lineage edge with timestamp
- **WHEN** a lineage edge is created
- **THEN** the CLI SHALL set the `createdAt` timestamp on the lineage aspect

### Requirement: Lineage sync error handling
The system SHALL handle errors during lineage sync gracefully.

#### Scenario: Missing dataset reference
- **WHEN** a flow references a dataset that doesn't exist in dataspec
- **THEN** the CLI SHALL skip the affected lineage edge and log a warning

#### Scenario: Lineage with unresolved datasets
- **WHEN** syncing lineage and one flow references an unknown dataset
- **THEN** the CLI SHALL log a warning and continue processing other lineage edges

#### Scenario: Batch processing for large lineage graphs
- **WHEN** syncing more than 50 lineage edges
- **THEN** the CLI SHALL process them in batches to avoid API timeouts
