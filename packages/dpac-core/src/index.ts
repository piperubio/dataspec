/**
 * dpac-core - Declarative Data Platform Architecture Core
 *
 * A TypeScript library for parsing and working with DPAC YAML specifications.
 * DPAC provides a declarative DSL for modeling complete data platforms,
 * including sources, datasets, contracts, and flows.
 *
 * @example
 * ```typescript
 * import { parsePlatformYaml, parseSourceYaml, parseContractYaml } from 'dpac-core';
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
 * @module dpac-core
 */

// Export all types
export type * from './types';

// Export all parsers
export * from './parsers';

// Export all JSON schemas for editor integration
export * from './schemas';
