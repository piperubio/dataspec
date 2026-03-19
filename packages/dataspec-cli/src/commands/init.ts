import { Command } from 'commander';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

interface InitOptions {
  name?: string;
  path?: string;
  withExamples?: boolean;
  force?: boolean;
}

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

      if (!options.force) {
        const entries = await readdir(projectPath).catch(() => []);
        if (entries.length > 0) {
          console.error(`Error: Directory '${projectPath}' is not empty. Use --force to overwrite.`);
          process.exit(2);
        }
      }

      await mkdir(join(projectPath, 'sources'), { recursive: true });
      await mkdir(join(projectPath, 'datasets', 'raw'), { recursive: true });
      await mkdir(join(projectPath, 'datasets', 'refined'), { recursive: true });
      await mkdir(join(projectPath, 'datasets', 'serving'), { recursive: true });
      await mkdir(join(projectPath, 'contracts', 'raw'), { recursive: true });
      await mkdir(join(projectPath, 'contracts', 'refined'), { recursive: true });
      await mkdir(join(projectPath, 'contracts', 'serving'), { recursive: true });
      await mkdir(join(projectPath, 'flows'), { recursive: true });

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

      await writeFile(join(projectPath, 'platform.yaml'), platformYaml);

      if (options.withExamples) {
        await createExamples(projectPath);
      }

      console.log(`Initialized DataSpec project '${projectName}' at ${projectPath}`);
      console.log('Run "dataspec validate" to validate your workspace.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });

async function createExamples(projectPath: string): Promise<void> {
  const sourceYaml = `name: example_db
type: database
entities:
  - name: users
    description: Example users table
`;

  await writeFile(join(projectPath, 'sources', 'example.yaml'), sourceYaml);

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

  await writeFile(join(projectPath, 'contracts', 'refined', 'user_contract.yaml'), contractYaml);

  const datasetYaml = `name: users_raw
layer: raw
storage:
  backend: data-lake
  format: parquet
  location: s3://bucket/raw/users/
`;

  await writeFile(join(projectPath, 'datasets', 'raw', 'users_raw.yaml'), datasetYaml);

  const flowYaml = `name: example_flow
steps:
  - type: extract
    source: example_db
    entity: users
    output: raw_users
`;

  await writeFile(join(projectPath, 'flows', 'example_flow.yaml'), flowYaml);

  console.log('Created example resources.');
}
