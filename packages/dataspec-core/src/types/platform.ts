/**
 * Platform-specific types for storage backends and analytics engines.
 * @module types/platform
 */

/**
 * Supported storage backend types.
 */
export const StorageType = {
  /** Amazon S3 object storage */
  S3: 's3',
  /** PostgreSQL relational database */
  POSTGRESQL: 'postgresql',
  /** ClickHouse columnar database */
  CLICKHOUSE: 'clickhouse',
} as const;

/**
 * Storage type values.
 */
export type StorageType = (typeof StorageType)[keyof typeof StorageType];

/**
 * Storage backend configuration.
 * Represents a connection to a storage system.
 */
export interface StorageBackend {
  /** Unique identifier for the storage backend */
  name: string;
  /** Type of storage backend */
  type: StorageType;
  /** Connection string or configuration */
  connection: string;
  /** Additional storage-specific options */
  options?: Record<string, unknown>;
}

/**
 * Supported analytics engine types.
 */
export const EngineType = {
  /** Apache Spark distributed processing */
  SPARK: 'spark',
  /** DuckDB embedded analytics */
  DUCKDB: 'duckdb',
  /** dbt transformation tool */
  DBT: 'dbt',
  /** Python script execution */
  PYTHON: 'python',
} as const;

/**
 * Analytics engine type values.
 */
export type EngineType = (typeof EngineType)[keyof typeof EngineType];

/**
 * Analytics engine configuration.
 * Represents a processing engine for data transformations.
 */
export interface AnalyticsEngine {
  /** Unique identifier for the analytics engine */
  name: string;
  /** Type of analytics engine */
  type: EngineType;
  /** Engine-specific configuration */
  config?: Record<string, unknown>;
  /** Version constraint (e.g., '>=3.0.0') */
  version?: string;
}

/**
 * Platform configuration for data platform resources.
 * Defines storage backends and analytics engines available to the platform.
 */
export interface PlatformConfig {
  /** Array of storage backends available to the platform */
  storage: StorageBackend[];
  /** Array of analytics engines available to the platform */
  engines: AnalyticsEngine[];
  /** Optional default settings */
  defaults?: {
    /** Default storage backend name */
    storage?: string;
  };
}
