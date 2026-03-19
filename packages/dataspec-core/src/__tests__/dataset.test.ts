/**
 * Tests for dataset parser
 * @module parsers/__tests__/dataset.test
 */

import { describe, it, expect } from 'bun:test';
import { parseDatasetYaml } from '../parsers/dataset';

describe('parseDatasetYaml', () => {
  it('should parse a raw layer dataset', () => {
    const yaml = `
name: users_raw
layer: raw
storage:
  backend: s3-data-lake
  format: parquet
  location: s3://bucket/raw/users/
`;

    const result = parseDatasetYaml(yaml);
    expect(result.name).toBe('users_raw');
    expect(result.layer).toBe('raw');
    expect(result.storage.backend).toBe('s3-data-lake');
    expect(result.storage.format).toBe('parquet');
  });

  it('should parse a refined layer dataset', () => {
    const yaml = `
name: users_refined
layer: refined
storage:
  backend: s3-data-lake
  format: delta
  location: s3://bucket/refined/users/
`;

    const result = parseDatasetYaml(yaml);
    expect(result.layer).toBe('refined');
  });

  it('should parse a serving layer dataset', () => {
    const yaml = `
name: customer_analytics
layer: serving
storage:
  backend: clickhouse-analytics
  format: native
  location: analytics.customers
`;

    const result = parseDatasetYaml(yaml);
    expect(result.layer).toBe('serving');
  });

  it('should parse a dataset with contract reference', () => {
    const yaml = `
name: users_refined
layer: refined
storage:
  backend: s3-data-lake
  format: parquet
  location: s3://bucket/refined/users/
contract:
  name: user_contract
  version: "1.0.0"
`;

    const result = parseDatasetYaml(yaml);
    expect(result.contract?.name).toBe('user_contract');
    expect(result.contract?.version).toBe('1.0.0');
  });

  it('should throw error for invalid layer value', () => {
    const yaml = `
name: test_dataset
layer: invalid_layer
storage:
  backend: s3
  format: parquet
  location: s3://bucket/test/
`;

    expect(() => parseDatasetYaml(yaml)).toThrow('Invalid dataset layer');
  });

  it('should parse dataset with metadata', () => {
    const yaml = `
name: test_dataset
layer: raw
storage:
  backend: s3
  format: parquet
  location: s3://bucket/test/
metadata:
  description: Test dataset
  owner: data-team
tags:
  - test
  - raw
`;

    const result = parseDatasetYaml(yaml);
    expect(result.name).toBe('test_dataset');
    expect(result.metadata?.description).toBe('Test dataset');
    expect(result.tags).toContain('test');
  });

  it('should throw error for missing required fields', () => {
    const yaml = `
name: test_dataset
layer: raw
`;

    expect(() => parseDatasetYaml(yaml)).toThrow('storage');
  });
});
