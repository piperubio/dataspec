import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { $ } from 'bun';

const CLI_PATH = join(import.meta.dir, '..', '..', 'bin', 'dataspec');

async function createTestWorkspace(basePath: string): Promise<void> {
  const dataspecPath = join(basePath, 'dataspec');
  await mkdir(join(dataspecPath, 'sources'), { recursive: true });
  await mkdir(join(dataspecPath, 'datasets'), { recursive: true });
  await mkdir(join(dataspecPath, 'flows'), { recursive: true });

  await writeFile(
    join(dataspecPath, 'platform.yaml'),
    `name: test-platform
version: "0.1.0"
storage:
  - name: data-lake
    type: s3
datahub:
  gms_url: "http://localhost:8080/api/gms"
  token: "\${DATAHUB_TOKEN}"
`,
  );

  await writeFile(
    join(dataspecPath, 'sources', 'test_db.yaml'),
    `name: test_db
type: database
entities:
  - name: users
    location: public.users
    description: Users table
`,
  );

  await writeFile(
    join(dataspecPath, 'datasets', 'users_raw.yaml'),
    `name: users_raw
storage:
  backend: data-lake
  format: parquet
  location: s3://bucket/users/
`,
  );

  await writeFile(
    join(dataspecPath, 'datasets', 'orders_raw.yaml'),
    `name: orders_raw
storage:
  backend: data-lake
  format: parquet
  location: s3://bucket/orders/
`,
  );

  await writeFile(
    join(dataspecPath, 'flows', 'etl_flow.yaml'),
    `name: etl_flow
steps:
  - type: transform
    inputs:
      - users_raw
    engine: spark
    output: users_transformed
  - type: load
    input: users_transformed
    target: users_final
`,
  );
}

describe('DataHub CLI Integration', () => {
  let testWorkspace: string;

  beforeAll(async () => {
    process.env.DATAHUB_TOKEN = 'test-token-123';
    testWorkspace = await mkdtemp(join(tmpdir(), 'dataspec-datahub-test-'));
    await createTestWorkspace(testWorkspace);
  });

  afterAll(async () => {
    delete process.env.DATAHUB_TOKEN;
    await rm(testWorkspace, { recursive: true, force: true });
  });

  describe('help support (--help)', () => {
    it('should show --help for datahub command group', async () => {
      const result = await $`${CLI_PATH} datahub --help`;
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('DataHub integration commands');
      expect(output).toContain('--gms-url');
      expect(output).toContain('--token');
      expect(output).toContain('connect');
      expect(output).toContain('sync');
    });

    it('should show --help for connect command', async () => {
      const result = await $`${CLI_PATH} datahub connect --help`;
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Test connection to DataHub');
      expect(output).toContain('--format');
      expect(output).toContain('--path');
    });

    it('should show --help for sync command', async () => {
      const result = await $`${CLI_PATH} datahub sync --help`;
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Sync resources to DataHub');
      expect(output).toContain('datasets');
      expect(output).toContain('sources');
      expect(output).toContain('lineage');
    });

    it('should show --help for sync datasets command', async () => {
      const result = await $`${CLI_PATH} datahub sync datasets --help`;
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Sync datasets to DataHub');
      expect(output).toContain('--name');
      expect(output).toContain('--incremental');
      expect(output).toContain('--dry-run');
      expect(output).toContain('--format');
    });

    it('should show --help for sync sources command', async () => {
      const result = await $`${CLI_PATH} datahub sync sources --help`;
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Sync sources to DataHub');
      expect(output).toContain('--name');
      expect(output).toContain('--dry-run');
    });

    it('should show --help for sync lineage command', async () => {
      const result = await $`${CLI_PATH} datahub sync lineage --help`;
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Sync lineage to DataHub');
      expect(output).toContain('--flow');
      expect(output).toContain('--dry-run');
    });
  });

  describe('dry-run mode (--dry-run)', () => {
    it('should dry-run datasets with text output', async () => {
      const result =
        await $`${CLI_PATH} datahub sync datasets --path ${testWorkspace} --dry-run --format text`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Dry run');
      expect(output).toContain('users_raw');
      expect(output).toContain('orders_raw');
    });

    it('should dry-run datasets with JSON output', async () => {
      const result =
        await $`${CLI_PATH} datahub sync datasets --path ${testWorkspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
      expect(json.datasets.length).toBe(2);
      expect(json.datasets.map((d: any) => d.name)).toContain('users_raw');
      expect(json.datasets.map((d: any) => d.name)).toContain('orders_raw');
    });

    it('should dry-run specific dataset by name', async () => {
      const result =
        await $`${CLI_PATH} datahub sync datasets --path ${testWorkspace} --name users_raw --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
      expect(json.datasets.length).toBe(1);
      expect(json.datasets[0].name).toBe('users_raw');
    });

    it('should dry-run sources with text output', async () => {
      const result =
        await $`${CLI_PATH} datahub sync sources --path ${testWorkspace} --dry-run --format text`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Dry run');
      expect(output).toContain('test_db');
    });

    it('should dry-run sources with JSON output', async () => {
      const result =
        await $`${CLI_PATH} datahub sync sources --path ${testWorkspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
      expect(json.sources.length).toBe(1);
      expect(json.sources[0].name).toBe('test_db');
    });

    it('should dry-run lineage with text output', async () => {
      const result =
        await $`${CLI_PATH} datahub sync lineage --path ${testWorkspace} --dry-run --format text`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Dry run');
      expect(output).toContain('etl_flow');
    });

    it('should dry-run lineage with JSON output', async () => {
      const result =
        await $`${CLI_PATH} datahub sync lineage --path ${testWorkspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
      expect(json.flows.length).toBe(1);
      expect(json.flows[0].name).toBe('etl_flow');
    });

    it('should dry-run lineage filtered by flow name', async () => {
      const result =
        await $`${CLI_PATH} datahub sync lineage --path ${testWorkspace} --flow etl_flow --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.flows.length).toBe(1);
      expect(json.flows[0].name).toBe('etl_flow');
    });
  });

  describe('global flags', () => {
    it('should accept --gms-url on parent command', async () => {
      const result =
        await $`${CLI_PATH} datahub --gms-url http://custom:9090/api/gms sync datasets --path ${testWorkspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
    });

    it('should accept --token on parent command', async () => {
      const result =
        await $`${CLI_PATH} datahub --token my-custom-token sync sources --path ${testWorkspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
    });

    it('should pass both --gms-url and --token together', async () => {
      const result =
        await $`${CLI_PATH} datahub --gms-url http://localhost:8080/api/gms --token test sync lineage --path ${testWorkspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
    });
  });

  describe('format output support', () => {
    it('should output JSON for datasets sync', async () => {
      const result =
        await $`${CLI_PATH} datahub sync datasets --path ${testWorkspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json).toHaveProperty('dryRun');
      expect(json).toHaveProperty('datasets');
      expect(Array.isArray(json.datasets)).toBe(true);
    });

    it('should output JSON for sources sync', async () => {
      const result =
        await $`${CLI_PATH} datahub sync sources --path ${testWorkspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json).toHaveProperty('dryRun');
      expect(json).toHaveProperty('sources');
      expect(Array.isArray(json.sources)).toBe(true);
    });

    it('should output JSON for lineage sync', async () => {
      const result =
        await $`${CLI_PATH} datahub sync lineage --path ${testWorkspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'test-token-123',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json).toHaveProperty('dryRun');
      expect(json).toHaveProperty('flows');
      expect(Array.isArray(json.flows)).toBe(true);
    });

    it('should output text by default', async () => {
      const result =
        await $`${CLI_PATH} datahub sync datasets --path ${testWorkspace} --dry-run`.env({
          ...process.env,
          DATAHUB_TOKEN: 'test-token-123',
        });
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Dry run');
      expect(output).toContain('- users_raw');
    });
  });

  describe('error handling', () => {
    it('should error on missing platform.yaml for connect', async () => {
      const emptyDir = await mkdtemp(join(tmpdir(), 'dataspec-empty-'));
      try {
        const result =
          await $`${CLI_PATH} datahub connect --path ${emptyDir} --format json`.nothrow();
        expect(result.exitCode).not.toBe(0);
      } finally {
        await rm(emptyDir, { recursive: true, force: true });
      }
    });

    it('should handle empty workspace for dry-run gracefully', async () => {
      const emptyWorkspace = await mkdtemp(join(tmpdir(), 'dataspec-empty-ws-'));
      try {
        const dsPath = join(emptyWorkspace, 'dataspec');
        await mkdir(join(dsPath, 'sources'), { recursive: true });
        await mkdir(join(dsPath, 'datasets'), { recursive: true });
        await mkdir(join(dsPath, 'flows'), { recursive: true });
        await writeFile(
          join(dsPath, 'platform.yaml'),
          `name: empty
storage:
  - name: test
    type: s3
datahub:
  gms_url: "http://localhost:8080/api/gms"
`,
        );

        const result =
          await $`${CLI_PATH} datahub sync datasets --path ${emptyWorkspace} --dry-run --format json`.env(
            {
              ...process.env,
              DATAHUB_TOKEN: 'test-token-123',
            },
          );
        expect(result.exitCode).toBe(0);
        const json = JSON.parse(result.stdout.toString());
        expect(json.dryRun).toBe(true);
      } finally {
        await rm(emptyWorkspace, { recursive: true, force: true });
      }
    });
  });
});
