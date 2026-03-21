import type { PlatformConfig, StorageBackend, AnalyticsEngine } from '@dataspec/dataspec-core';

import type {
  Workspace,
  ParsedSource,
  ParsedDataset,
  ParsedContract,
  ParsedFlow,
} from '../../src/parsing/types.js';

/**
 * Test fixture utilities for dataspec-cli tests
 */

// Mock Platform Configuration
export function createMockPlatform(overrides?: Partial<PlatformConfig>): PlatformConfig {
  return {
    name: 'test-platform',
    version: '1.0.0',
    storage: [
      createMockStorageBackend({ name: 's3', type: 's3' }),
      createMockStorageBackend({ name: 'postgres', type: 'postgresql' }),
    ],
    engines: [
      createMockEngine({ name: 'dbt', type: 'dbt' }),
      createMockEngine({ name: 'duckdb', type: 'duckdb' }),
    ],
    defaults: {
      storage: 's3',
      engine: 'dbt',
    },
    ...overrides,
  };
}

export function createMockStorageBackend(overrides?: Partial<StorageBackend>): StorageBackend {
  return {
    name: 'default-storage',
    type: 's3',
    ...overrides,
  };
}

export function createMockEngine(overrides?: Partial<AnalyticsEngine>): AnalyticsEngine {
  return {
    name: 'default-engine',
    type: 'dbt',
    ...overrides,
  };
}

// Mock Sources
export function createMockSource(overrides?: Partial<ParsedSource>): ParsedSource {
  return {
    name: 'test-source',
    type: 'database',
    entities: [
      { name: 'users', type: 'table' },
      { name: 'orders', type: 'table' },
    ],
    file: 'dataspec/sources/test.yaml',
    line: 1,
    ...overrides,
  };
}

// Mock Contracts
export function createMockContract(overrides?: Partial<ParsedContract>): ParsedContract {
  return {
    name: 'test-contract',
    version: '1.0.0',
    fields: [
      { name: 'id', type: 'uuid', constraints: { not_null: true, unique: true } },
      { name: 'name', type: 'string', constraints: { not_null: true } },
      { name: 'email', type: 'string' },
      { name: 'created_at', type: 'timestamp' },
    ],
    file: 'dataspec/contracts/test.yaml',
    line: 1,
    ...overrides,
  };
}

// Mock Datasets
export function createMockDataset(overrides?: Partial<ParsedDataset>): ParsedDataset {
  return {
    name: 'test-dataset',
    storage: {
      backend: 's3',
      format: 'parquet',
      location: 's3://bucket/data/test/',
    },
    contract: {
      name: 'test-contract',
      version: '1.0.0',
    },
    file: 'dataspec/datasets/test.yaml',
    line: 1,
    ...overrides,
  };
}

// Mock Flows
export function createMockFlow(overrides?: Partial<ParsedFlow>): ParsedFlow {
  return {
    name: 'test-flow',
    steps: [
      {
        type: 'extract',
        source: 'test-source',
        entity: 'users',
      },
      {
        type: 'transform',
        inputs: ['raw-users'],
        engine: 'dbt',
        output: 'refined-users',
      },
      {
        type: 'load',
        input: 'refined-users',
        target: 'serving-users',
      },
    ],
    file: 'dataspec/flows/test.yaml',
    line: 1,
    ...overrides,
  };
}

// Mock Workspace
export function createMockWorkspace(overrides?: Partial<Workspace>): Workspace {
  return {
    platform: createMockPlatform(),
    sources: [createMockSource()],
    datasets: [createMockDataset()],
    contracts: [createMockContract()],
    flows: [createMockFlow()],
    rootDir: '/test/workspace',
    ...overrides,
  };
}

// Create ETL Pipeline Flow
export function createMockETLFlow(
  sourceName: string,
  rawDataset: string,
  refinedDataset: string,
  servingDataset: string,
  overrides?: Partial<ParsedFlow>,
): ParsedFlow {
  return {
    name: `${sourceName}-pipeline`,
    steps: [
      {
        type: 'extract',
        source: sourceName,
        entity: 'data',
      },
      {
        type: 'transform',
        inputs: [rawDataset],
        engine: 'dbt',
        output: refinedDataset,
      },
      {
        type: 'load',
        input: refinedDataset,
        target: servingDataset,
      },
    ],
    file: `dataspec/flows/${sourceName}-pipeline.yaml`,
    line: 1,
    ...overrides,
  };
}

// YAML Content Generators
export function generatePlatformYaml(platform: Partial<PlatformConfig> = {}): string {
  const p = createMockPlatform(platform);
  return `
name: ${p.name}
version: ${p.version}
storage:
${p.storage.map((s) => `  - name: ${s.name}\n    type: ${s.type}`).join('\n')}
engines:
${p.engines.map((e) => `  - name: ${e.name}\n    type: ${e.type}`).join('\n')}
defaults:
  storage: ${p.defaults.storage}
  engine: ${p.defaults.engine}
`.trim();
}

export function generateSourceYaml(source: Partial<ParsedSource> = {}): string {
  const s = createMockSource(source);
  return `
name: ${s.name}
type: ${s.type}
entities:
${s.entities.map((e) => `  - name: ${e.name}\n    type: ${e.type}`).join('\n')}
`.trim();
}

export function generateContractYaml(contract: Partial<ParsedContract> = {}): string {
  const c = createMockContract(contract);
  return `
name: ${c.name}
version: ${c.version}
fields:
${c.fields
  .map((f) => {
    let fieldStr = `  - name: ${f.name}\n    type: ${f.type}`;
    if (f.constraints) {
      fieldStr += '\n    constraints:';
      if (f.constraints.not_null) {
        fieldStr += '\n      not_null: true';
      }
      if (f.constraints.unique) {
        fieldStr += '\n      unique: true';
      }
      if (f.constraints.ref) {
        fieldStr += `\n      ref: ${f.constraints.ref}`;
      }
    }
    return fieldStr;
  })
  .join('\n')}
`.trim();
}

export function generateDatasetYaml(dataset: Partial<ParsedDataset> = {}): string {
  const d = createMockDataset(dataset);
  let yaml = `
name: ${d.name}
storage:
  backend: ${d.storage.backend}
  format: ${d.storage.format}
  location: ${d.storage.location}
`.trim();

  if (d.contract) {
    yaml += `\ncontract:\n  name: ${d.contract.name}\n  version: ${d.contract.version}`;
  }

  return yaml;
}

export function generateFlowYaml(flow: Partial<ParsedFlow> = {}): string {
  const f = createMockFlow(flow);
  return `
name: ${f.name}
steps:
${f.steps
  .map((step) => {
    if (step.type === 'extract') {
      return `  - type: extract\n    source: ${step.source}\n    entity: ${step.entity}`;
    } else if (step.type === 'transform') {
      return `  - type: transform\n    inputs:\n${step.inputs.map((i) => `      - ${i}`).join('\n')}\n    engine: ${step.engine}\n    output: ${step.output}`;
    }
    return `  - type: load\n    input: ${step.input}\n    target: ${step.target}`;
  })
  .join('\n')}
`.trim();
}

// Assertion Helpers
export function expectValidationError(
  result: { errors: Array<{ message: string; code?: string }> },
  code: string,
): void {
  const found = result.errors.some((e) => e.code === code);
  if (!found) {
    throw new Error(
      `Expected validation error with code '${code}' but not found. Errors: ${JSON.stringify(result.errors)}`,
    );
  }
}

export function expectNoValidationErrors(result: { errors: Array<unknown> }): void {
  if (result.errors.length > 0) {
    throw new Error(`Expected no validation errors but found: ${JSON.stringify(result.errors)}`);
  }
}

export function expectValidationWarning(
  result: { warnings: Array<{ message: string; code?: string }> },
  code: string,
): void {
  const found = result.warnings.some((w) => w.code === code);
  if (!found) {
    throw new Error(
      `Expected validation warning with code '${code}' but not found. Warnings: ${JSON.stringify(result.warnings)}`,
    );
  }
}
