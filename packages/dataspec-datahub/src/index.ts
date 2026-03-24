/**
 * @dataspec/dataspec-datahub - DataHub Integration for DataSpec
 * @module @dataspec/dataspec-datahub
 */

export { DataHubClient } from './client.js';
export { loadConfig, loadConfigWithOverrides } from './config.js';

export {
  syncDatasets,
  mapDatasetToEntity,
  type SyncDatasetsOptions,
  type SyncDatasetsResult,
} from './sync/datasets.js';

export {
  syncSources,
  mapSourceToEntity,
  mapSourceType,
  mapSourceEntities,
  type SyncSourcesOptions,
  type SyncSourcesResult,
} from './sync/sources.js';

export {
  syncLineage,
  mapFlowToLineageEdges,
  mapTransformStepToEdges,
  mapLoadStepToEdges,
  createDatasetUrn,
  type SyncLineageOptions,
  type SyncLineageResult,
} from './sync/lineage.js';

export { loadLastSyncTimestamp, saveLastSyncTimestamp } from './sync/sync-state.js';

export type {
  DataHubConfig,
  DatasetEntity,
  SourceEntity,
  LineageEdge,
  IngestDatasetResponse,
  IngestDataPlatformResponse,
  IngestLineageResponse,
  HealthCheckResponse,
} from './types.js';
