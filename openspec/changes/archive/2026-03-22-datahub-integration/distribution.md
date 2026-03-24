# Agent Distribution Plan: datahub-integration

## Architecture

DataHub integration is a **separate package** (`@dataspec/dataspec-datahub`) that depends on `@dataspec/dataspec-core`. CLI commands live in `@dataspec/dataspec-cli` and import from the datahub package.

```
packages/
├── dataspec-core/          # Core types, schemas, validators
├── dataspec-datahub/       # NEW: DataHub integration
│   ├── src/
│   │   ├── index.ts        # Package exports
│   │   ├── client.ts       # GraphQL client
│   │   ├── config.ts       # Configuration loader
│   │   ├── types.ts        # DataHub-specific types
│   │   └── sync/           # Sync modules
│   └── package.json        # depends on @dataspec/dataspec-core
└── dataspec-cli/           # CLI commands (imports from datahub package)
```

## Overview

47 tasks distributed across **3 agents** with ownership boundaries and sync protocols.

| Agent                | Focus                                           | Tasks | Expected Files                                        |
| -------------------- | ----------------------------------------------- | ----- | ----------------------------------------------------- |
| **A** (Foundation)   | Package setup + Config + GraphQL Client + Types | 14    | `dataspec-datahub/src/{config,client,types}.ts`       |
| **B** (Sync Modules) | Dataset + Source + Lineage Sync                 | 16    | `dataspec-datahub/src/sync/*.ts`                      |
| **C** (Integration)  | CLI + Testing                                   | 17    | `dataspec-cli/src/commands/datahub.ts`, `__tests__/*` |

## Agent A: Foundation (Config + GraphQL Client)

**Responsibility**: Create the `@dataspec/dataspec-datahub` package with foundational infrastructure.

**File Ownership**:

- `packages/dataspec-datahub/package.json`
- `packages/dataspec-datahub/src/index.ts`
- `packages/dataspec-datahub/src/config.ts`
- `packages/dataspec-datahub/src/client.ts`
- `packages/dataspec-datahub/src/types.ts`
- `packages/dataspec-core/src/schemas/platform.schema.json` (schema update)

**Assigned Tasks**:

### Phase 1: Setup + Config

- [x] 1.1 Create `@dataspec/dataspec-datahub` package with package.json
- [x] 1.2 Create `packages/dataspec-datahub/src/` directory structure
- [x] 1.3 Create `packages/dataspec-datahub/src/client.ts` for GraphQL client
- [x] 1.4 Create `packages/dataspec-datahub/src/types.ts` for DataHub types
- [x] 2.1 Update platform.schema.json in core to support `datahub` section
- [x] 2.2 Create `packages/dataspec-datahub/src/config.ts` for configuration loading
- [x] 2.3 Implement environment variable resolution for `token` field
- [x] 2.4 Add validation for required `gms_url` field

### Phase 2: GraphQL Client

- [x] 3.1 Implement DataHub GraphQL client with authentication
- [x] 3.2 Add `ingestDataset` mutation for dataset sync
- [x] 3.3 Add `ingestDataPlatform` mutation for source sync
- [x] 3.4 Add `ingestLineage` mutation for lineage sync
- [x] 3.5 Implement connection health check (version query)
- [x] 3.6 Add retry logic and error handling for API calls

### Unit Tests (Phase 4)

- [x] 8.1 Unit tests in `packages/dataspec-datahub/src/__tests__/client.test.ts`

**Deliverables for other agents**:

- `types.ts`: Shared types for DataHub entities (used by B)
- `client.ts`: Configured GraphQL client with auth (used by B, C)
- `config.ts`: Configuration loader (used by C)
- Health check function (used by C for `connect` command)
- Package exports from `@dataspec/dataspec-datahub`

---

## Agent B: Sync Modules (Dataset + Source + Lineage)

**Responsibility**: Implement all sync logic in `@dataspec/dataspec-datahub`.

**File Ownership**:

- `packages/dataspec-datahub/src/sync/datasets.ts`
- `packages/dataspec-datahub/src/sync/sources.ts`
- `packages/dataspec-datahub/src/sync/lineage.ts`
- `packages/dataspec-datahub/src/__tests__/datasets.test.ts`
- `packages/dataspec-datahub/src/__tests__/sources.test.ts`
- `packages/dataspec-datahub/src/__tests__/lineage.test.ts`

**Assigned Tasks**:

### Dataset Sync (after 3.2)

- [ ] 4.1 Create `packages/dataspec-datahub/src/sync/datasets.ts`
- [ ] 4.2 Map dataspec dataset to DataHub dataset entity aspects
- [ ] 4.3 Implement `syncDatasets()` function with batch processing (50 per batch)
- [ ] 4.4 Add `--name` filter support for single dataset sync
- [ ] 4.5 Add `--incremental` flag with last-sync timestamp tracking

### Source Sync (after 3.3)

- [ ] 5.1 Create `packages/dataspec-datahub/src/sync/sources.ts`
- [ ] 5.2 Map dataspec source to DataHub data platform entity
- [ ] 5.3 Map source entities to DataHub container entities
- [ ] 5.4 Implement `syncSources()` function
- [ ] 5.5 Add `--name` filter support for single source sync
- [ ] 5.6 Handle unknown source types gracefully with warning

### Lineage Sync (after 3.4)

- [ ] 6.1 Create `packages/dataspec-datahub/src/sync/lineage.ts`
- [ ] 6.2 Map dataspec flow steps to DataHub lineage edges
- [ ] 6.3 Implement transform step → lineage edge mapping
- [ ] 6.4 Implement load step → lineage edge mapping
- [ ] 6.5 Implement `syncLineage()` function with batch processing
- [ ] 6.6 Add `--flow` filter support for single flow lineage sync
- [ ] 6.7 Handle missing dataset references with warnings

### Unit Tests (Phase 4)

- [ ] 8.2 Unit tests for dataset sync mapping
- [ ] 8.3 Unit tests for source sync mapping
- [ ] 8.4 Unit tests for lineage sync mapping

**Dependencies on Agent A**:

- `types.ts` for DataHub entity types
- `client.ts` for GraphQL client instance
- `@dataspec/dataspec-datahub` package exports

**Deliverables for Agent C**:

- `syncDatasets()` function (used by CLI command 7.3)
- `syncSources()` function (used by CLI command 7.4)
- `syncLineage()` function (used by CLI command 7.5)
- Package exports from `@dataspec/dataspec-datahub`

---

## Agent C: Integration (CLI + Testing)

**Responsibility**: Build CLI commands in `@dataspec/dataspec-cli` that import from `@dataspec/dataspec-datahub`.

**File Ownership**:

- `packages/dataspec-cli/src/commands/datahub.ts`
- `packages/dataspec-cli/src/commands/datahub/*.ts` (if split)
- `packages/dataspec-cli/__tests__/integration/datahub*.test.ts`
- `packages/dataspec-cli/__tests__/e2e/datahub*.test.ts`

**Dependencies**:

- `packages/dataspec-cli/package.json` must add `@dataspec/dataspec-datahub: workspace:*`

**Assigned Tasks**:

### CLI Commands (after 7.1 depends on config, 7.2-7.5 depend on Agent B sync functions)

- [ ] 7.1 Create `packages/dataspec-cli/src/commands/datahub.ts` command group
- [ ] 7.2 Implement `dataspec datahub connect` command
- [ ] 7.3 Implement `dataspec datahub sync datasets` command
- [ ] 7.4 Implement `dataspec datahub sync sources` command
- [ ] 7.5 Implement `dataspec datahub sync lineage` command
- [ ] 7.6 Add global `--gms-url` and `--token` flags to all subcommands
- [ ] 7.7 Add `--dry-run` flag to all sync commands
- [ ] 7.8 Add `--format json` output support
- [ ] 7.9 Add `--help` support for all commands

### Integration + E2E Tests (after CLI complete)

- [ ] 8.5 Integration tests for CLI commands (mock DataHub API)
- [ ] 8.6 E2E test for full sync workflow

**Dependencies on Agent A**:

- `@dataspec/dataspec-datahub` package exports (config, client)

**Dependencies on Agent B**:

- `syncDatasets()` for 7.3
- `syncSources()` for 7.4
- `syncLineage()` for 7.5

---

## Execution Timeline

```
Phase 1 ──── Agent A: tasks 1.x, 2.x
             Agent B: (waiting)
             Agent C: (waiting)

Phase 2 ──── Agent A: tasks 3.x (GraphQL client)
             Agent B: (waiting for 3.2, 3.3, 3.4)
             Agent C: (waiting)

Phase 2b ─── Agent A: (done with code)
             Agent B: tasks 4.x, 5.x, 6.x (sync modules)
             Agent C: (waiting for B's exports)

Phase 3 ──── Agent A: (done)
             Agent B: (done with code)
             Agent C: tasks 7.x (CLI commands)

Phase 4 ──── Agent A: task 8.1
             Agent B: tasks 8.2, 8.3, 8.4
             Agent C: tasks 8.5, 8.6
```

## Sync Protocol

### Handoff Points

| After Agent | Deliverables                                                                     | Consumed By |
| ----------- | -------------------------------------------------------------------------------- | ----------- |
| A (Phase 1) | `@dataspec/dataspec-datahub` package exports                                     | B, C        |
| A (Phase 2) | GraphQL mutations: ingestDataset, ingestDataPlatform, ingestLineage, healthCheck | B, C        |
| B (Phase 2) | syncDatasets(), syncSources(), syncLineage()                                     | C           |

### Communication Contract

Agents should use these imports:

```typescript
// Agent B imports from A's package
import {
  DataHubClient,
  DataHubConfig,
  DatasetEntity,
  SourceEntity,
  LineageEdge,
  loadConfig,
} from '@dataspec/dataspec-datahub';

// Agent C imports from A and B's package
import {
  DataHubClient,
  loadConfig,
  syncDatasets,
  syncSources,
  syncLineage,
} from '@dataspec/dataspec-datahub';
```

### File Conflict Avoidance

| File/Package                                     | Owner                     | Other Agents |
| ------------------------------------------------ | ------------------------- | ------------ |
| `packages/dataspec-datahub/src/config.ts`        | A                         | Read-only    |
| `packages/dataspec-datahub/src/client.ts`        | A                         | Read-only    |
| `packages/dataspec-datahub/src/types.ts`         | A                         | Read-only    |
| `packages/dataspec-datahub/src/index.ts`         | A                         | Read-only    |
| `packages/dataspec-datahub/src/sync/*.ts`        | B                         | Read-only    |
| `packages/dataspec-cli/src/commands/datahub*.ts` | C                         | Read-only    |
| `packages/dataspec-datahub/src/__tests__/*`      | Each agent owns their own | —            |
| `packages/dataspec-cli/__tests__/*`              | C                         | —            |

## Risk: Bottleneck Analysis

| Risk                    | Mitigation                                                |
| ----------------------- | --------------------------------------------------------- |
| Agent A blocks B and C  | A has highest priority; starts immediately                |
| Agent B blocks C        | B's Phase 2 tasks are parallelizable (4.x, 5.x, 6.x)      |
| Type changes break B/C  | Agent A defines types first; changes require notification |
| Test data conflicts     | Each agent uses isolated test fixtures                    |
| Package exports missing | A must export all types/functions from index.ts           |
