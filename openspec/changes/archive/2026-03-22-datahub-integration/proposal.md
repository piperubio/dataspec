## Why

DataHub (by LinkedIn) is a widely-used metadata platform for data discovery, governance, and lineage tracking. Integrating dataspec with DataHub enables teams to automatically sync their data platform definitions (datasets, sources, flows/lineages) to a central metadata catalog, improving data discovery and governance across the organization.

This integration eliminates manual metadata documentation and ensures DataHub always reflects the current state of the data platform as defined in dataspec.

## What Changes

- Add DataHub as a new integration target for the data platform
- Support pushing dataset definitions to DataHub's dataset registry
- Support pushing source definitions to DataHub's data platform metadata
- Support pushing lineage information to DataHub's lineage graph
- Add CLI commands to sync resources to DataHub on-demand
- Support configurable sync behavior (full sync vs. incremental)

## Capabilities

### New Capabilities

- `datahub-connection`: Configuration and connection management for DataHub's GraphQL API. Handles authentication, endpoint configuration, and connection health checks.
- `datahub-dataset-sync`: Synchronization of dataset definitions from dataspec to DataHub's dataset entities. Maps dataspec dataset concepts (name, storage, schema) to DataHub's dataset entity model.
- `datahub-source-sync`: Synchronization of source definitions from dataspec to DataHub's data platform entities. Maps dataspec source concepts (type, entities) to DataHub's data platform metadata.
- `datahub-lineage-sync`: Synchronization of flow-defined lineages to DataHub's lineage graph. Maps dataspec flow steps (extract, transform, load) to DataHub's dataset-to-dataset lineage edges.
- `datahub-cli`: CLI commands for managing DataHub integration: `dataspec datahub connect`, `dataspec datahub sync datasets`, `dataspec datahub sync sources`, `dataspec datahub sync lineage`.

### Modified Capabilities

- `cli-tooling`: Extend with new `datahub` subcommand group containing DataHub-specific operations.

## Impact

- **New dependency**: `@datahub/data-models` SDK or direct GraphQL client for DataHub API communication
- **New configuration**: `platform.yaml` can now include a `datahub` section with `gms_url` and optional `token`
- **New CLI commands**: Adds `dataspec datahub` command group
- **Affected resources**: Datasets, sources, and flows will gain an optional `datahub` metadata flag for sync control
