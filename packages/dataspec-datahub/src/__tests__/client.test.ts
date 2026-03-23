/**
 * Unit tests for DataHub GraphQL client
 */

import { describe, test, expect, mock, beforeEach } from 'bun:test';

import { DataHubClient } from '../client.js';
import type { DataHubConfig, DatasetEntity, SourceEntity, LineageEdge } from '../types.js';

// Mock GraphQLClient
const mockRequest = mock(() => Promise.resolve({}));
const mockGraphQLClient = mock(() => ({
  request: mockRequest,
}));

mock.module('graphql-request', () => ({
  GraphQLClient: mockGraphQLClient,
  gql: (strings: TemplateStringsArray) => strings[0],
}));

describe('DataHubClient', () => {
  const config: DataHubConfig = {
    gms_url: 'https://datahub.example.com/api/gms',
    token: 'test-token',
  };

  let client: DataHubClient;

  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockImplementation(() => Promise.resolve({}));
    client = new DataHubClient(config, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 });
  });

  describe('constructor', () => {
    test('should create client with authentication headers', () => {
      expect(mockGraphQLClient).toHaveBeenCalledWith('https://datahub.example.com/api/gms', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
    });

    test('should create client without auth headers when token is not provided', () => {
      const configWithoutToken: DataHubConfig = {
        gms_url: 'https://datahub.example.com/api/gms',
      };
      new DataHubClient(configWithoutToken);

      expect(mockGraphQLClient).toHaveBeenCalledWith('https://datahub.example.com/api/gms', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('healthCheck', () => {
    test('should return version on successful health check', async () => {
      const mockResponse = {
        version: {
          version: '0.10.0',
        },
      };
      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await client.healthCheck();

      expect(result).toEqual({
        version: {
          version: '0.10.0',
        },
      });
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    test('should throw error on API error', async () => {
      mockRequest.mockRejectedValue(new Error('Unauthorized'));

      expect(client.healthCheck()).rejects.toThrow(
        'DataHub healthCheck failed after 4 attempts: Unauthorized',
      );
    });

    test('should retry on failure', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
        version: { version: '0.10.0' },
      });

      const result = await client.healthCheck();

      expect(result).toEqual({
        version: { version: '0.10.0' },
      });
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('ingestDataset', () => {
    test('should ingest dataset successfully', async () => {
      const dataset: DatasetEntity = {
        name: 'orders',
        platform: 'postgresql',
        description: 'Orders table',
        tags: ['ecommerce', 'orders'],
      };

      const mockResponse = {
        ingestDataset: {
          dataset: {
            urn: 'urn:li:dataset:(urn:li:dataPlatform:postgresql,orders,PROD)',
          },
        },
      };
      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await client.ingestDataset(dataset);

      expect(result).toEqual(mockResponse);
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    test('should throw error on ingest failure', async () => {
      const dataset: DatasetEntity = {
        name: 'orders',
        platform: 'postgresql',
      };

      mockRequest.mockRejectedValue(new Error('Invalid platform'));

      expect(client.ingestDataset(dataset)).rejects.toThrow(
        'DataHub ingestDataset failed after 4 attempts: Invalid platform',
      );
    });
  });

  describe('ingestDataPlatform', () => {
    test('should ingest data platform successfully', async () => {
      const source: SourceEntity = {
        type: 'database',
        name: 'ecommerce-db',
        description: 'Main e-commerce database',
        entities: { orders: 'table', users: 'table' },
      };

      const mockResponse = {
        ingestDataPlatform: {
          platform: {
            urn: 'urn:li:dataPlatform:ecommerce-db',
          },
        },
      };
      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await client.ingestDataPlatform(source);

      expect(result).toEqual(mockResponse);
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('ingestLineage', () => {
    test('should ingest lineage edge successfully', async () => {
      const edge: LineageEdge = {
        upstreamUrn: 'urn:li:dataset:(urn:li:dataPlatform:postgresql,orders,PROD)',
        downstreamUrn: 'urn:li:dataset:(urn:li:dataPlatform:postgresql,orders_summary,PROD)',
      };

      const mockResponse = {
        ingestLineage: {
          lineage: {
            urn: 'urn:li:edge:123',
          },
        },
      };
      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await client.ingestLineage(edge);

      expect(result).toEqual(mockResponse);
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('ingestDatasetsBatch', () => {
    test('should ingest datasets in batches', async () => {
      const datasets: DatasetEntity[] = [
        { name: 'orders', platform: 'postgresql' },
        { name: 'users', platform: 'postgresql' },
        { name: 'products', platform: 'postgresql' },
      ];

      mockRequest.mockResolvedValue({
        ingestDataset: {
          dataset: { urn: 'urn:li:dataset:123' },
        },
      });

      const results = await client.ingestDatasetsBatch(datasets, 2);

      expect(results).toHaveLength(3);
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });
  });

  describe('ingestLineageBatch', () => {
    test('should ingest lineage edges in batches', async () => {
      const edges: LineageEdge[] = [
        {
          upstreamUrn: 'urn:li:dataset:1',
          downstreamUrn: 'urn:li:dataset:2',
        },
        {
          upstreamUrn: 'urn:li:dataset:2',
          downstreamUrn: 'urn:li:dataset:3',
        },
      ];

      mockRequest.mockResolvedValue({
        ingestLineage: {
          lineage: { urn: 'urn:li:edge:123' },
        },
      });

      const results = await client.ingestLineageBatch(edges, 2);

      expect(results).toHaveLength(2);
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });
  });
});
