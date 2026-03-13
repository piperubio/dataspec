/**
 * Tests for platform parser
 * @module parsers/__tests__/platform.test
 */

import { describe, it, expect } from 'bun:test';
import { parsePlatformYaml } from '../parsers/platform';

describe('parsePlatformYaml', () => {
  it('should parse a valid platform configuration', () => {
    const yaml = `
storage:
  - name: s3-primary
    type: s3
  - name: postgresql-warehouse
    type: postgresql
engines:
  - name: dbt-transforms
    type: dbt
  - name: spark-cluster
    type: spark
`;

    const result = parsePlatformYaml(yaml);
    expect(result.storage).toHaveLength(2);
    expect(result.engines).toHaveLength(2);
    expect(result.storage[0].name).toBe('s3-primary');
    expect(result.engines[0].type).toBe('dbt');
  });

  it('should throw error for duplicate storage backend names', () => {
    const yaml = `
storage:
  - name: s3-primary
    type: s3
  - name: s3-primary
    type: s3
engines: []
`;

    expect(() => parsePlatformYaml(yaml)).toThrow('Duplicate storage backend name');
  });

  it('should throw error for duplicate engine names', () => {
    const yaml = `
storage: []
engines:
  - name: dbt-main
    type: dbt
  - name: dbt-main
    type: dbt
`;

    expect(() => parsePlatformYaml(yaml)).toThrow('Duplicate analytics engine name');
  });

  it('should parse with defaults', () => {
    const yaml = `
storage:
  - name: s3-primary
    type: s3
engines: []
defaults:
  storage: s3-primary
`;

    const result = parsePlatformYaml(yaml);
    expect(result.defaults?.storage).toBe('s3-primary');
  });
});
