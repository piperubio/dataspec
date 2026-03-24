import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { $ } from 'bun';

const CLI_PATH = join(import.meta.dir, '..', '..', 'bin', 'dataspec');

async function createFullWorkspace(basePath: string): Promise<void> {
  const dataspecPath = join(basePath, 'dataspec');
  await mkdir(join(dataspecPath, 'sources'), { recursive: true });
  await mkdir(join(dataspecPath, 'datasets'), { recursive: true });
  await mkdir(join(dataspecPath, 'contracts'), { recursive: true });
  await mkdir(join(dataspecPath, 'flows'), { recursive: true });

  await writeFile(
    join(dataspecPath, 'platform.yaml'),
    `name: e2e-platform
version: "1.0.0"
storage:
  - name: warehouse
    type: s3
  - name: lake
    type: s3
engines:
  - name: spark
    type: spark
datahub:
  gms_url: "http://localhost:8080/api/gms"
  token: "\${DATAHUB_TOKEN}"
`,
  );

  await writeFile(
    join(dataspecPath, 'sources', 'postgres.yaml'),
    `name: postgres
type: database
entities:
  - name: customers
    location: public.customers
    contract:
      name: customers_contract
      version: "1.0.0"
    description: Customer records
  - name: orders
    location: public.orders
    contract:
      name: customers_contract
      version: "1.0.0"
    description: Order records
`,
  );

  await writeFile(
    join(dataspecPath, 'datasets', 'raw_customers.yaml'),
    `name: raw_customers
storage:
  backend: lake
  format: parquet
  location: s3://data-lake/raw/customers/
metadata:
  description: Raw customer data from Postgres
`,
  );

  await writeFile(
    join(dataspecPath, 'datasets', 'raw_orders.yaml'),
    `name: raw_orders
storage:
  backend: lake
  format: parquet
  location: s3://data-lake/raw/orders/
metadata:
  description: Raw order data from Postgres
`,
  );

  await writeFile(
    join(dataspecPath, 'datasets', 'dim_customers.yaml'),
    `name: dim_customers
storage:
  backend: warehouse
  format: parquet
  location: s3://warehouse/dim_customers/
contract:
  name: customers_contract
  version: "1.0.0"
metadata:
  description: Customer dimension table
`,
  );

  await writeFile(
    join(dataspecPath, 'datasets', 'fct_orders.yaml'),
    `name: fct_orders
storage:
  backend: warehouse
  format: parquet
  location: s3://warehouse/fct_orders/
metadata:
  description: Orders fact table
`,
  );

  await writeFile(
    join(dataspecPath, 'contracts', 'customers_contract.yaml'),
    `name: customers_contract
version: "1.0.0"
fields:
  - name: id
    type: integer
    constraints:
      not_null: true
  - name: email
    type: string
    constraints:
      not_null: true
  - name: name
    type: string
`,
  );

  await writeFile(
    join(dataspecPath, 'flows', 'customer_etl.yaml'),
    `name: customer_etl
metadata:
  description: ETL pipeline for customer data
steps:
  - type: extract
    source: postgres
    entity: customers
    output: raw_customers
  - type: transform
    inputs:
      - raw_customers
    engine: spark
    output: dim_customers
  - type: load
    input: dim_customers
    target: dim_customers
`,
  );

  await writeFile(
    join(dataspecPath, 'flows', 'orders_etl.yaml'),
    `name: orders_etl
metadata:
  description: ETL pipeline for order data
steps:
  - type: extract
    source: postgres
    entity: orders
    output: raw_orders
  - type: transform
    inputs:
      - raw_orders
    engine: spark
    output: fct_orders
  - type: load
    input: fct_orders
    target: fct_orders
`,
  );
}

describe('DataHub E2E - Full Sync Workflow', () => {
  let workspace: string;

  beforeAll(async () => {
    process.env.DATAHUB_TOKEN = 'e2e-test-token';
    workspace = await mkdtemp(join(tmpdir(), 'dataspec-datahub-e2e-'));
    await createFullWorkspace(workspace);
  });

  afterAll(async () => {
    delete process.env.DATAHUB_TOKEN;
    await rm(workspace, { recursive: true, force: true });
  });

  describe('prerequisite: workspace validation', () => {
    it('should validate workspace before sync', async () => {
      const result = await $`${CLI_PATH} validate --path ${workspace}`.env({
        ...process.env,
        DATAHUB_TOKEN: 'e2e-test-token',
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout.toString()).toContain('Validation passed');
    });

    it('should show workspace resources via list', async () => {
      const result = await $`${CLI_PATH} list --path ${workspace} --format json`.env({
        ...process.env,
        DATAHUB_TOKEN: 'e2e-test-token',
      });
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.sources).toBe(1);
      expect(json.datasets).toBe(4);
      expect(json.flows).toBe(2);
    });
  });

  describe('dry-run: verify all resources would be synced', () => {
    it('should dry-run all datasets', async () => {
      const result =
        await $`${CLI_PATH} datahub sync datasets --path ${workspace} --dry-run --format json`.env({
          ...process.env,
          DATAHUB_TOKEN: 'e2e-test-token',
        });
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
      expect(json.datasets.length).toBe(4);
      const names = json.datasets.map((d: any) => d.name);
      expect(names).toContain('raw_customers');
      expect(names).toContain('raw_orders');
      expect(names).toContain('dim_customers');
      expect(names).toContain('fct_orders');
    });

    it('should dry-run all sources', async () => {
      const result =
        await $`${CLI_PATH} datahub sync sources --path ${workspace} --dry-run --format json`.env({
          ...process.env,
          DATAHUB_TOKEN: 'e2e-test-token',
        });
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
      expect(json.sources.length).toBe(1);
      const names = json.sources.map((s: any) => s.name);
      expect(names).toContain('postgres');
    });

    it('should dry-run all lineage flows', async () => {
      const result =
        await $`${CLI_PATH} datahub sync lineage --path ${workspace} --dry-run --format json`.env({
          ...process.env,
          DATAHUB_TOKEN: 'e2e-test-token',
        });
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
      expect(json.flows.length).toBe(2);
      const names = json.flows.map((f: any) => f.name);
      expect(names).toContain('customer_etl');
      expect(names).toContain('orders_etl');
    });
  });

  describe('filtering: resource name filters', () => {
    it('should filter datasets by --name', async () => {
      const result =
        await $`${CLI_PATH} datahub sync datasets --path ${workspace} --name raw_customers --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'e2e-test-token',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.datasets.length).toBe(1);
      expect(json.datasets[0].name).toBe('raw_customers');
    });

    it('should filter sources by --name', async () => {
      const result =
        await $`${CLI_PATH} datahub sync sources --path ${workspace} --name postgres --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'e2e-test-token',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.sources.length).toBe(1);
      expect(json.sources[0].name).toBe('postgres');
    });

    it('should filter lineage by --flow', async () => {
      const result =
        await $`${CLI_PATH} datahub sync lineage --path ${workspace} --flow orders_etl --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'e2e-test-token',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.flows.length).toBe(1);
      expect(json.flows[0].name).toBe('orders_etl');
    });
  });

  describe('text output: verify human-readable output', () => {
    it('should show datasets in text format', async () => {
      const result =
        await $`${CLI_PATH} datahub sync datasets --path ${workspace} --dry-run --format text`.env({
          ...process.env,
          DATAHUB_TOKEN: 'e2e-test-token',
        });
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Dry run');
      expect(output).toContain('raw_customers');
      expect(output).toContain('lake/parquet');
    });

    it('should show sources in text format', async () => {
      const result =
        await $`${CLI_PATH} datahub sync sources --path ${workspace} --dry-run --format text`.env({
          ...process.env,
          DATAHUB_TOKEN: 'e2e-test-token',
        });
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Dry run');
      expect(output).toContain('postgres');
      expect(output).toContain('type: database');
    });

    it('should show lineage in text format', async () => {
      const result =
        await $`${CLI_PATH} datahub sync lineage --path ${workspace} --dry-run --format text`.env({
          ...process.env,
          DATAHUB_TOKEN: 'e2e-test-token',
        });
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toString();
      expect(output).toContain('Dry run');
      expect(output).toContain('customer_etl');
      expect(output).toContain('orders_etl');
    });
  });

  describe('consistent JSON output structure', () => {
    it('should produce consistent JSON across all dry-run commands', async () => {
      const datasetsResult =
        await $`${CLI_PATH} datahub sync datasets --path ${workspace} --dry-run --format json`.env({
          ...process.env,
          DATAHUB_TOKEN: 'e2e-test-token',
        });
      const datasets = JSON.parse(datasetsResult.stdout.toString());
      expect(datasets).toHaveProperty('dryRun');
      expect(datasets).toHaveProperty('datasets');

      const sourcesResult =
        await $`${CLI_PATH} datahub sync sources --path ${workspace} --dry-run --format json`.env({
          ...process.env,
          DATAHUB_TOKEN: 'e2e-test-token',
        });
      const sources = JSON.parse(sourcesResult.stdout.toString());
      expect(sources).toHaveProperty('dryRun');
      expect(sources).toHaveProperty('sources');

      const lineageResult =
        await $`${CLI_PATH} datahub sync lineage --path ${workspace} --dry-run --format json`.env({
          ...process.env,
          DATAHUB_TOKEN: 'e2e-test-token',
        });
      const lineage = JSON.parse(lineageResult.stdout.toString());
      expect(lineage).toHaveProperty('dryRun');
      expect(lineage).toHaveProperty('flows');
    });
  });

  describe('command chain: global flags propagation', () => {
    it('should pass --gms-url through to sync subcommands', async () => {
      const result =
        await $`${CLI_PATH} datahub --gms-url http://custom:9090/gms sync datasets --path ${workspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'e2e-test-token',
          },
        );
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.toString());
      expect(json.dryRun).toBe(true);
    });

    it('should pass --token through to sync subcommands', async () => {
      const result =
        await $`${CLI_PATH} datahub --token abc123 sync sources --path ${workspace} --dry-run --format json`.env(
          {
            ...process.env,
            DATAHUB_TOKEN: 'e2e-test-token',
          },
        );
      expect(result.exitCode).toBe(0);
    });
  });
});
