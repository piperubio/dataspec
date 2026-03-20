## 1. Project Setup

- [ ] 1.1 Add GraphQL client dependency (graphql-request) to package.json
- [ ] 1.2 Create `src/integrations/datahub/` directory structure
- [ ] 1.3 Create `src/integrations/datahub/client.ts` for GraphQL client
- [ ] 1.4 Create `src/integrations/datahub/types.ts` for DataHub types

## 2. DataHub Configuration

- [ ] 2.1 Update platform.yaml schema to support `datahub` section
- [ ] 2.2 Create `src/integrations/datahub/config.ts` for configuration loading
- [ ] 2.3 Implement environment variable resolution for `token` field
- [ ] 2.4 Add validation for required `gms_url` field

## 3. GraphQL Client Implementation

- [ ] 3.1 Implement DataHub GraphQL client with authentication
- [ ] 3.2 Add `ingestDataset` mutation for dataset sync
- [ ] 3.3 Add `ingestDataPlatform` mutation for source sync
- [ ] 3.4 Add `ingestLineage` mutation for lineage sync
- [ ] 3.5 Implement connection health check (version query)
- [ ] 3.6 Add retry logic and error handling for API calls

## 4. Dataset Sync Implementation

- [ ] 4.1 Create `src/integrations/datahub/sync/datasets.ts`
- [ ] 4.2 Map dataspec dataset to DataHub dataset entity aspects
- [ ] 4.3 Implement `syncDatasets()` function with batch processing (50 per batch)
- [ ] 4.4 Add `--name` filter support for single dataset sync
- [ ] 4.5 Add `--incremental` flag with last-sync timestamp tracking

## 5. Source Sync Implementation

- [ ] 5.1 Create `src/integrations/datahub/sync/sources.ts`
- [ ] 5.2 Map dataspec source to DataHub data platform entity
- [ ] 5.3 Map source entities to DataHub container entities
- [ ] 5.4 Implement `syncSources()` function
- [ ] 5.5 Add `--name` filter support for single source sync
- [ ] 5.6 Handle unknown source types gracefully with warning

## 6. Lineage Sync Implementation

- [ ] 6.1 Create `src/integrations/datahub/sync/lineage.ts`
- [ ] 6.2 Map dataspec flow steps to DataHub lineage edges
- [ ] 6.3 Implement transform step → lineage edge mapping
- [ ] 6.4 Implement load step → lineage edge mapping
- [ ] 6.5 Implement `syncLineage()` function with batch processing
- [ ] 6.6 Add `--flow` filter support for single flow lineage sync
- [ ] 6.7 Handle missing dataset references with warnings

## 7. CLI Commands

- [ ] 7.1 Create `src/cli/commands/datahub.ts` command group
- [ ] 7.2 Implement `dataspec datahub connect` command
- [ ] 7.3 Implement `dataspec datahub sync datasets` command
- [ ] 7.4 Implement `dataspec datahub sync sources` command
- [ ] 7.5 Implement `dataspec datahub sync lineage` command
- [ ] 7.6 Add global `--gms-url` and `--token` flags to all subcommands
- [ ] 7.7 Add `--dry-run` flag to all sync commands
- [ ] 7.8 Add `--format json` output support
- [ ] 7.9 Add `--help` support for all commands

## 8. Testing

- [ ] 8.1 Create unit tests for GraphQL client
- [ ] 8.2 Create unit tests for dataset sync mapping
- [ ] 8.3 Create unit tests for source sync mapping
- [ ] 8.4 Create unit tests for lineage sync mapping
- [ ] 8.5 Create integration tests for CLI commands (mock DataHub API)
- [ ] 8.6 Add e2e test for full sync workflow
