import type { WorkspaceStructureInfo } from '../parsing/workspace.js';

export interface StructureValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates workspace structure to ensure dataspec/ folder exists.
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

  // All checks passed
  return { valid: true, errors, warnings };
}
