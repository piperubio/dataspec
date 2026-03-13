import { Command } from 'commander';
import { parseWorkspace } from '../parsing/index.js';
import { validateWorkspace, formatValidationError } from '../validation/index.js';
export const validateCommand = new Command()
    .name('validate')
    .description('Validate the workspace for errors')
    .option('-p, --path <dir>', 'Path to the workspace directory', process.cwd())
    .option('-f, --format <format>', 'Output format (text, json)', 'text')
    .action(async (options) => {
    try {
        const workspace = await parseWorkspace(options.path);
        const result = validateWorkspace(workspace);
        if (options.format === 'json') {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            if (result.errors.length > 0) {
                console.log('Errors:');
                for (const error of result.errors) {
                    console.log(formatValidationError(error));
                }
            }
            if (result.warnings.length > 0) {
                console.log('Warnings:');
                for (const warning of result.warnings) {
                    console.log(formatValidationError(warning));
                }
            }
            if (result.passed && result.errors.length === 0) {
                console.log('Validation passed - no errors found.');
            }
        }
        process.exit(result.passed ? 0 : 1);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${message}`);
        process.exit(2);
    }
});
//# sourceMappingURL=validate.js.map