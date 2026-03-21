import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

import { Command } from 'commander';

interface InitOptions {
  name?: string;
  path?: string;
  withExamples?: boolean;
  force?: boolean;
}

const DATASPEC_DIR = 'dataspec';

export const initCommand = new Command()
  .name('init')
  .description('Initialize a new DataSpec project')
  .option('-n, --name <name>', 'Project name', 'my-data-platform')
  .option('-p, --path <dir>', 'Path to create the project', process.cwd())
  .option('-e, --with-examples', 'Include example resources', false)
  .option('-f, --force', 'Overwrite existing files', false)
  .action(async (options: InitOptions) => {
    try {
      const projectPath = options.path || process.cwd();
      const projectName = options.name || 'my-data-platform';
      const dataspecPath = join(projectPath, DATASPEC_DIR);

      // Check if dataspec folder already exists
      const dataspecExists = await access(dataspecPath)
        .then(() => true)
        .catch(() => false);
      if (dataspecExists && !options.force) {
        console.error(
          `Error: Directory '${DATASPEC_DIR}' already exists at '${projectPath}'. Use --force to overwrite.`,
        );
        process.exit(2);
      }

      // Create dataspec container folder
      await mkdir(dataspecPath, { recursive: true });

      // Create subdirectories inside dataspec/
      await mkdir(join(dataspecPath, 'sources'), { recursive: true });
      await mkdir(join(dataspecPath, 'datasets'), { recursive: true });
      await mkdir(join(dataspecPath, 'contracts'), { recursive: true });
      await mkdir(join(dataspecPath, 'flows'), { recursive: true });

      const platformYaml = `name: ${projectName}
version: "0.1.0"
description: Data platform defined with DataSpec

storage:
  - name: data-lake
    type: s3

engines:
  - name: dbt
    type: dbt

defaults:
  storage: data-lake
`;

      // Write platform.yaml inside dataspec/
      await writeFile(join(dataspecPath, 'platform.yaml'), platformYaml);

      if (options.withExamples) {
        await createExamples(dataspecPath);
      }

      console.log(`Initialized DataSpec project '${projectName}' at ${projectPath}`);
      console.log(`All resources created in ${DATASPEC_DIR}/ folder.`);
      console.log('Run "dataspec validate" to validate your workspace.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });

async function createExamples(dataspecPath: string): Promise<void> {
  const sourceYaml = `name: example_db
type: database
entities:
  - name: users
    description: Example users table
    location: public.users
    contract:
      name: user_contract
      version: 1.0.0
`;

  await writeFile(join(dataspecPath, 'sources', 'example.yaml'), sourceYaml);

  const contractYaml = `name: user_contract
version: 1.0.0
fields:
  - name: user_id
    type: uuid
    constraints:
      unique: true
      not_null: true
  - name: email
    type: string
    constraints:
      not_null: true
`;

  await writeFile(join(dataspecPath, 'contracts', 'user_contract.yaml'), contractYaml);

  const datasetYaml = `name: users_raw
storage:
  backend: data-lake
  format: parquet
  location: s3://bucket/raw/users/
`;

  await writeFile(join(dataspecPath, 'datasets', 'users_raw.yaml'), datasetYaml);

  const flowYaml = `name: example_flow
steps:
  - type: extract
    source: example_db
    entity: users
    output: raw_users
  - type: transform
    engine: dbt
    inputs:
      - raw_users
    output: transformed_users
  - type: load
    input: transformed_users
    target: users_raw
`;

  await writeFile(join(dataspecPath, 'flows', 'example_flow.yaml'), flowYaml);

  console.log('Created example resources.');
}
