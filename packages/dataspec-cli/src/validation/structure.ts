import type { WorkspaceStructureInfo } from '../parsing/workspace.js';

export interface StructureValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates workspace structure to ensure resources are inside dataspec/ folder.
 * @param structure - Workspace structure information from scanner
 * @param _workspacePath - The workspace root path (unused, kept for API consistency)
 * @returns StructureValidationResult with validation status and messages
 */
export function validateWorkspaceStructure(
  structure: WorkspaceStructureInfo,
  _workspacePath: string
): StructureValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if dataspec/ folder exists
  if (!structure.hasDataspecFolder) {
    errors.push(
      `Workspace must contain a 'dataspec/' folder.\n` +
      `Run 'dataspec init' to create a new project.`
    );
    return { valid: false, errors, warnings };
  }

  // Check for legacy resources at root level
  const legacyResources: string[] = [];
  
  if (structure.legacyResources.platformYaml) {
    legacyResources.push('platform.yaml');
  }
  if (structure.legacyResources.sources.length > 0) {
    legacyResources.push(`sources/ (${structure.legacyResources.sources.length} files)`);
  }
  if (structure.legacyResources.datasets.length > 0) {
    legacyResources.push(`datasets/ (${structure.legacyResources.datasets.length} files)`);
  }
  if (structure.legacyResources.contracts.length > 0) {
    legacyResources.push(`contracts/ (${structure.legacyResources.contracts.length} files)`);
  }
  if (structure.legacyResources.flows.length > 0) {
    legacyResources.push(`flows/ (${structure.legacyResources.flows.length} files)`);
  }

  if (legacyResources.length > 0) {
    errors.push(
      `Found resources outside 'dataspec/' folder. Move the following into 'dataspec/':\n` +
      `  - ${legacyResources.join('\n  - ')}`
    );
    return { valid: false, errors, warnings };
  }

  // All checks passed
  return { valid: true, errors, warnings };
}