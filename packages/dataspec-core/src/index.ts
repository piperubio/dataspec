/**
 * dataspec-core - Declarative Data Platform Architecture Core
 *
 * A TypeScript library for parsing and working with DataSpec YAML specifications.
 * DataSpec provides a declarative DSL for modeling complete data platforms,
 * including sources, datasets, contracts, and flows.
 *
 * @example
 * ```typescript
 * import { parsePlatformYaml, parseSourceYaml, parseContractYaml } from 'dataspec-core';
 *
 * // Parse platform configuration
 * const platform = parsePlatformYaml(platformYaml);
 *
 * // Parse source definitions
 * const source = parseSourceYaml(sourceYaml);
 *
 * // Parse data contracts
 * const contract = parseContractYaml(contractYaml);
 * ```
 *
 * @module dataspec-core
 */

// Export all types
export type * from './types';

// Export all parsers
export * from './parsers';

// Export all JSON schemas for editor integration
export * from './schemas';
