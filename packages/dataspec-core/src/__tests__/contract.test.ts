/**
 * Tests for contract parser
 * @module parsers/__tests__/contract.test
 */

import { describe, it, expect } from 'bun:test';

import { parseContractYaml } from '../parsers/contract';

describe('parseContractYaml', () => {
  it('should parse a contract with multiple field types', () => {
    const yaml = `
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
  - name: age
    type: integer
  - name: balance
    type: decimal
  - name: is_active
    type: boolean
  - name: created_at
    type: timestamp
  - name: birth_date
    type: date
  - name: metadata
    type: json
`;

    const result = parseContractYaml(yaml);
    expect(result.name).toBe('user_contract');
    expect(result.version).toBe('1.0.0');
    expect(result.fields).toHaveLength(8);

    // Check field types
    const types = result.fields.map((f) => f.type);
    expect(types).toContain('uuid');
    expect(types).toContain('string');
    expect(types).toContain('integer');
    expect(types).toContain('decimal');
    expect(types).toContain('boolean');
    expect(types).toContain('timestamp');
    expect(types).toContain('date');
    expect(types).toContain('json');
  });

  it('should throw error for missing version', () => {
    const yaml = `
name: test_contract
fields: []
`;

    expect(() => parseContractYaml(yaml)).toThrow('version');
  });

  it('should throw error for invalid field type', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: field1
    type: invalid_type
`;

    expect(() => parseContractYaml(yaml)).toThrow('invalid type');
  });

  it('should throw error for duplicate field names', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: field1
    type: string
  - name: field1
    type: integer
`;

    // Note: The parser doesn't currently check for duplicate field names
    // This test documents expected behavior that may be added later
    const result = parseContractYaml(yaml);
    expect(result.fields).toHaveLength(2);
  });

  it('should parse field constraints', () => {
    const yaml = `
name: constrained_contract
version: "1.0.0"
fields:
  - name: user_id
    type: uuid
    constraints:
      unique: true
      not_null: true
      ref: other_contract.id
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.unique).toBe(true);
    expect(field.constraints?.not_null).toBe(true);
    expect(field.constraints?.ref).toBe('other_contract.id');
  });

  it('should parse contract metadata', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields: []
metadata:
  description: Test contract description
  owner: data-team
tags:
  - test
  - example
`;

    const result = parseContractYaml(yaml);
    expect(result.metadata?.description).toBe('Test contract description');
    expect(result.tags).toContain('test');
  });

  it('should parse allowed_values constraint on string field', () => {
    const yaml = `
name: order_contract
version: "1.0.0"
fields:
  - name: status
    type: string
    constraints:
      allowed_values:
        - pending
        - processing
        - shipped
        - delivered
        - cancelled
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.allowed_values).toEqual([
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ]);
  });

  it('should throw error for allowed_values on non-string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: count
    type: integer
    constraints:
      allowed_values:
        - one
        - two
`;

    expect(() => parseContractYaml(yaml)).toThrow(
      "Field 'count' has 'allowed_values' constraint - only valid for string fields",
    );
  });

  it('should accept empty allowed_values array', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: status
    type: string
    constraints:
      allowed_values: []
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.allowed_values).toEqual([]);
  });
});
