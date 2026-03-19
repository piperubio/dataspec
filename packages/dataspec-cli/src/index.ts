/**
 * DataSpec CLI - Main Entry Point
 * @module index
 */

/**
 * Validates a DataSpec workspace for graph integrity, references, and consistency.
 * @param workspace - The parsed workspace to validate
 * @returns Validation result with errors, warnings, and pass status
 */
export { validateWorkspace } from './validation/validator.js';

/**
 * Builds a dependency graph from a workspace for upstream/downstream analysis.
 * @param workspace - The parsed workspace to build graph from
 * @returns Dependency graph with nodes and edges
 */
export { buildDependencyGraph } from './graph/builder.js';

/**
 * Parses a DPAC workspace directory and returns all resources.
 * @param dirPath - Path to the workspace root directory
 * @returns Promise resolving to parsed workspace
 */
export { parseWorkspace } from './parsing/workspace.js';

/**
 * Validation error with location and severity
 */
export type { ValidationError, ValidationResult } from './validation/types.js';

/**
 * Dependency graph types for traversal and analysis
 */
export type { DependencyGraph, GraphNode, GraphEdge } from './graph/types.js';
