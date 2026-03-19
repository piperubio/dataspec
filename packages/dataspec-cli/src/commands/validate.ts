import { Command } from 'commander';
import { parseWorkspaceWithStructure } from '../parsing/index.js';
import { validateWorkspace, formatValidationError, validateWorkspaceStructure } from '../validation/index.js';
import { logVerbose } from '../utils/index.js';

export const validateCommand = new Command()
  .name('validate')
  .description('Validate the workspace for errors')
  .option('-p, --path <dir>', 'Path to the workspace directory', process.cwd())
  .option('-f, --format <format>', 'Output format (text, json)', 'text')
  .action(async (options) => {
    try {
      logVerbose(`Parsing workspace at: ${options.path}`);
      const { workspace, structure } = await parseWorkspaceWithStructure(options.path);

      // First, validate workspace structure (dataspec/ folder requirement)
      const structureResult = validateWorkspaceStructure(structure, options.path);
      
      if (!structureResult.valid) {
        // Structure validation failed
        for (const error of structureResult.errors) {
          console.error(error);
        }
        process.exit(2);
      }

      // Show warnings for legacy structure
      for (const warning of structureResult.warnings) {
        console.warn(`Warning: ${warning}`);
      }

      // If no workspace configuration (e.g., platform.yaml) is found, emit a clear CLI error.
      if (!workspace || (workspace as any).platform == null) {
        console.error(
          `Error: No workspace configuration (platform.yaml) found at '${options.path}/dataspec'.\n` +
          "Run 'dataspec init' to create a new workspace."
        );
        process.exit(2);
      }

      logVerbose(`Found ${workspace.sources.length} sources, ${workspace.datasets.length} datasets, ${workspace.contracts.length} contracts, ${workspace.flows.length} flows`);
      logVerbose('Running validation phases...');
      const result = validateWorkspace(workspace);
      logVerbose(`Validation complete: ${result.errors.length} errors, ${result.warnings.length} warnings`);

      if (options.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        // Sort errors and warnings by file:line for consistent output
        const sortedErrors = [...result.errors].sort((a, b) => {
          const locCompare = a.location.file.localeCompare(b.location.file);
          if (locCompare !== 0) return locCompare;
          return a.location.line - b.location.line;
        });

        const sortedWarnings = [...result.warnings].sort((a, b) => {
          const locCompare = a.location.file.localeCompare(b.location.file);
          if (locCompare !== 0) return locCompare;
          return a.location.line - b.location.line;
        });

        // Output errors first, then warnings (grouped by severity)
        for (const error of sortedErrors) {
          console.log(formatValidationError(error));
        }

        for (const warning of sortedWarnings) {
          console.log(formatValidationError(warning));
        }

        if (result.passed && result.errors.length === 0) {
          console.log('Validation passed - no errors found.');
        }
      }

      process.exit(result.passed ? 0 : 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });