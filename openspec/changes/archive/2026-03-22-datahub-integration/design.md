## Context

DataHub (by LinkedIn, now under the CNCF) is an open-source metadata platform for data discovery, governance, and lineage tracking. It provides a GraphQL-based API (Graph Metadata Service - GMS) that allows external systems to:

- Register and manage dataset entities (tables, views, streams, dashboards)
- Register data platform/source entities (databases, warehouses, APIs)
- Record dataset-to-dataset lineage edges

Currently, dataspec manages dataset, source, and flow definitions as YAML files in the workspace. When users define resources, they exist only within the dataspec workspace. There's no mechanism to publish this metadata to an external catalog.

**Stakeholders**: Data engineers who use dataspec for pipeline definitions and want DataHub to reflect their data platform for discoverability and governance.

## Goals / Non-Goals

**Goals:**

- Enable dataspec to connect to a DataHub instance via its GraphQL API
- Provide CLI commands to sync datasets, sources, and lineages to DataHub on-demand
- Map dataspec concepts (datasets, sources, flows) to DataHub entity models
- Support DataHub authentication via Bearer token
- Store DataHub connection configuration in `platform.yaml`

**Non-Goals:**

- Bidirectional sync (pulling metadata FROM DataHub into dataspec)
- Automatic sync on file changes (manual sync only via CLI)
- DataHub deployment or installation support
- Support for DataHub's MSP (Metadata Service Proxy) authentication

## Decisions

### 1. Use DataHub's GraphQL API directly

**Decision**: Implement a lightweight GraphQL client instead of using `@datahub/data-models` SDK.

**Rationale**: The official DataHub SDKs are tightly coupled and have shown API compatibility issues across versions. DataHub's GraphQL API is stable and well-documented. A minimal GraphQL client with typed operations is sufficient for our needs and avoids unnecessary dependencies.

**Alternatives considered**:

- `@datahub/data-models`: Official SDK - rejected due to coupling and version stability concerns
- REST API fallback: DataHub's REST API is secondary to GraphQL and less feature-complete

### 2. Store DataHub configuration in `platform.yaml`

**Decision**: Add a `datahub` section to `platform.yaml` with `gms_url` and optional `token`.

```yaml
datahub:
  gms_url: 'https://datahub.company.com/api/gms'
  token: '${DATAHUB_TOKEN}' # Supports env var reference
```

**Rationale**: Following existing dataspec patterns where platform-wide configurations live in `platform.yaml`. Keeps all platform configuration in one place.

**Alternatives considered**:

- Separate `datahub.yaml`:files configuration across files, goes against existing patterns
- CLI flags only: No persistent configuration, bad UX for repeated sync operations

### 3. Lineage mapping: dataspec flows → DataHub dataset lineage

**Decision**: Map each `transform` step to a dataset-to-dataset lineage edge in DataHub.

**Rationale**: In DataHub, dataset lineage is represented as edges between dataset entities. A dataspec flow with extract→transform→load creates:

- Extract: raw dataset (no lineage edge, it's a source)
- Transform: connects raw dataset → refined dataset (lineage edge)
- Load: connects refined dataset → serving dataset (lineage edge)

**Alternatives considered**:

- Map each step: Would create spurious lineage edges for extract/load which are data movement, not transformation
- Map only flow-level: Loses granularity within multi-step flows

### 4. CLI command structure: `dataspec datahub <subcommand>`

**Decision**: Use a command group `datahub` with subcommands: `connect`, `sync datasets`, `sync sources`, `sync lineage`.

**Rationale**: Follows existing CLI patterns (e.g., `git remote`, `docker container`). Each resource type has its own sync operation for flexibility.

**Alternatives considered**:

- Single `sync` command with flags: Less flexible, harder to extend
- `dataspec push datahub`: "Push" semantics assume directionality, less clear

### 5. Error handling: Fail fast with clear messages

**Decision**: CLI commands exit with code 1 and display detailed error messages on API failures.

**Rationale**: Sync operations are typically run in CI/CD or manual workflows. Clear errors help users debug authentication or network issues quickly.

## Risks / Trade-offs

- **[Risk] DataHub API changes** → Mitigation: Pin to specific DataHub API version, implement adapter pattern for breaking changes
- **[Risk] Large lineage graphs cause API timeouts** → Mitigation: Implement batching (50 entities per request), add `--dry-run` flag
- **[Risk] Invalid DataHub token exposes credentials** → Mitigation: Support environment variable reference (`${VAR}` syntax), never log tokens
- **[Trade-off] Manual sync vs. automatic**: Chose manual for simplicity and user control; automatic sync could be added later as a watcher

## Open Questions

1. Should we support DataHub's aspect system for extended metadata (ownership, tags, description)?
   This aspects would be defined in the dataspec metadata and synced as part of the dataset entity definition.

2. Do we need to handle DataHub's soft-delete behavior (deleted entities marked as removed)?
   For simplicity, we will not implement delete operations in the initial version. Syncing will only create/update entities. Deletion can be considered in a future enhancement.

3. Should the sync operation be idempotent (re-sync updates existing entities)?
   YES!
