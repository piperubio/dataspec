## 1. Project Setup

- [x] 1.1 Create `@dataspec/dataspec-datahub` package with package.json
- [x] 1.2 Create `packages/dataspec-datahub/src/` directory structure
- [x] 1.3 Create `packages/dataspec-datahub/src/client.ts` for GraphQL client
- [x] 1.4 Create `packages/dataspec-datahub/src/types.ts` for DataHub types

## 2. DataHub Configuration

- [x] 2.1 Update platform.schema.json in core to support `datahub` section
- [x] 2.2 Create `packages/dataspec-datahub/src/config.ts` for configuration loading
- [x] 2.3 Implement environment variable resolution for `token` field
- [x] 2.4 Add validation for required `gms_url` field

## 3. GraphQL Client Implementation

- [x] 3.1 Implement DataHub GraphQL client with authentication
- [x] 3.2 Add `ingestDataset` mutation for dataset sync
- [x] 3.3 Add `ingestDataPlatform` mutation for source sync
- [x] 3.4 Add `ingestLineage` mutation for lineage sync
- [x] 3.5 Implement connection health check (version query)
- [x] 3.6 Add retry logic and error handling for API calls

## 4. Dataset Sync Implementation

- [x] 4.1 Create `packages/dataspec-datahub/src/sync/datasets.ts`
- [x] 4.2 Map dataspec dataset to DataHub dataset entity aspects
- [x] 4.3 Implement `syncDatasets()` function with batch processing (50 per batch)
- [x] 4.4 Add `--name` filter support for single dataset sync
- [x] 4.5 Add `--incremental` flag with last-sync timestamp tracking

## 5. Source Sync Implementation

- [x] 5.1 Create `packages/dataspec-datahub/src/sync/sources.ts`
- [x] 5.2 Map dataspec source to DataHub data platform entity
- [x] 5.3 Map source entities to DataHub container entities
- [x] 5.4 Implement `syncSources()` function
- [x] 5.5 Add `--name` filter support for single source sync
- [x] 5.6 Handle unknown source types gracefully with warning

## 6. Lineage Sync Implementation

- [x] 6.1 Create `packages/dataspec-datahub/src/sync/lineage.ts`
- [x] 6.2 Map dataspec flow steps to DataHub lineage edges
- [x] 6.3 Implement transform step → lineage edge mapping
- [x] 6.4 Implement load step → lineage edge mapping
- [x] 6.5 Implement `syncLineage()` function with batch processing
- [x] 6.6 Add `--flow` filter support for single flow lineage sync
- [x] 6.7 Handle missing dataset references with warnings

## 7. CLI Commands

- [x] 7.1 Create `packages/dataspec-cli/src/commands/datahub.ts` command group
- [x] 7.2 Implement `dataspec datahub connect` command
- [x] 7.3 Implement `dataspec datahub sync datasets` command
- [x] 7.4 Implement `dataspec datahub sync sources` command
- [x] 7.5 Implement `dataspec datahub sync lineage` command
- [x] 7.6 Add global `--gms-url` and `--token` flags to all subcommands
- [x] 7.7 Add `--dry-run` flag to all sync commands
- [x] 7.8 Add `--format json` output support
- [x] 7.9 Add `--help` support for all commands

## 8. Testing

- [x] 8.1 Unit tests in `packages/dataspec-datahub/src/__tests__/client.test.ts`
- [x] 8.2 Unit tests for dataset sync mapping
- [x] 8.3 Unit tests for source sync mapping
- [x] 8.4 Unit tests for lineage sync mapping
- [x] 8.5 Integration tests for CLI commands (mock DataHub API)
- [x] 8.6 E2E test for full sync workflow
