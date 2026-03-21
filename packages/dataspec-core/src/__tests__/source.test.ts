/**
 * Tests for source parser
 * @module parsers/__tests__/source.test
 */

import { describe, it, expect } from 'bun:test';

import { parseSourceYaml } from '../parsers/source';

describe('parseSourceYaml', () => {
  it('should parse a database source', () => {
    const yaml = `
name: production_db
type: database
entities:
  - name: users
    description: User accounts table
    entityType: table
  - name: orders
    description: Orders table
    entityType: table
`;

    const result = parseSourceYaml(yaml);
    expect(result.name).toBe('production_db');
    expect(result.type).toBe('database');
    expect(result.entities).toHaveLength(2);
    expect(result.entities[0].name).toBe('users');
  });

  it('should parse an API source', () => {
    const yaml = `
name: payment_api
type: api
entities:
  - name: transactions
    description: Transactions endpoint
    entityType: endpoint
    method: GET
`;

    const result = parseSourceYaml(yaml);
    expect(result.name).toBe('payment_api');
    expect(result.type).toBe('api');
    expect(result.entities[0].method).toBe('GET');
  });

  it('should parse a file_system source', () => {
    const yaml = `
name: csv_imports
type: file_system
entities:
  - name: daily_sales
    description: Daily sales CSV files
    entityType: file
    pattern: "*.csv"
`;

    const result = parseSourceYaml(yaml);
    expect(result.name).toBe('csv_imports');
    expect(result.type).toBe('file_system');
    expect(result.entities[0].pattern).toBe('*.csv');
  });

  it('should parse a saas source', () => {
    const yaml = `
name: salesforce_crm
type: saas
entities:
  - name: leads
    description: Salesforce leads
    entityType: object
`;

    const result = parseSourceYaml(yaml);
    expect(result.name).toBe('salesforce_crm');
    expect(result.type).toBe('saas');
  });

  it('should throw error for invalid source type', () => {
    const yaml = `
name: invalid_source
type: invalid_type
entities: []
`;

    expect(() => parseSourceYaml(yaml)).toThrow('Invalid Source type');
  });

  it('should throw error for missing name', () => {
    const yaml = `
type: database
entities: []
`;

    expect(() => parseSourceYaml(yaml)).toThrow('name" is required');
  });
});
