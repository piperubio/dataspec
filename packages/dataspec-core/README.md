# dataspec-core

DataSpec Core - A TypeScript library for parsing and working with DataSpec YAML specifications.

## Overview

DataSpec (Declarative Data Platform Architecture) provides a declarative DSL for modeling complete data platforms, including sources, datasets, contracts, and flows. This library enables you to parse dataspec YAML specifications and work with them programmatically.

## Installation

```bash
bun add dataspec-core
```

Or with npm:

```bash
npm install @dataspec/dataspec-core
```

## Usage

### Basic Usage

```typescript
import { parsePlatformYaml, parseSourceYaml, parseContractYaml, parseDatasetYaml, parseFlowYaml } from '@dataspec/dataspec-core';

// Parse platform configuration
const platformYaml = `
storage:
  - name: s3-data-lake
    type: s3
  - name: postgresql-warehouse
    type: postgresql
engines:
  - name: dbt-transforms
    type: dbt
`;

const platform = parsePlatformYaml(platformYaml);

// Parse source definitions
const sourceYaml = `
name: production_db
type: database
entities:
  - name: users
    description: User accounts table
`;

const source = parseSourceYaml(sourceYaml);

// Parse data contracts
const contractYaml = `
name: user_contract
version: "1.0.0"
fields:
  - name: user_id
    type: uuid
    constraints:
      unique: true
      not_null: true
`;

const contract = parseContractYaml(contractYaml);

// Parse dataset definitions
const datasetYaml = `
name: users_raw
storage:
  backend: s3-data-lake
  format: parquet
  location: s3://bucket/users/
`;

const dataset = parseDatasetYaml(datasetYaml);

// Parse flow definitions
const flowYaml = `
name: user_etl_pipeline
steps:
  - type: extract
    source: production_db
    entity: users
    output: raw_users
  - type: transform
    inputs:
      - raw_users
    engine: dbt-transforms
    output: refined_users
  - type: load
    input: refined_users
    target: customer_analytics
`;

const flow = parseFlowYaml(flowYaml);
```

## Resource Types

### Platform Configuration

Defines global platform architecture including storage backends and analytics engines.

```yaml
storage:
  - name: s3-data-lake
    type: s3
  - name: postgresql-warehouse
    type: postgresql
engines:
  - name: dbt-transforms
    type: dbt
    version: ">=1.5.0"
defaults:
  storage: s3-data-lake
```

### Sources

Declare external data producers without connection details:

```yaml
name: production_db
type: database
entities:
  - name: users
    description: User accounts table
    entityType: table
```

### Contracts

Versioned schema definitions with field constraints:

```yaml
name: user_contract
version: "1.0.0"
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
```

### Datasets

Logical data units representing data at various stages:

```yaml
name: users_refined
storage:
  backend: s3-data-lake
  format: delta
  location: s3://bucket/users/
contract:
  name: user_contract
  version: "1.0.0"
```

### Flows

Data pipelines with typed steps (extract, transform, load):

```yaml
name: user_etl_pipeline
steps:
  - type: extract
    source: production_db
    entity: users
    output: raw_users
  - type: transform
    inputs:
      - raw_users
    engine: dbt-transforms
    output: refined_users
  - type: load
    input: refined_users
    target: customer_analytics
```

## Contract-First Approach

dataspec uses a contract-first approach where data schemas are explicitly defined and versioned:

1. Define contracts with field types and constraints
2. Reference contracts from datasets
3. Use semantic versioning to track contract evolution
4. Breaking changes require new contract versions

## API Reference

### Parsers

- `parsePlatformYaml(yamlContent: string): PlatformConfig`
- `parseSourceYaml(yamlContent: string): Source`
- `parseContractYaml(yamlContent: string): Contract`
- `parseDatasetYaml(yamlContent: string): Dataset`
- `parseFlowYaml(yamlContent: string): Flow`

### Types

See the `src/types/` directory for complete type definitions.

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Type check
bun run lint
```

## Examples

See the `examples/ecommerce-platform/` directory for a complete example of an e-commerce data platform specification.

## License

MIT
