import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { $ } from 'bun';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

await $`bun build ./src/cli.ts --compile --outfile ./bin/dataspec --define CLI_VERSION=${JSON.stringify(pkg.version)}`;
