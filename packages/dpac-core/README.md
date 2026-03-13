# dpac-core

Declarative Data Platform Architecture Core - A TypeScript library for parsing and working with DPAC YAML specifications.

## Overview

DPAC (Declarative Data Platform Architecture) provides a declarative DSL for modeling complete data platforms, including sources, datasets, contracts, and flows. This library enables you to parse DPAC YAML specifications and work with them programmatically.

## Installation

```bash
bun add dpac-core
```

Or with npm:

```bash
npm install dpac-core
```

## Usage

### Basic Usage

```typescript
import { parsePlatformYaml, parseSourceYaml, parseContractYaml, parseDatasetYaml, parseFlowYaml } from 'dpac-core';

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
layer: raw
storage:
  backend: s3-data-lake
  format: parquet
  location: s3://bucket/raw/users/
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

Logical data units organized in layers (raw, refined, serving):

```yaml
name: users_refined
layer: refined
storage:
  backend: s3-data-lake
  format: delta
  location: s3://bucket/refined/users/
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

## Layered Dataset Architecture

DPAC follows the medallion architecture pattern with three layers:

- **Raw** (Bronze): Unprocessed source data, exactly as ingested from sources
- **Refined** (Silver): Cleaned, validated, and normalized data with contracts applied
- **Serving** (Gold): Aggregated, business-ready data optimized for analytics

Data flows from Raw → Refined → Serving through transformation pipelines.

## Contract-First Approach

DPAC uses a contract-first approach where data schemas are explicitly defined and versioned:

1. Define contracts with field types and constraints
2. Reference contracts from datasets in the refined layer
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
