/**
 * Unit tests for source sync mapping
 */

import { describe, test, expect, mock, beforeEach } from 'bun:test';

import type { Source } from '@dataspec/dataspec-core';

import type { DataHubClient } from '../client.js';
import {
  mapSourceToEntity,
  mapSourceType,
  mapSourceEntities,
  syncSources,
} from '../sync/sources.js';

describe('mapSourceType', () => {
  test('should map known source types', () => {
    expect(mapSourceType('database')).toBe('database');
    expect(mapSourceType('api')).toBe('api');
    expect(mapSourceType('file_system')).toBe('file-system');
    expect(mapSourceType('streaming')).toBe('streaming');
    expect(mapSourceType('saas')).toBe('saas');
  });

  test('should pass through unknown source types', () => {
    expect(mapSourceType('custom_type')).toBe('custom_type');
  });
});

describe('mapSourceEntities', () => {
  test('should map database entities to record', () => {
    const source: Source = {
      name: 'ecommerce-db',
      type: 'database',
      entities: [
        {
          name: 'users',
          location: 'public.users',
          entityType: 'table',
          contract: { name: 'users-contract', version: '1.0.0' },
        },
        {
          name: 'orders',
          location: 'public.orders',
          entityType: 'table',
          contract: { name: 'orders-contract', version: '1.0.0' },
        },
      ],
    };

    const entities = mapSourceEntities(source);

    expect(entities).toEqual({
      users: 'table',
      orders: 'table',
    });
  });

  test('should handle entities without entityType', () => {
    const source: Source = {
      name: 'api-source',
      type: 'api',
      protocol: 'https',
      baseUrl: 'api.example.com',
      entities: [
        {
          name: 'users',
          location: '/api/users',
          method: 'GET',
          contract: { name: 'users-contract', version: '1.0.0' },
        },
      ],
    };

    const entities = mapSourceEntities(source);

    expect(entities).toEqual({
      users: 'unknown',
    });
  });
});

describe('mapSourceToEntity', () => {
  test('should map database source to DataHub entity', () => {
    const source: Source = {
      name: 'ecommerce-db',
      type: 'database',
      entities: [
        {
          name: 'users',
          location: 'public.users',
          contract: { name: 'users-contract', version: '1.0.0' },
        },
      ],
    };

    const entity = mapSourceToEntity(source);

    expect(entity.type).toBe('database');
    expect(entity.name).toBe('ecommerce-db');
    expect(entity.entities).toEqual({ users: 'unknown' });
  });

  test('should include description from metadata', () => {
    const source: Source = {
      name: 'main-db',
      type: 'database',
      metadata: {
        description: 'Main production database',
      },
      entities: [],
    };

    const entity = mapSourceToEntity(source);

    expect(entity.description).toBe('Main production database');
  });
});

describe('syncSources', () => {
  const mockClient = {
    ingestDataPlatform: mock(() => Promise.resolve({})),
  } as unknown as DataHubClient;

  beforeEach(() => {
    mockClient.ingestDataPlatform = mock(() =>
      Promise.resolve({
        ingestDataPlatform: { platform: { urn: 'urn:li:dataPlatform:test' } },
      }),
    );
  });

  const sampleSources: Source[] = [
    {
      name: 'db1',
      type: 'database',
      entities: [],
    },
    {
      name: 'api1',
      type: 'api',
      protocol: 'https',
      baseUrl: 'api.example.com',
      entities: [],
    },
  ];

  test('should sync all sources', async () => {
    const result = await syncSources({
      client: mockClient,
      sources: sampleSources,
    });

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);
  });

  test('should filter by name when specified', async () => {
    const result = await syncSources({
      client: mockClient,
      sources: sampleSources,
      name: 'db1',
    });

    expect(result.synced).toBe(1);
    expect(mockClient.ingestDataPlatform).toHaveBeenCalledTimes(1);
  });

  test('should skip when no sources match name filter', async () => {
    const result = await syncSources({
      client: mockClient,
      sources: sampleSources,
      name: 'nonexistent',
    });

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(2);
  });

  test('should add warning for unknown source types', async () => {
    const sources: Source[] = [
      {
        name: 'custom',
        type: 'unknown_type' as 'database',
        entities: [],
      },
    ];

    const result = await syncSources({
      client: mockClient,
      sources,
    });

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Unknown source type');
  });

  test('should handle errors gracefully', async () => {
    mockClient.ingestDataPlatform = mock(() => Promise.reject(new Error('API error')));

    const result = await syncSources({
      client: mockClient,
      sources: sampleSources,
    });

    expect(result.failed).toBe(2);
    expect(result.errors).toHaveLength(2);
  });
});
