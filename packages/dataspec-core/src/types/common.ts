/**
 * Common base types used throughout the dataspec-core domain model.
 * @module types/common
 */

/**
 * ISO 8601 timestamp string.
 * Format: YYYY-MM-DDTHH:mm:ss.sssZ
 */
export type Timestamp = string;

/**
 * Key-value metadata map for storing arbitrary resource metadata.
 * Keys are strings, values can be any JSON-serializable type.
 */
export type Metadata = Record<string, unknown>;

/**
 * Array of string tags for categorization and filtering.
 * Tags should be lowercase, hyphenated strings (e.g., 'production', 'customer-data').
 */
export type Tags = string[];

/**
 * Base interface for all domain resources that support metadata and tags.
 */
export interface WithMetadata {
  /** Metadata associated with the resource */
  metadata?: Metadata;
  /** Tags for categorization and filtering */
  tags?: Tags;
  /** Creation timestamp */
  createdAt?: Timestamp;
  /** Last update timestamp */
  updatedAt?: Timestamp;
}
