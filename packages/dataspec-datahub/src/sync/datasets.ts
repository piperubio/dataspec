/**
 * Dataset sync module
 * Syncs dataspec datasets to DataHub dataset entities
 */

import type { Dataset } from '@dataspec/dataspec-core';

import { DataHubClient } from '../client.js';
import type { DatasetEntity } from '../types.js';

export interface SyncDatasetsOptions {
  client: DataHubClient;
  datasets: Dataset[];
  name?: string;
  incremental?: boolean;
  lastSyncTimestamp?: number;
}

export interface SyncDatasetsResult {
  synced: number;
  skipped: number;
  failed: number;
  errors: Array<{ dataset: string; error: string }>;
  lastSyncTimestamp: number;
}

/**
 * Maps a dataspec dataset to a DataHub dataset entity
 */
export function mapDatasetToEntity(dataset: Dataset): DatasetEntity {
  const entity: DatasetEntity = {
    name: dataset.name,
    platform: dataset.storage.backend,
    description: dataset.metadata?.description as string | undefined,
    tags: dataset.tags,
    storage: {
      type: dataset.storage.format,
      connection: dataset.storage.location,
    },
  };

  return entity;
}

/**
 * Filters datasets based on sync options
 */
function filterDatasets(
  datasets: Dataset[],
  options: Pick<SyncDatasetsOptions, 'name' | 'incremental' | 'lastSyncTimestamp'>,
): Dataset[] {
  let filtered = datasets;

  if (options.name) {
    filtered = filtered.filter((d) => d.name === options.name);
  }

  if (options.incremental && options.lastSyncTimestamp) {
    const lastSync = options.lastSyncTimestamp;
    filtered = filtered.filter((d) => {
      if (!d.updatedAt) {
        return true;
      }
      return new Date(d.updatedAt).getTime() > lastSync;
    });
  }

  return filtered;
}

/**
 * Syncs dataspec datasets to DataHub
 * Processes datasets individually, continues on failure
 */
export async function syncDatasets(options: SyncDatasetsOptions): Promise<SyncDatasetsResult> {
  const { client, datasets } = options;
  const startTime = Date.now();

  const filtered = filterDatasets(datasets, options);

  const result: SyncDatasetsResult = {
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    lastSyncTimestamp: startTime,
  };

  if (filtered.length === 0) {
    result.skipped = datasets.length;
    return result;
  }

  for (const dataset of filtered) {
    try {
      const entity = mapDatasetToEntity(dataset);
      await client.ingestDataset(entity);
      result.synced++;
    } catch (error) {
      result.errors.push({
        dataset: dataset.name,
        error: error instanceof Error ? error.message : String(error),
      });
      result.failed++;
    }
  }

  return result;
}
