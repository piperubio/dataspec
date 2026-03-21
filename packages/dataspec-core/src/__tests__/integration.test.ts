/**
 * Integration tests for parsing complete platform specifications
 * @module __tests__/integration.test
 */

import { describe, it, expect } from 'bun:test';

import {
  parsePlatformYaml,
  parseSourceYaml,
  parseContractYaml,
  parseDatasetYaml,
  parseFlowYaml,
} from '../index';

describe('Integration: Complete E-commerce Platform', () => {
  it('should parse the example platform configuration', () => {
    const platformYaml = `
storage:
  - name: s3-data-lake
    type: s3
  - name: postgresql-warehouse
    type: postgresql
  - name: clickhouse-analytics
    type: clickhouse
engines:
  - name: dbt-transforms
    type: dbt
  - name: duckdb-local
    type: duckdb
  - name: spark-cluster
    type: spark
defaults:
  storage: s3-data-lake
`;

    const platform = parsePlatformYaml(platformYaml);
    expect(platform.storage).toHaveLength(3);
    expect(platform.engines).toHaveLength(3);
    expect(platform.defaults?.storage).toBe('s3-data-lake');
  });

  it('should parse a complete data pipeline from source to serving', () => {
    const sourceYaml = `
name: production_db
type: database
entities:
  - name: users
    location: public.users
    contract:
      name: user_contract
      version: "1.0.0"
    description: User accounts
    entityType: table
`;

    const contractYaml = `
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
`;

    const rawDatasetYaml = `
name: users_raw
storage:
  backend: s3-data-lake
  format: parquet
  location: s3://bucket/raw/users/
`;

    const refinedDatasetYaml = `
name: users_refined
storage:
  backend: s3-data-lake
  format: delta
  location: s3://bucket/refined/users/
contract:
  name: user_contract
  version: "1.0.0"
`;

    const servingDatasetYaml = `
name: customer_analytics
storage:
  backend: clickhouse-analytics
  format: native
  location: analytics.customers
`;

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

    const source = parseSourceYaml(sourceYaml);
    const contract = parseContractYaml(contractYaml);
    const rawDataset = parseDatasetYaml(rawDatasetYaml);
    const refinedDataset = parseDatasetYaml(refinedDatasetYaml);
    const servingDataset = parseDatasetYaml(servingDatasetYaml);
    const flow = parseFlowYaml(flowYaml);

    expect(source.name).toBe('production_db');
    expect(contract.name).toBe('user_contract');
    expect(rawDataset.name).toBe('users_raw');
    expect(refinedDataset.name).toBe('users_refined');
    expect(refinedDataset.contract?.name).toBe('user_contract');
    expect(servingDataset.name).toBe('customer_analytics');
    expect(flow.steps).toHaveLength(3);
    expect(flow.steps[0].type).toBe('extract');
    expect(flow.steps[1].type).toBe('transform');
    expect(flow.steps[2].type).toBe('load');
  });

  it('should support all source types', () => {
    const sources = [
      {
        type: 'database' as const,
        name: 'postgres_db',
        yaml: `
name: postgres_db
type: database
entities:
  - name: users
    location: public.users
    contract: { name: users_schema, version: "1.0.0" }
`,
      },
      {
        type: 'api' as const,
        name: 'rest_api',
        yaml: `
name: rest_api
type: api
protocol: https
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: GET
    contract: { name: users_schema, version: "1.0.0" }
`,
      },
      {
        type: 'file_system' as const,
        name: 'local_files',
        yaml: `
name: local_files
type: file_system
entities:
  - name: files
    location: /data/*.csv
    format: csv
    contract: { name: files_schema, version: "1.0.0" }
`,
      },
      {
        type: 'streaming' as const,
        name: 'kafka_stream',
        yaml: `
name: kafka_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    location: user-events
    contract: { name: events_schema, version: "1.0.0" }
`,
      },
      {
        type: 'saas' as const,
        name: 'salesforce',
        yaml: `
name: salesforce
type: saas
provider: salesforce
entities:
  - name: leads
    contract: { name: leads_schema, version: "1.0.0" }
`,
      },
    ];

    for (const { type, name, yaml } of sources) {
      const source = parseSourceYaml(yaml);
      expect(source.type).toBe(type);
    }
  });

  it('should support all data types in contracts', () => {
    const yaml = `
name: all_types_contract
version: "1.0.0"
fields:
  - name: id
    type: uuid
  - name: name
    type: string
  - name: count
    type: integer
  - name: price
    type: decimal
  - name: active
    type: boolean
  - name: created
    type: timestamp
  - name: birth_date
    type: date
  - name: config
    type: json
`;

    const contract = parseContractYaml(yaml);
    const types = contract.fields.map((f) => f.type);

    expect(types).toContain('uuid');
    expect(types).toContain('string');
    expect(types).toContain('integer');
    expect(types).toContain('decimal');
    expect(types).toContain('boolean');
    expect(types).toContain('timestamp');
    expect(types).toContain('date');
    expect(types).toContain('json');
  });
});
