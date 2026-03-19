/**
 * Source types for data ingestion.
 * @module types/source
 */

import type { Metadata, WithMetadata } from "./common";

/**
 * Source type for data ingestion.
 * Categorizes where data originates from.
 */
export const SourceType = {
  /** Relational or NoSQL database */
  DATABASE: 'database',
  /** REST or GraphQL API */
  API: 'api',
  /** Local or remote file system */
  FILE_SYSTEM: 'file_system',
  /** Software-as-a-Service connector */
  SAAS: 'saas',
} as const;

/**
 * Source type values.
 */
export type SourceType = typeof SourceType[keyof typeof SourceType];

/**
 * Represents an entity (table, collection, endpoint, file pattern) within a source.
 */
export interface SourceEntity {
  /** The name of the entity */
  name: string;
  /** Human-readable description of the entity */
  description?: string;
  /** Type of entity (e.g., 'table', 'collection', 'endpoint', 'file') */
  entityType?: string;
  /** Schema definition if applicable */
  schema?: Record<string, unknown>;
  /** File pattern for file_system sources (e.g., '*.csv') */
  pattern?: string;
  /** HTTP method for API sources (e.g., 'GET', 'POST') */
  method?: string;
  /** Path parameters for API endpoints */
  pathParams?: string[];
  /** Query parameters for API endpoints */
  queryParams?: string[];
  /** Additional metadata for the entity */
  metadata?: Metadata;
}

/**
 * Represents a data source (database, API, file system, SaaS).
 * Contains NO connection details - this is definitions-only.
 */
export interface Source extends WithMetadata {
  /** Unique name for the source */
  name: string;
  /** Type of source */
  type: SourceType;
  /** Entities available in this source */
  entities: SourceEntity[];
}
