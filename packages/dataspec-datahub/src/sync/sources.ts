/**
 * Source sync module
 * Syncs dataspec sources to DataHub data platform entities
 */

import type { Source } from '@dataspec/dataspec-core';

import { DataHubClient } from '../client.js';
import type { SourceEntity as DataHubSourceEntity } from '../types.js';

export interface SyncSourcesOptions {
  client: DataHubClient;
  sources: Source[];
  name?: string;
}

export interface SyncSourcesResult {
  synced: number;
  skipped: number;
  failed: number;
  warnings: string[];
  errors: Array<{ source: string; error: string }>;
}

const SOURCE_TYPE_TO_PLATFORM: Record<string, string> = {
  database: 'database',
  api: 'api',
  file_system: 'file-system',
  streaming: 'streaming',
  saas: 'saas',
};

/**
 * Maps dataspec source type to DataHub platform type
 */
export function mapSourceType(sourceType: string): string {
  return SOURCE_TYPE_TO_PLATFORM[sourceType] ?? sourceType;
}

/**
 * Maps dataspec source entities to a record of entity name → type
 */
export function mapSourceEntities(source: Source): Record<string, string> {
  const entities: Record<string, string> = {};

  for (const entity of source.entities) {
    entities[entity.name] = entity.entityType ?? 'unknown';
  }

  return entities;
}

/**
 * Maps a dataspec source to a DataHub data platform entity
 */
export function mapSourceToEntity(source: Source): DataHubSourceEntity {
  return {
    type: mapSourceType(source.type),
    name: source.name,
    description: source.metadata?.description as string | undefined,
    entities: mapSourceEntities(source),
  };
}

/**
 * Filters sources based on sync options
 */
function filterSources(sources: Source[], options: Pick<SyncSourcesOptions, 'name'>): Source[] {
  if (options.name) {
    return sources.filter((s) => s.name === options.name);
  }
  return sources;
}

/**
 * Checks if source type is known
 * Returns true if type should be skipped (unknown)
 */
function isUnknownSourceType(source: Source): boolean {
  return !(source.type in SOURCE_TYPE_TO_PLATFORM);
}

/**
 * Syncs dataspec sources to DataHub
 * Skips sources with unknown types and logs a warning
 */
export async function syncSources(options: SyncSourcesOptions): Promise<SyncSourcesResult> {
  const { client, sources } = options;

  const filtered = filterSources(sources, options);

  const result: SyncSourcesResult = {
    synced: 0,
    skipped: 0,
    failed: 0,
    warnings: [],
    errors: [],
  };

  if (filtered.length === 0) {
    result.skipped = sources.length;
    return result;
  }

  for (const source of filtered) {
    if (isUnknownSourceType(source)) {
      result.warnings.push(
        `Unknown source type "${source.type}" for source "${source.name}". Skipping.`,
      );
      result.skipped++;
      continue;
    }

    try {
      const entity = mapSourceToEntity(source);
      await client.ingestDataPlatform(entity);
      result.synced++;
    } catch (error) {
      result.errors.push({
        source: source.name,
        error: error instanceof Error ? error.message : String(error),
      });
      result.failed++;
    }
  }

  return result;
}
