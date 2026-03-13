/**
 * Dataset resource types for DPAC (Declarative Data Platform Architecture)
 * @module types/dataset
 */

import type { Metadata, WithMetadata } from './common';

/**
 * Dataset layer in the medallion architecture.
 * Represents the quality/stage of data.
 * - raw: Unprocessed source data (landing/bronze layer)
 * - refined: Cleaned and transformed data (silver layer)
 * - serving: Aggregated data ready for consumption (gold layer)
 */
export const DatasetLayer = {
  /** Raw, unprocessed data (bronze) */
  RAW: 'raw',
  /** Cleaned and validated data (silver) */
  REFINED: 'refined',
  /** Business-ready aggregated data (gold) */
  SERVING: 'serving',
} as const;

/**
 * Dataset layer values.
 */
export type DatasetLayer = typeof DatasetLayer[keyof typeof DatasetLayer];

/**
 * Reference to a contract definition by name and version.
 * Used to link datasets to their validation contracts.
 */
export interface ContractReference {
  /** Name of the contract */
  name: string;
  /** Version of the contract (semver format) */
  version: string;
}

/**
 * Storage configuration for a dataset.
 * References a storage backend and specifies location and format.
 */
export interface StorageConfig {
  /** Reference to the storage backend by name */
  backend: string;
  /** Data format (e.g., 'parquet', 'csv', 'json', 'delta') */
  format: string;
  /** Storage location path (type-specific, e.g., S3 path, GCS path, local path) */
  location: string;
  /** Optional format-specific configuration */
  config?: Record<string, unknown>;
}

/**
 * Represents a dataset definition in the data platform.
 * A dataset is a logical collection of data with defined storage and optional contracts.
 */
export interface Dataset extends WithMetadata {
  /** Unique name for this dataset */
  name: string;
  /** Layer in the data architecture (raw, refined, serving) */
  layer: DatasetLayer;
  /** Storage configuration referencing a backend */
  storage: StorageConfig;
  /** Optional reference to a validation contract */
  contract?: ContractReference;
}

/**
 * Schema for dataset YAML structure (used for parsing).
 * Matches the expected structure of dataset YAML files.
 */
export interface DatasetYamlSchema {
  /** Dataset name */
  name: string;
  /** Layer in the data architecture */
  layer: string;
  /** Storage configuration */
  storage: {
    /** Backend reference */
    backend: string;
    /** Data format */
    format: string;
    /** Location path */
    location: string;
    /** Optional format config */
    config?: Record<string, unknown>;
  };
  /** Optional contract reference */
  contract?: {
    /** Contract name */
    name: string;
    /** Contract version */
    version: string;
  };
  /** Optional metadata block */
  metadata?: Metadata;
  /** Optional tags for categorization */
  tags?: string[];
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}
