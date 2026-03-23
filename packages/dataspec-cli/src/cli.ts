#!/usr/bin/env bun
/**
 * dataspec CLI Entry Point
 * Command-line interface for the DataSpec (Declarative Data Platform Architecture)
 */

import './validation/schema-validator.js'; // Registers AJV validator with core
import { Command } from 'commander';

import { initCommand } from './commands/init.js';
import { listCommand } from './commands/list.js';
import { showCommand } from './commands/show.js';
import { validateCommand } from './commands/validate.js';
import { setVerbose } from './utils/logger.js';

declare const CLI_VERSION: string;

const program = new Command();

program
  .name('dataspec')
  .description(
    'dataspec CLI - DataSpec (Declarative Data Platform Architecture) Command-Line Interface',
  )
  .version(CLI_VERSION)
  .option('-v, --verbose', 'Enable verbose output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setVerbose(true);
    }
  });

program.addCommand(validateCommand);
program.addCommand(initCommand);
program.addCommand(listCommand);
program.addCommand(showCommand);

program.parse(process.argv);
