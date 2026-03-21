/**
 * Parses a DPAC workspace directory and returns all resources.
 * Discovers YAML files in sources/, datasets/, contracts/, and flows/ directories.
 * @param dirPath - Path to the workspace root directory
 * @returns Promise resolving to parsed workspace with all resources
 */
export { parseWorkspace, parseWorkspaceWithStructure } from './workspace.js';

/**
 * Scans a workspace directory for DPAC resource files.
 * Returns paths to platform.yaml and resource YAML files.
 * @param dirPath - Path to scan
 * @returns Object with paths to all discovered resources
 */
export { scanWorkspace, scanWorkspaceWithStructure } from './scanner.js';

/**
 * Parses YAML content while preserving line number information.
 * Provides detailed error messages with line numbers for malformed YAML.
 */
export { parseYamlWithLineNumbers, validateYamlSyntax } from './yaml.js';

/**
 * Workspace and resource types
 */
export type {
  Workspace,
  ParsedSource,
  ParsedDataset,
  ParsedContract,
  ParsedFlow,
  ParsedPlatform,
  WorkspaceStructureInfo,
  ParseResult,
} from './workspace.js';

/**
 * Options for YAML parsing
 */
export type { ParseOptions } from './yaml.js';
