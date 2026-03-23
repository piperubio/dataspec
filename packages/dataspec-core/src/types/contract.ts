/**
 * Contract resource types for the dataspec-core domain model.
 * @module types/contract
 */

import type { WithMetadata } from './common';

/**
 * Supported data types for contract fields.
 */
export type DataType =
  | 'uuid'
  | 'string'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'timestamp'
  | 'date'
  | 'json';

/**
 * Field constraints for data validation and integrity.
 */
export interface FieldConstraints {
  /** Whether the field value must be unique across all records */
  unique?: boolean;
  /** Whether the field value cannot be null */
  not_null?: boolean;
  /** Reference to another contract field in format 'ContractName.fieldName' */
  ref?: string;
  /** Allowed values for string fields (restricts to a specific set of permitted values) */
  allowed_values?: string[];
  /** Total number of digits for decimal fields (must be paired with scale) */
  precision?: number;
  /** Number of decimal places for decimal fields (must be paired with precision, must be ≤ precision) */
  scale?: number;
  /** Inclusive minimum value for integer and decimal fields */
  min?: number;
  /** Inclusive maximum value for integer and decimal fields */
  max?: number;
  /** Minimum string length for string fields (positive integer, must be <= max_length) */
  min_length?: number;
  /** Maximum string length for string fields (positive integer, must be >= min_length) */
  max_length?: number;
  /** Format hint for string fields (open-ended metadata, e.g., 'email', 'uri') */
  format?: string;
  /** Regex pattern for string fields (validated syntactically at parse time) */
  pattern?: string;
}

/**
 * Represents a single field definition within a contract.
 */
export interface ContractField {
  /** The name of the field (should be camelCase) */
  name: string;
  /** The data type of the field */
  type: DataType;
  /** Constraints applied to this field */
  constraints?: FieldConstraints;
  /** Human-readable description of the field */
  description?: string;
}

/**
 * Represents a data contract that defines the structure and constraints
 * for a specific type of data entity.
 */
export interface Contract extends WithMetadata {
  /** The name of the contract (should be PascalCase) */
  name: string;
  /** Semantic version of the contract (e.g., "1.0.0") */
  version: string;
  /** Array of field definitions that make up this contract */
  fields: ContractField[];
}
