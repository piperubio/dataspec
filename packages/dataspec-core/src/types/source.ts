/**
 * Source types for data ingestion.
 * @module types/source
 */

import type { Metadata, WithMetadata } from './common';

/**
 * Contract reference for a source entity.
 * Links an entity to its schema contract.
 */
export interface ContractReference {
  /** Name of the contract */
  name: string;
  /** Version of the contract */
  version: string;
}

/**
 * Source type enum for data ingestion.
 * Categorizes where data originates from.
 */
export const SourceType = {
  /** Relational or NoSQL database */
  DATABASE: 'database',
  /** REST or GraphQL API */
  API: 'api',
  /** Local or remote file system */
  FILE_SYSTEM: 'file_system',
  /** Streaming source (WebSocket, Kafka, MQTT, AMQP) */
  STREAMING: 'streaming',
  /** Software-as-a-Service connector */
  SAAS: 'saas',
} as const;

/**
 * Source type literal values for strict validation.
 */
export type SourceTypeValue = 'database' | 'api' | 'file_system' | 'streaming' | 'saas';

/**
 * Source type values from the enum.
 */
export type SourceType = (typeof SourceType)[keyof typeof SourceType];

/**
 * Base fields shared across all source entity types.
 */
export interface SourceEntityBase {
  /** The name of the entity */
  name: string;
  /** Human-readable description of the entity */
  description?: string;
  /** Type of entity (e.g., 'table', 'collection', 'endpoint', 'file') */
  entityType?: string;
  /** Schema definition if applicable */
  schema?: Record<string, unknown>;
  /** Additional metadata for the entity */
  metadata?: Metadata;
}

/**
 * Database source entity.
 * Represents a table, view, or collection in a database.
 */
export interface SourceEntityDatabase extends SourceEntityBase {
  /** Logical identifier for the entity (e.g., 'public.users', 'analytics.orders') */
  location: string;
  /** Contract reference for schema validation */
  contract: ContractReference;
}

/**
 * API source entity.
 * Represents an endpoint in a REST or gRPC API.
 */
export interface SourceEntityApi extends SourceEntityBase {
  /** URL path for the endpoint (e.g., '/api/v1/users', '/users/{id}') */
  location: string;
  /** HTTP method (GET, POST, PUT, DELETE, PATCH) or gRPC method name */
  method: string;
  /** Contract reference for schema validation */
  contract: ContractReference;
}

/**
 * File system source entity.
 * Represents a file or file pattern in a file system or object storage.
 */
export interface SourceEntityFileSystem extends SourceEntityBase {
  /** File path or storage URI (e.g., '/data/*.csv', 's3://bucket/path') */
  location: string;
  /** File format (parquet, csv, json, avro, fixed-width, orc, delta) */
  format: string;
  /** Contract reference for schema validation */
  contract: ContractReference;
  /** Partition columns for partitioned data */
  partition_by?: string[];
}

/**
 * Streaming source entity.
 * Represents a topic, queue, or channel in a streaming platform.
 */
export interface SourceEntityStreaming extends SourceEntityBase {
  /** Topic, queue, or channel address */
  location: string;
  /** Contract reference for schema validation */
  contract: ContractReference;
}

/**
 * SaaS source entity.
 * Represents a resource in a SaaS platform.
 */
export interface SourceEntitySaas extends SourceEntityBase {
  /** Contract reference for schema validation */
  contract: ContractReference;
  /** Provider-specific resource identifier (optional) */
  location?: string;
}

/**
 * Union of all source entity types.
 */
export type SourceEntity =
  | SourceEntityDatabase
  | SourceEntityApi
  | SourceEntityFileSystem
  | SourceEntityStreaming
  | SourceEntitySaas;

/**
 * Base source interface with common fields.
 */
export interface SourceBase extends WithMetadata {
  /** Unique name for the source */
  name: string;
  /** Type of source */
  type: SourceType;
}

/**
 * Database source.
 * No additional fields required at source level.
 */
export interface SourceDatabase extends SourceBase {
  type: 'database';
  /** Entities available in this source */
  entities: SourceEntityDatabase[];
}

/**
 * API source.
 * Requires protocol and baseUrl.
 */
export interface SourceApi extends SourceBase {
  type: 'api';
  /** Protocol for the API (http, https, grpc) */
  protocol: string;
  /** Base URL for the API (e.g., 'api.example.com') */
  baseUrl: string;
  /** Entities available in this source */
  entities: SourceEntityApi[];
}

/**
 * File system source.
 * No additional fields required at source level.
 */
export interface SourceFileSystem extends SourceBase {
  type: 'file_system';
  /** Entities available in this source */
  entities: SourceEntityFileSystem[];
}

/**
 * Streaming source.
 * Requires protocol and baseUrl.
 */
export interface SourceStreaming extends SourceBase {
  type: 'streaming';
  /** Protocol for streaming (ws, wss, kafka, mqtt, amqp) */
  protocol: string;
  /** Base URL for the streaming endpoint */
  baseUrl: string;
  /** Entities available in this source */
  entities: SourceEntityStreaming[];
}

/**
 * SaaS source.
 * Requires provider field.
 */
export interface SourceSaas extends SourceBase {
  type: 'saas';
  /** SaaS provider name (e.g., 'salesforce', 'hubspot', 'stripe') */
  provider: string;
  /** Entities available in this source */
  entities: SourceEntitySaas[];
}

/**
 * Discriminated union of all source types.
 */
export type Source = SourceDatabase | SourceApi | SourceFileSystem | SourceStreaming | SourceSaas;
