/**
 * Dataset parser for dataspec (Declarative Data Platform Architecture)
 * @module parsers/dataset
 */

import { parse } from 'yaml';

import {
  type Dataset,
  type DatasetYamlSchema,
  type StorageConfig,
  type ContractReference,
} from '../types/dataset';
import { validateAgainstSchema } from '../validation/schema-validator';

/**
 * Parses a YAML content string into a typed Dataset object.
 *
 * @param yamlContent - The YAML content to parse
 * @returns A typed Dataset object
 * @throws Error if YAML parsing fails or required fields are missing
 *
 * @example
 * ```typescript
 * const yaml = `
 *   name: customer_orders
 *   layer: refined
 *   storage:
 *     backend: s3-primary
 *     format: parquet
 *     location: s3://data/refined/customer_orders/
 *   contract:
 *     name: customer_orders_contract
 *     version: "1.0.0"
 * `;
 * const dataset = parseDatasetYaml(yaml);
 * ```
 */
export function parseDatasetYaml(yamlContent: string): Dataset {
  // Parse the YAML content
  const parsed = parse(yamlContent) as DatasetYamlSchema;

  // Validate against JSON Schema
  const schemaResult = validateAgainstSchema(parsed, 'dataset');
  if (!schemaResult.valid) {
    throw new Error(`Schema validation failed:\n${schemaResult.errors.join('\n')}`);
  }

  // Build the storage config
  const storage: StorageConfig = {
    backend: parsed.storage.backend,
    format: parsed.storage.format,
    location: parsed.storage.location,
  };

  // Add optional storage config if present
  if (parsed.storage.config) {
    storage.config = parsed.storage.config;
  }

  // Build the contract reference if present
  let contract: ContractReference | undefined;
  if (parsed.contract) {
    contract = {
      name: parsed.contract.name,
      version: parsed.contract.version,
    };
  }

  // Build and return the typed Dataset
  const dataset: Dataset = {
    name: parsed.name,
    storage,
  };

  // Add optional fields
  if (contract) {
    dataset.contract = contract;
  }

  if (parsed.metadata) {
    dataset.metadata = parsed.metadata;
  }

  if (parsed.tags) {
    dataset.tags = parsed.tags;
  }

  if (parsed.createdAt) {
    dataset.createdAt = parsed.createdAt;
  }

  if (parsed.updatedAt) {
    dataset.updatedAt = parsed.updatedAt;
  }

  return dataset;
}
