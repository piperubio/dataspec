# Task Dependency Analysis: datahub-integration

## Dependency Graph

```
Phase 1 (Foundation):
  1.1 ──→ 1.2 ──→ 1.3, 1.4
  2.1 ──→ 2.2 ──→ 2.3, 2.4

Phase 2 (Core - Parallel after Phase 1):
  3.x (GraphQL Client) ──depends──→ 1.x, 2.x
  4.x (Dataset Sync) ──depends──→ 3.x
  5.x (Source Sync) ──depends──→ 3.x
  6.x (Lineage Sync) ──depends──→ 3.x

Phase 3 (Integration):
  7.x (CLI Commands) ──depends──→ 2.x, 4.x, 5.x, 6.x

Phase 4 (Validation):
  8.x (Testing) ──depends──→ 3.x, 4.x, 5.x, 6.x, 7.x
```

## Task Dependencies Detail

| Task                            | Depends On         | Phase | Parallelizable With |
| ------------------------------- | ------------------ | ----- | ------------------- |
| 1.1 Add graphql-request dep     | —                  | 1     | 2.1                 |
| 1.2 Create directory structure  | 1.1                | 1     | 2.2                 |
| 1.3 Create client.ts            | 1.2                | 1     | 2.3, 2.4            |
| 1.4 Create types.ts             | 1.2                | 1     | 2.3, 2.4, 1.3       |
| 2.1 Update platform.yaml schema | —                  | 1     | 1.1                 |
| 2.2 Create config.ts            | 2.1                | 1     | 1.2                 |
| 2.3 Env var resolution          | 2.2                | 1     | 1.3                 |
| 2.4 Validate gms_url            | 2.2                | 1     | 1.3                 |
| 3.1 Implement GraphQL client    | 1.3, 1.4, 2.2      | 2     | —                   |
| 3.2 ingestDataset mutation      | 3.1                | 2     | —                   |
| 3.3 ingestDataPlatform mutation | 3.1                | 2     | —                   |
| 3.4 ingestLineage mutation      | 3.1                | 2     | —                   |
| 3.5 Health check query          | 3.1                | 2     | —                   |
| 3.6 Retry + error handling      | 3.1                | 2     | —                   |
| 4.1 Create datasets.ts          | 3.2                | 2     | 5.1, 6.1            |
| 4.2 Dataset → DataHub mapping   | 4.1                | 2     | —                   |
| 4.3 syncDatasets() + batching   | 4.2                | 2     | —                   |
| 4.4 --name filter               | 4.3                | 2     | —                   |
| 4.5 --incremental flag          | 4.3                | 2     | —                   |
| 5.1 Create sources.ts           | 3.3                | 2     | 4.1, 6.1            |
| 5.2 Source → DataHub mapping    | 5.1                | 2     | —                   |
| 5.3 Source entities mapping     | 5.2                | 2     | —                   |
| 5.4 syncSources()               | 5.3                | 2     | —                   |
| 5.5 --name filter               | 5.4                | 2     | —                   |
| 5.6 Unknown source types        | 5.4                | 2     | —                   |
| 6.1 Create lineage.ts           | 3.4                | 2     | 4.1, 5.1            |
| 6.2 Flow steps → edges          | 6.1                | 2     | —                   |
| 6.3 Transform step mapping      | 6.2                | 2     | —                   |
| 6.4 Load step mapping           | 6.2                | 2     | —                   |
| 6.5 syncLineage() + batching    | 6.3, 6.4           | 2     | —                   |
| 6.6 --flow filter               | 6.5                | 2     | —                   |
| 6.7 Missing dataset warnings    | 6.5                | 2     | —                   |
| 7.1 Create datahub.ts cmd group | 2.2                | 3     | —                   |
| 7.2 connect command             | 7.1, 3.5           | 3     | —                   |
| 7.3 sync datasets command       | 7.1, 4.4, 4.5      | 3     | —                   |
| 7.4 sync sources command        | 7.1, 5.5           | 3     | —                   |
| 7.5 sync lineage command        | 7.1, 6.6           | 3     | —                   |
| 7.6 Global --gms-url/--token    | 7.2, 7.3, 7.4, 7.5 | 3     | —                   |
| 7.7 --dry-run flag              | 7.3, 7.4, 7.5      | 3     | —                   |
| 7.8 --format json               | 7.3, 7.4, 7.5      | 3     | —                   |
| 7.9 --help support              | 7.2                | 3     | —                   |
| 8.1 Unit tests: GraphQL client  | 3.6                | 4     | 8.2, 8.3, 8.4       |
| 8.2 Unit tests: dataset sync    | 4.5                | 4     | 8.1, 8.3, 8.4       |
| 8.3 Unit tests: source sync     | 5.6                | 4     | 8.1, 8.2, 8.4       |
| 8.4 Unit tests: lineage sync    | 6.7                | 4     | 8.1, 8.2, 8.3       |
| 8.5 Integration tests: CLI      | 7.8                | 4     | —                   |
| 8.6 E2E test: full sync         | 8.5                | 4     | —                   |

## Critical Path

```
1.1 → 1.2 → 1.3 → 3.1 → 3.2 → 4.1 → 4.2 → 4.3 → 4.5 → 7.3 → 7.8 → 8.5 → 8.6
                                                                                          (27 tasks on critical path)
```

## Parallelism Opportunities

1. **Phase 1**: Tasks 1.x and 2.x run in parallel (setup vs config)
2. **Phase 2**: Tasks 4.x, 5.x, 6.x run in parallel after 3.x completes
3. **Phase 4**: Tasks 8.1–8.4 run in parallel; 8.5–8.6 are sequential

## Agent Sync Points

| Sync Point          | Trigger                       | Agents Affected                   |
| ------------------- | ----------------------------- | --------------------------------- |
| After Phase 1       | GraphQL client + config ready | Agent B, C wait for Agent A       |
| After Phase 2 (3.x) | GraphQL mutations ready       | Agent B, C can start sync modules |
| After Phase 2 (4-6) | All sync modules ready        | All agents converge for CLI       |
| After Phase 3       | CLI complete                  | All agents can write tests        |
