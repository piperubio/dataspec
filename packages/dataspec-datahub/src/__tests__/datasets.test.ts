/**
 * Unit tests for dataset sync mapping
 */

import { describe, test, expect, mock, beforeEach } from 'bun:test';

import type { Dataset } from '@dataspec/dataspec-core';

import type { DataHubClient } from '../client.js';
import { mapDatasetToEntity, syncDatasets } from '../sync/datasets.js';

describe('mapDatasetToEntity', () => {
  test('should map basic dataset to DataHub entity', () => {
    const dataset: Dataset = {
      name: 'orders',
      storage: {
        backend: 'postgresql',
        format: 'parquet',
        location: 's3://bucket/orders',
      },
    };

    const entity = mapDatasetToEntity(dataset);

    expect(entity.name).toBe('orders');
    expect(entity.platform).toBe('postgresql');
    expect(entity.storage?.type).toBe('parquet');
    expect(entity.storage?.connection).toBe('s3://bucket/orders');
  });

  test('should include description from metadata', () => {
    const dataset: Dataset = {
      name: 'orders',
      storage: {
        backend: 'bigquery',
        format: 'parquet',
        location: 'project.dataset.orders',
      },
      metadata: {
        description: 'Customer orders table',
      },
    };

    const entity = mapDatasetToEntity(dataset);

    expect(entity.description).toBe('Customer orders table');
  });

  test('should include tags when present', () => {
    const dataset: Dataset = {
      name: 'customers',
      storage: {
        backend: 'snowflake',
        format: 'csv',
        location: 'schema.customers',
      },
      tags: ['pii', 'customers', 'production'],
    };

    const entity = mapDatasetToEntity(dataset);

    expect(entity.tags).toEqual(['pii', 'customers', 'production']);
  });

  test('should handle dataset without metadata', () => {
    const dataset: Dataset = {
      name: 'products',
      storage: {
        backend: 'mysql',
        format: 'json',
        location: 'db.products',
      },
    };

    const entity = mapDatasetToEntity(dataset);

    expect(entity.description).toBeUndefined();
    expect(entity.tags).toBeUndefined();
  });
});

describe('syncDatasets', () => {
  const mockClient = {
    ingestDatasetsBatch: mock(() => Promise.resolve([])),
  } as unknown as DataHubClient;

  beforeEach(() => {
    mockClient.ingestDatasetsBatch = mock(() => Promise.resolve([]));
  });

  const sampleDatasets: Dataset[] = [
    {
      name: 'orders',
      storage: { backend: 'postgresql', format: 'parquet', location: 's3://bucket/orders' },
    },
    {
      name: 'customers',
      storage: { backend: 'postgresql', format: 'parquet', location: 's3://bucket/customers' },
    },
    {
      name: 'products',
      storage: { backend: 'bigquery', format: 'parquet', location: 'project.dataset.products' },
    },
  ];

  test('should sync all datasets', async () => {
    mockClient.ingestDatasetsBatch = mock(() =>
      Promise.resolve([
        { ingestDataset: { dataset: { urn: 'urn1' } } },
        { ingestDataset: { dataset: { urn: 'urn2' } } },
        { ingestDataset: { dataset: { urn: 'urn3' } } },
      ]),
    );

    const result = await syncDatasets({
      client: mockClient,
      datasets: sampleDatasets,
    });

    expect(result.synced).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);
  });

  test('should filter by name when specified', async () => {
    mockClient.ingestDatasetsBatch = mock(() =>
      Promise.resolve([{ ingestDataset: { dataset: { urn: 'urn1' } } }]),
    );

    const result = await syncDatasets({
      client: mockClient,
      datasets: sampleDatasets,
      name: 'orders',
    });

    expect(result.synced).toBe(1);
    expect(mockClient.ingestDatasetsBatch).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'orders' })],
      50,
    );
  });

  test('should skip when no datasets match name filter', async () => {
    const result = await syncDatasets({
      client: mockClient,
      datasets: sampleDatasets,
      name: 'nonexistent',
    });

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(3);
  });

  test('should filter by incremental timestamp', async () => {
    const datasetsWithTimestamp: Dataset[] = [
      {
        name: 'old',
        storage: { backend: 'pg', format: 'parquet', location: 's3://old' },
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        name: 'new',
        storage: { backend: 'pg', format: 'parquet', location: 's3://new' },
        updatedAt: '2024-06-01T00:00:00Z',
      },
    ];

    mockClient.ingestDatasetsBatch = mock(() =>
      Promise.resolve([{ ingestDataset: { dataset: { urn: 'urn1' } } }]),
    );

    const result = await syncDatasets({
      client: mockClient,
      datasets: datasetsWithTimestamp,
      incremental: true,
      lastSyncTimestamp: new Date('2024-03-01T00:00:00Z').getTime(),
    });

    expect(result.synced).toBe(1);
  });

  test('should handle batch errors gracefully', async () => {
    mockClient.ingestDatasetsBatch = mock(() => Promise.reject(new Error('Batch failed')));

    const result = await syncDatasets({
      client: mockClient,
      datasets: sampleDatasets,
    });

    expect(result.failed).toBe(3);
    expect(result.errors).toHaveLength(3);
  });
});
