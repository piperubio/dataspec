/**
* Platform resource parser for dataspec (Declarative Data Platform Architecture)
 * @module parsers/platform
 */

import YAML from 'yaml';
import type { PlatformConfig, StorageBackend, AnalyticsEngine } from '../types/platform';

/**
 * Validates that all storage backend names are unique.
 * @param storage - Array of storage backends
 * @throws Error if duplicate backend names are found
 */
function validateUniqueBackendNames(storage: StorageBackend[]): void {
  const names = new Set<string>();
  for (const backend of storage) {
    if (names.has(backend.name)) {
      throw new Error(`Duplicate storage backend name: '${backend.name}'`);
    }
    names.add(backend.name);
  }
}

/**
 * Validates that all analytics engine names are unique.
 * @param engines - Array of analytics engines
 * @throws Error if duplicate engine names are found
 */
function validateUniqueEngineNames(engines: AnalyticsEngine[]): void {
  const names = new Set<string>();
  for (const engine of engines) {
    if (names.has(engine.name)) {
      throw new Error(`Duplicate analytics engine name: '${engine.name}'`);
    }
    names.add(engine.name);
  }
}

/**
 * Parses a YAML string into a PlatformConfig object
 * @param yamlContent - The YAML content to parse
 * @returns Parsed PlatformConfig object
 * @throws Error if YAML parsing fails or validation fails
 */
export function parsePlatformYaml(yamlContent: string): PlatformConfig {
  const parsed = YAML.parse(yamlContent) as PlatformConfig;

  // Validate unique backend names
  if (parsed.storage && Array.isArray(parsed.storage)) {
    validateUniqueBackendNames(parsed.storage);
  }

  // Validate unique engine names
  if (parsed.engines && Array.isArray(parsed.engines)) {
    validateUniqueEngineNames(parsed.engines);
  }

  return parsed;
}
