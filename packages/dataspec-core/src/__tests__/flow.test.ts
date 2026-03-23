/**
 * Tests for flow parser
 * @module parsers/__tests__/flow.test
 */

import { describe, it, expect } from 'bun:test';

import { parseFlowYaml } from '../parsers/flow';

describe('parseFlowYaml', () => {
  it('should parse a flow with all step types', () => {
    const yaml = `
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

    const result = parseFlowYaml(yaml);
    expect(result.name).toBe('user_etl_pipeline');
    expect(result.steps).toHaveLength(3);

    // Check extract step
    expect(result.steps[0].type).toBe('extract');
    expect(result.steps[0].source).toBe('production_db');
    expect(result.steps[0].entity).toBe('users');

    // Check transform step
    expect(result.steps[1].type).toBe('transform');
    expect(result.steps[1].inputs).toContain('raw_users');
    expect(result.steps[1].engine).toBe('dbt-transforms');

    // Check load step
    expect(result.steps[2].type).toBe('load');
    expect(result.steps[2].input).toBe('refined_users');
    expect(result.steps[2].target).toBe('customer_analytics');
  });

  it('should parse extract step only', () => {
    const yaml = `
name: extract_only_flow
steps:
  - type: extract
    source: production_db
    entity: orders
    output: raw_orders
`;

    const result = parseFlowYaml(yaml);
    expect(result.steps[0].type).toBe('extract');
  });

  it('should parse transform step with multiple inputs', () => {
    const yaml = `
name: multi_input_transform
steps:
  - type: transform
    inputs:
      - users
      - orders
      - products
    engine: spark-cluster
    output: joined_data
`;

    const result = parseFlowYaml(yaml);
    expect(result.steps[0].inputs).toHaveLength(3);
    expect(result.steps[0].inputs).toContain('users');
    expect(result.steps[0].inputs).toContain('orders');
    expect(result.steps[0].inputs).toContain('products');
  });

  it('should throw error for invalid step type', () => {
    const yaml = `
name: invalid_flow
steps:
  - type: invalid_step
    some_field: value
`;

    expect(() => parseFlowYaml(yaml)).toThrow();
  });

  it('should throw error for missing extract step fields', () => {
    const yaml = `
name: incomplete_extract
steps:
  - type: extract
    source: production_db
`;

    expect(() => parseFlowYaml(yaml)).toThrow('entity');
  });

  it('should throw error for missing transform step fields', () => {
    const yaml = `
name: incomplete_transform
steps:
  - type: transform
    inputs: []
`;

    expect(() => parseFlowYaml(yaml)).toThrow('engine');
  });

  it('should parse flow with metadata', () => {
    const yaml = `
name: scheduled_flow
steps: []
metadata:
  description: Daily data pipeline
  schedule: "0 2 * * *"
`;

    const result = parseFlowYaml(yaml);
    expect(result.metadata?.description).toBe('Daily data pipeline');
  });
});
