/**
 * DataHub integration types
 * Types for DataHub GraphQL API integration
 */

export interface DataHubConfig {
  gms_url: string;
  token?: string;
}

export interface DatasetEntity {
  name: string;
  platform: string;
  description?: string;
  tags?: string[];
  storage?: {
    type: string;
    connection?: string;
  };
  schema?: {
    fields: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
  };
}

export interface SourceEntity {
  type: string;
  name: string;
  description?: string;
  entities: Record<string, string>;
}

export interface LineageEdge {
  upstreamUrn: string;
  downstreamUrn: string;
  createdOn?: number;
  createdActor?: string;
}

export interface DataHubResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}

export interface IngestDatasetResponse {
  ingestDataset: {
    dataset: {
      urn: string;
    };
  };
}

export interface IngestDataPlatformResponse {
  ingestDataPlatform: {
    platform: {
      urn: string;
    };
  };
}

export interface IngestLineageResponse {
  ingestLineage: {
    lineage: {
      urn: string;
    };
  };
}

export interface HealthCheckResponse {
  version: {
    version: string;
  };
}

export type RetryConfig = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};
