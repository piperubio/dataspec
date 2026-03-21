/**
 * Tests for dataset parser
 * @module parsers/__tests__/dataset.test
 */

import { describe, it, expect } from 'bun:test';

import { parseDatasetYaml } from '../parsers/dataset';

describe('parseDatasetYaml', () => {
  it('should parse a basic dataset', () => {
    const yaml = `
name: users_raw
storage:
  backend: s3-data-lake
  format: parquet
  location: s3://bucket/raw/users/
`;

    const result = parseDatasetYaml(yaml);
    expect(result.name).toBe('users_raw');
    expect(result.storage.backend).toBe('s3-data-lake');
    expect(result.storage.format).toBe('parquet');
  });

  it('should parse a dataset with delta format', () => {
    const yaml = `
name: users_refined
storage:
  backend: s3-data-lake
  format: delta
  location: s3://bucket/refined/users/
`;

    const result = parseDatasetYaml(yaml);
    expect(result.name).toBe('users_refined');
    expect(result.storage.format).toBe('delta');
  });

  it('should parse a dataset with analytics backend', () => {
    const yaml = `
name: customer_analytics
storage:
  backend: clickhouse-analytics
  format: native
  location: analytics.customers
`;

    const result = parseDatasetYaml(yaml);
    expect(result.name).toBe('customer_analytics');
    expect(result.storage.backend).toBe('clickhouse-analytics');
  });

  it('should parse a dataset with contract reference', () => {
    const yaml = `
name: users_refined
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

  it('should parse dataset with metadata', () => {
    const yaml = `
name: test_dataset
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
`;

    expect(() => parseDatasetYaml(yaml)).toThrow('storage');
  });
});
