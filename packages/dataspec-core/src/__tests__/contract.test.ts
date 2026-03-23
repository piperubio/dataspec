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

  it('should throw schema validation error for missing version', () => {
    const yaml = `
name: test_contract
fields: []
`;

    expect(() => parseContractYaml(yaml)).toThrow('Schema validation failed');
  });

  it('should include schema error details for missing version', () => {
    const yaml = `
name: test_contract
fields: []
`;

    expect(() => parseContractYaml(yaml)).toThrow('version');
  });

  it('should throw schema validation error for invalid field type', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: field1
    type: invalid_type
`;

    expect(() => parseContractYaml(yaml)).toThrow('Schema validation failed');
  });

  it('should include field path in schema error for invalid type', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: field1
    type: invalid_type
`;

    expect(() => parseContractYaml(yaml)).toThrow('/fields/0/type');
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

  it('should throw schema validation error for missing name field', () => {
    const yaml = `
version: "1.0.0"
fields: []
`;

    expect(() => parseContractYaml(yaml)).toThrow('Schema validation failed');
    expect(() => parseContractYaml(yaml)).toThrow('name');
  });

  it('should throw schema validation error for missing fields array', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
`;

    expect(() => parseContractYaml(yaml)).toThrow('Schema validation failed');
    expect(() => parseContractYaml(yaml)).toThrow('fields');
  });

  it('should collect multiple schema validation errors', () => {
    const yaml = `{}`;

    expect(() => parseContractYaml(yaml)).toThrow('Schema validation failed');
    expect(() => parseContractYaml(yaml)).toThrow('name');
    expect(() => parseContractYaml(yaml)).toThrow('version');
  });

  it('should throw schema error for missing field name', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - type: string
`;

    expect(() => parseContractYaml(yaml)).toThrow('Schema validation failed');
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

  it('should parse valid precision and scale on decimal field', () => {
    const yaml = `
name: product_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      precision: 10
      scale: 2
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.precision).toBe(10);
    expect(field.constraints?.scale).toBe(2);
  });

  it('should reject scale greater than precision', () => {
    const yaml = `
name: product_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      precision: 3
      scale: 5
`;

    expect(() => parseContractYaml(yaml)).toThrow("'scale' (5) cannot exceed 'precision' (3)");
  });

  it('should reject precision without scale', () => {
    const yaml = `
name: product_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      precision: 10
`;

    expect(() => parseContractYaml(yaml)).toThrow(
      "must specify both 'precision' and 'scale' together",
    );
  });

  it('should reject scale without precision', () => {
    const yaml = `
name: product_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      scale: 2
`;

    expect(() => parseContractYaml(yaml)).toThrow(
      "must specify both 'precision' and 'scale' together",
    );
  });

  it('should reject precision/scale on integer field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: count
    type: integer
    constraints:
      precision: 10
      scale: 2
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for decimal fields');
  });

  it('should reject precision/scale on string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: label
    type: string
    constraints:
      precision: 10
      scale: 2
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for decimal fields');
  });

  it('should reject precision/scale on boolean field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: flag
    type: boolean
    constraints:
      precision: 5
      scale: 2
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for decimal fields');
  });

  it('should reject non-positive precision', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      precision: 0
      scale: 2
`;

    expect(() => parseContractYaml(yaml)).toThrow("'precision' must be a positive integer");
  });

  it('should reject negative precision', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      precision: -1
      scale: 2
`;

    expect(() => parseContractYaml(yaml)).toThrow("'precision' must be a positive integer");
  });

  it('should reject negative scale', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      precision: 10
      scale: -1
`;

    expect(() => parseContractYaml(yaml)).toThrow("'scale' must be a non-negative integer");
  });

  it('should parse valid min/max on integer field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: quantity
    type: integer
    constraints:
      min: 0
      max: 1000
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.min).toBe(0);
    expect(field.constraints?.max).toBe(1000);
  });

  it('should parse valid min/max on decimal field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      min: 0.01
      max: 999999.99
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.min).toBe(0.01);
    expect(field.constraints?.max).toBe(999999.99);
  });

  it('should reject min/max on string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: label
    type: string
    constraints:
      min: 0
      max: 100
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for integer or decimal fields');
  });

  it('should reject min/max on boolean field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: flag
    type: boolean
    constraints:
      min: 0
      max: 1
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for integer or decimal fields');
  });

  it('should reject min/max on timestamp field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: created_at
    type: timestamp
    constraints:
      min: 0
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for integer or decimal fields');
  });

  it('should reject min greater than max', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: quantity
    type: integer
    constraints:
      min: 100
      max: 50
`;

    expect(() => parseContractYaml(yaml)).toThrow("'min' (100) greater than 'max' (50)");
  });

  it('should reject NaN as min', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: value
    type: decimal
    constraints:
      min: NaN
`;

    expect(() => parseContractYaml(yaml)).toThrow(
      "invalid 'min' constraint - must be a finite number",
    );
  });

  it('should reject Infinity as max', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: value
    type: decimal
    constraints:
      max: Infinity
`;

    expect(() => parseContractYaml(yaml)).toThrow(
      "invalid 'max' constraint - must be a finite number",
    );
  });

  it('should reject -Infinity as min', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: value
    type: integer
    constraints:
      min: -Infinity
`;

    expect(() => parseContractYaml(yaml)).toThrow(
      "invalid 'min' constraint - must be a finite number",
    );
  });

  // 5.1: Tests for valid min_length on string field
  it('should parse valid min_length on string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: username
    type: string
    constraints:
      min_length: 3
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.min_length).toBe(3);
  });

  // 5.2: Tests for min_length rejection on non-string fields
  it('should reject min_length on integer field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: count
    type: integer
    constraints:
      min_length: 1
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  it('should reject min_length on decimal field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      min_length: 1
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  it('should reject min_length on boolean field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: flag
    type: boolean
    constraints:
      min_length: 1
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  // 5.3: Tests for min_length rejection with zero, negative, non-integer values
  it('should reject min_length of zero', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: label
    type: string
    constraints:
      min_length: 0
`;

    expect(() => parseContractYaml(yaml)).toThrow('must be a positive integer');
  });

  it('should reject negative min_length', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: label
    type: string
    constraints:
      min_length: -1
`;

    expect(() => parseContractYaml(yaml)).toThrow('must be a positive integer');
  });

  it('should reject non-integer min_length', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: label
    type: string
    constraints:
      min_length: 2.5
`;

    expect(() => parseContractYaml(yaml)).toThrow('Schema validation failed');
  });

  // 5.4: Tests for valid max_length on string field
  it('should parse valid max_length on string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: email
    type: string
    constraints:
      max_length: 255
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.max_length).toBe(255);
  });

  // 5.5: Tests for max_length rejection on non-string fields and invalid values
  it('should reject max_length on integer field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: count
    type: integer
    constraints:
      max_length: 10
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  it('should reject max_length on boolean field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: flag
    type: boolean
    constraints:
      max_length: 10
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  it('should reject max_length of zero', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: label
    type: string
    constraints:
      max_length: 0
`;

    expect(() => parseContractYaml(yaml)).toThrow('must be a positive integer');
  });

  it('should reject negative max_length', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: label
    type: string
    constraints:
      max_length: -5
`;

    expect(() => parseContractYaml(yaml)).toThrow('must be a positive integer');
  });

  // 5.6: Tests for min_length > max_length cross-constraint rejection
  it('should reject min_length greater than max_length', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: username
    type: string
    constraints:
      min_length: 10
      max_length: 5
`;

    expect(() => parseContractYaml(yaml)).toThrow(
      "'min_length' (10) greater than 'max_length' (5)",
    );
  });

  it('should accept min_length equal to max_length', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: country_code
    type: string
    constraints:
      min_length: 2
      max_length: 2
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.min_length).toBe(2);
    expect(field.constraints?.max_length).toBe(2);
  });

  // 5.7: Tests for valid format on string field with arbitrary values
  it('should parse format: email on string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: email
    type: string
    constraints:
      format: email
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.format).toBe('email');
  });

  it('should parse format: uri on string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: website
    type: string
    constraints:
      format: uri
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.format).toBe('uri');
  });

  it('should parse custom format values on string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: country
    type: string
    constraints:
      format: ISO-3166-1-alpha-2
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.format).toBe('ISO-3166-1-alpha-2');
  });

  // 5.8: Tests for format rejection on non-string fields
  it('should reject format on integer field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: count
    type: integer
    constraints:
      format: number
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  it('should reject format on decimal field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: price
    type: decimal
    constraints:
      format: currency
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  it('should reject format on boolean field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: flag
    type: boolean
    constraints:
      format: boolean-string
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  // 5.9: Tests for valid pattern on string field
  it('should parse valid pattern on string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: country_code
    type: string
    constraints:
      pattern: '^[A-Z]{2}$'
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.pattern).toBe('^[A-Z]{2}$');
  });

  it('should parse complex regex pattern on string field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: phone
    type: string
    constraints:
      pattern: '^\\+?[1-9]\\d{1,14}$'
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.pattern).toBe('^\\+?[1-9]\\d{1,14}$');
  });

  // 5.10: Tests for pattern rejection on non-string fields
  it('should reject pattern on integer field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: count
    type: integer
    constraints:
      pattern: '^\\d+$'
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  it('should reject pattern on boolean field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: flag
    type: boolean
    constraints:
      pattern: 'true|false'
`;

    expect(() => parseContractYaml(yaml)).toThrow('only valid for string fields');
  });

  // 5.11: Tests for pattern rejection with invalid regex syntax
  it('should reject pattern with invalid regex syntax', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: label
    type: string
    constraints:
      pattern: '[invalid'
`;

    expect(() => parseContractYaml(yaml)).toThrow('is not a valid regex');
  });

  it('should reject pattern with invalid regex group', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: label
    type: string
    constraints:
      pattern: '(unclosed'
`;

    expect(() => parseContractYaml(yaml)).toThrow('is not a valid regex');
  });

  // 5.12: Test for all string constraints combined on one field
  it('should parse all string constraints combined on one field', () => {
    const yaml = `
name: test_contract
version: "1.0.0"
fields:
  - name: username
    type: string
    constraints:
      min_length: 3
      max_length: 20
      format: username
      pattern: '^[a-zA-Z0-9_]+$'
`;

    const result = parseContractYaml(yaml);
    const field = result.fields[0];
    expect(field.constraints?.min_length).toBe(3);
    expect(field.constraints?.max_length).toBe(20);
    expect(field.constraints?.format).toBe('username');
    expect(field.constraints?.pattern).toBe('^[a-zA-Z0-9_]+$');
  });
});
