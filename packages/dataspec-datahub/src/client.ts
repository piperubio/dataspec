/**
 * DataHub GraphQL client
 * Provides methods for interacting with DataHub's GraphQL API
 */

import { GraphQLClient, gql } from 'graphql-request';

import type {
  DataHubConfig,
  DatasetEntity,
  SourceEntity,
  LineageEdge,
  IngestDatasetResponse,
  IngestDataPlatformResponse,
  IngestLineageResponse,
  HealthCheckResponse,
  RetryConfig,
} from './types.js';
import { DEFAULT_RETRY_CONFIG } from './types.js';

export class DataHubClient {
  private client: GraphQLClient;
  private config: DataHubConfig;
  private retryConfig: RetryConfig;

  constructor(config: DataHubConfig, retryConfig?: Partial<RetryConfig>) {
    this.config = config;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    this.client = new GraphQLClient(this.config.gms_url, {
      headers,
    });
  }

  /**
   * Executes a GraphQL query/mutation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelayMs * Math.pow(2, attempt),
            this.retryConfig.maxDelayMs,
          );
          await Bun.sleep(delay);
        }
      }
    }

    throw new Error(
      `DataHub ${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Ingests a dataset entity into DataHub
   */
  async ingestDataset(dataset: DatasetEntity): Promise<IngestDatasetResponse> {
    const mutation = gql`
      mutation IngestDataset($input: DatasetInput!) {
        ingestDataset(input: $input) {
          dataset {
            urn
          }
        }
      }
    `;

    const variables = {
      input: {
        name: dataset.name,
        platform: dataset.platform,
        description: dataset.description,
        tags: dataset.tags,
        schema: dataset.schema,
      },
    };

    return this.executeWithRetry(async () => {
      const response = await this.client.request<IngestDatasetResponse>(mutation, variables);

      return response;
    }, 'ingestDataset');
  }

  /**
   * Ingests a data platform entity into DataHub
   */
  async ingestDataPlatform(source: SourceEntity): Promise<IngestDataPlatformResponse> {
    const mutation = gql`
      mutation IngestDataPlatform($input: DataPlatformInput!) {
        ingestDataPlatform(input: $input) {
          platform {
            urn
          }
        }
      }
    `;

    const variables = {
      input: {
        type: source.type,
        name: source.name,
        description: source.description,
        entities: source.entities,
      },
    };

    return this.executeWithRetry(async () => {
      const response = await this.client.request<IngestDataPlatformResponse>(mutation, variables);

      return response;
    }, 'ingestDataPlatform');
  }

  /**
   * Ingests a lineage edge into DataHub
   */
  async ingestLineage(edge: LineageEdge): Promise<IngestLineageResponse> {
    const mutation = gql`
      mutation IngestLineage($input: LineageInput!) {
        ingestLineage(input: $input) {
          lineage {
            urn
          }
        }
      }
    `;

    const variables = {
      input: {
        upstreamUrn: edge.upstreamUrn,
        downstreamUrn: edge.downstreamUrn,
        createdOn: edge.createdOn,
        createdActor: edge.createdActor,
      },
    };

    return this.executeWithRetry(async () => {
      const response = await this.client.request<IngestLineageResponse>(mutation, variables);

      return response;
    }, 'ingestLineage');
  }

  /**
   * Checks DataHub connection health via version query
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const query = gql`
      query Version {
        version {
          version
        }
      }
    `;

    return this.executeWithRetry(async () => {
      const response = await this.client.request<HealthCheckResponse>(query);

      return response;
    }, 'healthCheck');
  }

  /**
   * Batch ingests multiple datasets
   */
  async ingestDatasetsBatch(
    datasets: DatasetEntity[],
    batchSize: number = 50,
  ): Promise<IngestDatasetResponse[]> {
    const results: IngestDatasetResponse[] = [];

    for (let i = 0; i < datasets.length; i += batchSize) {
      const batch = datasets.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((dataset) => this.ingestDataset(dataset)));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Batch ingests multiple lineage edges
   */
  async ingestLineageBatch(
    edges: LineageEdge[],
    batchSize: number = 50,
  ): Promise<IngestLineageResponse[]> {
    const results: IngestLineageResponse[] = [];

    for (let i = 0; i < edges.length; i += batchSize) {
      const batch = edges.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((edge) => this.ingestLineage(edge)));
      results.push(...batchResults);
    }

    return results;
  }
}
