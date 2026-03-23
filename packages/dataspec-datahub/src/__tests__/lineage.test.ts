/**
 * Unit tests for lineage sync mapping
 */

import { describe, test, expect, mock, beforeEach } from 'bun:test';

import type { Dataset, Flow, Source } from '@dataspec/dataspec-core';

import type { DataHubClient } from '../client.js';
import {
  createDatasetUrn,
  mapTransformStepToEdges,
  mapLoadStepToEdges,
  mapFlowToLineageEdges,
  syncLineage,
} from '../sync/lineage.js';

describe('createDatasetUrn', () => {
  test('should create correct DataHub URN format', () => {
    const urn = createDatasetUrn('postgresql', 'orders');
    expect(urn).toBe('urn:li:dataset:(urn:li:dataPlatform:postgresql,orders,PROD)');
  });

  test('should handle different platforms', () => {
    expect(createDatasetUrn('bigquery', 'users')).toBe(
      'urn:li:dataset:(urn:li:dataPlatform:bigquery,users,PROD)',
    );
    expect(createDatasetUrn('snowflake', 'products')).toBe(
      'urn:li:dataset:(urn:li:dataPlatform:snowflake,products,PROD)',
    );
  });
});

describe('mapTransformStepToEdges', () => {
  const datasets: Dataset[] = [
    {
      name: 'raw_orders',
      storage: { backend: 'postgresql', format: 'parquet', location: 's3://raw' },
    },
    {
      name: 'raw_customers',
      storage: { backend: 'postgresql', format: 'parquet', location: 's3://raw' },
    },
    {
      name: 'orders_enriched',
      storage: { backend: 'bigquery', format: 'parquet', location: 'bq://orders' },
    },
  ];

  test('should create lineage edges from inputs to output', () => {
    const step = {
      type: 'transform' as const,
      inputs: ['raw_orders', 'raw_customers'],
      engine: 'dbt',
      output: 'orders_enriched',
    };

    const { edges, warnings } = mapTransformStepToEdges(step, datasets, 'test-flow');

    expect(edges).toHaveLength(2);
    expect(warnings).toHaveLength(0);

    expect(edges[0].upstreamUrn).toBe(
      'urn:li:dataset:(urn:li:dataPlatform:postgresql,raw_orders,PROD)',
    );
    expect(edges[0].downstreamUrn).toBe(
      'urn:li:dataset:(urn:li:dataPlatform:bigquery,orders_enriched,PROD)',
    );

    expect(edges[1].upstreamUrn).toBe(
      'urn:li:dataset:(urn:li:dataPlatform:postgresql,raw_customers,PROD)',
    );
    expect(edges[1].downstreamUrn).toBe(
      'urn:li:dataset:(urn:li:dataPlatform:bigquery,orders_enriched,PROD)',
    );
  });

  test('should warn when output dataset not found', () => {
    const step = {
      type: 'transform' as const,
      inputs: ['raw_orders'],
      engine: 'dbt',
      output: 'nonexistent',
    };

    const { edges, warnings } = mapTransformStepToEdges(step, datasets, 'test-flow');

    expect(edges).toHaveLength(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Output dataset "nonexistent" not found');
  });

  test('should warn when input dataset not found', () => {
    const step = {
      type: 'transform' as const,
      inputs: ['nonexistent', 'raw_orders'],
      engine: 'dbt',
      output: 'orders_enriched',
    };

    const { edges, warnings } = mapTransformStepToEdges(step, datasets, 'test-flow');

    expect(edges).toHaveLength(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Input dataset "nonexistent" not found');
  });
});

describe('mapLoadStepToEdges', () => {
  const datasets: Dataset[] = [
    {
      name: 'orders_enriched',
      storage: { backend: 'bigquery', format: 'parquet', location: 'bq://orders' },
    },
    {
      name: 'orders_serving',
      storage: { backend: 'snowflake', format: 'csv', location: 'sf://orders' },
    },
  ];

  test('should create lineage edge from input to target', () => {
    const step = {
      type: 'load' as const,
      input: 'orders_enriched',
      target: 'orders_serving',
    };

    const { edges, warnings } = mapLoadStepToEdges(step, datasets, 'test-flow');

    expect(edges).toHaveLength(1);
    expect(warnings).toHaveLength(0);

    expect(edges[0].upstreamUrn).toBe(
      'urn:li:dataset:(urn:li:dataPlatform:bigquery,orders_enriched,PROD)',
    );
    expect(edges[0].downstreamUrn).toBe(
      'urn:li:dataset:(urn:li:dataPlatform:snowflake,orders_serving,PROD)',
    );
  });

  test('should warn when input dataset not found', () => {
    const step = {
      type: 'load' as const,
      input: 'nonexistent',
      target: 'orders_serving',
    };

    const { edges, warnings } = mapLoadStepToEdges(step, datasets, 'test-flow');

    expect(edges).toHaveLength(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Input dataset "nonexistent" not found');
  });

  test('should warn when target dataset not found', () => {
    const step = {
      type: 'load' as const,
      input: 'orders_enriched',
      target: 'nonexistent',
    };

    const { edges, warnings } = mapLoadStepToEdges(step, datasets, 'test-flow');

    expect(edges).toHaveLength(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Target dataset "nonexistent" not found');
  });
});

describe('mapFlowToLineageEdges', () => {
  const datasets: Dataset[] = [
    { name: 'raw_orders', storage: { backend: 'pg', format: 'parquet', location: 's3://raw' } },
    { name: 'orders_agg', storage: { backend: 'bq', format: 'parquet', location: 'bq://agg' } },
    { name: 'orders_serving', storage: { backend: 'sf', format: 'csv', location: 'sf://serving' } },
  ];

  test('should map complete ETL flow to lineage edges', () => {
    const flow: Flow = {
      name: 'orders-etl',
      steps: [
        { type: 'extract', source: 'pg', entity: 'orders', output: 'raw_orders' },
        { type: 'transform', inputs: ['raw_orders'], engine: 'dbt', output: 'orders_agg' },
        { type: 'load', input: 'orders_agg', target: 'orders_serving' },
      ],
    };

    const { edges, warnings } = mapFlowToLineageEdges(flow, datasets);

    expect(edges).toHaveLength(2);
    expect(warnings).toHaveLength(0);

    expect(edges[0].upstreamUrn).toContain('raw_orders');
    expect(edges[0].downstreamUrn).toContain('orders_agg');

    expect(edges[1].upstreamUrn).toContain('orders_agg');
    expect(edges[1].downstreamUrn).toContain('orders_serving');
  });
});

describe('syncLineage', () => {
  const mockClient = {
    ingestLineageBatch: mock(() => Promise.resolve([])),
  } as unknown as DataHubClient;

  const datasets: Dataset[] = [
    { name: 'input1', storage: { backend: 'pg', format: 'parquet', location: 's3://input' } },
    { name: 'output1', storage: { backend: 'bq', format: 'parquet', location: 'bq://output' } },
  ];

  const flows: Flow[] = [
    {
      name: 'flow1',
      steps: [{ type: 'transform', inputs: ['input1'], engine: 'dbt', output: 'output1' }],
    },
  ];

  beforeEach(() => {
    mockClient.ingestLineageBatch = mock(() =>
      Promise.resolve([{ ingestLineage: { lineage: { urn: 'urn1' } } }]),
    );
  });

  test('should sync lineage edges', async () => {
    const result = await syncLineage({
      client: mockClient,
      flows,
      datasets,
    });

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('should filter by flow name', async () => {
    const multipleFlows: Flow[] = [
      ...flows,
      {
        name: 'flow2',
        steps: [{ type: 'transform', inputs: ['input1'], engine: 'spark', output: 'output1' }],
      },
    ];

    const result = await syncLineage({
      client: mockClient,
      flows: multipleFlows,
      datasets,
      flowName: 'flow1',
    });

    expect(result.synced).toBe(1);
  });

  test('should skip when no flows match filter', async () => {
    const result = await syncLineage({
      client: mockClient,
      flows,
      datasets,
      flowName: 'nonexistent',
    });

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(1);
  });

  test('should handle errors gracefully', async () => {
    mockClient.ingestLineageBatch = mock(() => Promise.reject(new Error('API error')));

    const result = await syncLineage({
      client: mockClient,
      flows,
      datasets,
    });

    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
  });
});
