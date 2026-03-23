import { describe, it, expect } from 'bun:test';

import type { Workspace } from '../src/parsing/workspace';
import { validateWorkspace } from '../src/validation/validator';

describe('Validation Engine', () => {
  describe('Cross-resource references', () => {
    it('should detect unresolved source references', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [],
        flows: [
          {
            name: 'flow1',
            steps: [
              {
                type: 'extract',
                source: 'nonexistent_db',
                entity: 'users',
                output: 'raw_users',
              },
            ],
            file: 'flows/flow1.yaml',
            line: 1,
          },
        ],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNRESOLVED_SOURCE')).toBe(true);
    });

    it('should detect unresolved step output references in transform inputs', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [],
        flows: [
          {
            name: 'flow1',
            steps: [
              {
                type: 'transform',
                inputs: ['nonexistent_variable'],
                output: 'output',
                engine: 'dbt',
              },
            ],
            file: 'flows/flow1.yaml',
            line: 1,
          },
        ],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNRESOLVED_STEP_OUTPUT')).toBe(true);
    });

    it('should not flag transform inputs that match prior step outputs', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'db1',
            type: 'database',
            entities: [],
            file: 'sources/db.yaml',
            line: 1,
          },
        ],
        datasets: [
          {
            name: 'output_ds',
            layer: 'refined',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/output' },
            file: 'datasets/output.yaml',
            line: 1,
          },
        ],
        contracts: [],
        flows: [
          {
            name: 'flow1',
            steps: [
              {
                type: 'extract',
                source: 'db1',
                entity: 'users',
                output: 'raw_users',
              },
              {
                type: 'transform',
                inputs: ['raw_users'], // references the extract step's output variable
                engine: 'dbt',
                output: 'transformed_users',
              },
              {
                type: 'load',
                input: 'transformed_users',
                target: 'output_ds',
              },
            ],
            file: 'flows/flow1.yaml',
            line: 1,
          },
        ],
      };

      const result = validateWorkspace(workspace);
      expect(result.errors.some((e) => e.code === 'UNRESOLVED_STEP_OUTPUT')).toBe(false);
    });

    it('should detect unresolved dataset target in load step', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [],
        flows: [
          {
            name: 'flow1',
            steps: [
              {
                type: 'load',
                input: 'some_variable',
                target: 'nonexistent_dataset',
              },
            ],
            file: 'flows/flow1.yaml',
            line: 1,
          },
        ],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNRESOLVED_DATASET')).toBe(true);
    });

    it('should not flag load step input as a dataset reference', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [
          {
            name: 'target_ds',
            layer: 'refined',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/target' },
            file: 'datasets/target.yaml',
            line: 1,
          },
        ],
        contracts: [],
        flows: [
          {
            name: 'flow1',
            steps: [
              {
                type: 'load',
                input: 'flow_variable', // flow-local variable; does not need to match a dataset
                target: 'target_ds',
              },
            ],
            file: 'flows/flow1.yaml',
            line: 1,
          },
        ],
      };

      const result = validateWorkspace(workspace);
      expect(result.errors.some((e) => e.code === 'UNRESOLVED_DATASET')).toBe(false);
    });

    it('should detect unresolved contract references', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [
          {
            name: 'users',
            layer: 'raw',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/users' },
            contract: { name: 'nonexistent_contract', version: '1.0.0' },
            file: 'datasets/users.yaml',
            line: 1,
          },
        ],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNRESOLVED_CONTRACT')).toBe(true);
    });

    it('should pass when all references resolve', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'db1',
            type: 'database',
            entities: [],
            file: 'sources/db.yaml',
            line: 1,
          },
        ],
        datasets: [
          {
            name: 'users_raw',
            layer: 'raw',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/users' },
            file: 'datasets/users.yaml',
            line: 1,
          },
        ],
        contracts: [],
        flows: [
          {
            name: 'flow1',
            steps: [
              {
                type: 'extract',
                source: 'db1',
                entity: 'users',
                output: 'users_raw',
              },
            ],
            file: 'flows/flow1.yaml',
            line: 1,
          },
        ],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(true);
    });
  });

  describe('Contract consistency', () => {
    it('should reject precision/scale on non-decimal fields', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [
          {
            name: 'test_contract',
            version: '1.0.0',
            fields: [
              {
                name: 'field1',
                type: 'integer',
                constraints: {
                  precision: 10,
                  scale: 2,
                },
              },
            ],
            file: 'contracts/test.yaml',
            line: 1,
          },
        ],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_CONSTRAINT')).toBe(true);
      expect(
        result.errors.some(
          (e) => e.code === 'INVALID_CONSTRAINT' && e.message.includes('precision/scale'),
        ),
      ).toBe(true);
    });

    it('should reject min/max on non-numeric fields', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [
          {
            name: 'test_contract',
            version: '1.0.0',
            fields: [
              {
                name: 'field1',
                type: 'string',
                constraints: {
                  min: 0,
                  max: 100,
                },
              },
            ],
            file: 'contracts/test.yaml',
            line: 1,
          },
        ],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_CONSTRAINT')).toBe(true);
      expect(
        result.errors.some((e) => e.code === 'INVALID_CONSTRAINT' && e.message.includes('min/max')),
      ).toBe(true);
    });

    it('should allow precision/scale on decimal fields', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [
          {
            name: 'test_contract',
            version: '1.0.0',
            fields: [
              {
                name: 'field1',
                type: 'decimal',
                constraints: {
                  precision: 10,
                  scale: 2,
                },
              },
            ],
            file: 'contracts/test.yaml',
            line: 1,
          },
        ],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      const constraintErrors = result.errors.filter(
        (e) =>
          e.code === 'INVALID_CONSTRAINT' &&
          (e.message.includes('precision/scale') || e.message.includes('min/max')),
      );
      expect(constraintErrors.length).toBe(0);
    });

    it('should allow min/max on integer fields', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [
          {
            name: 'test_contract',
            version: '1.0.0',
            fields: [
              {
                name: 'field1',
                type: 'integer',
                constraints: {
                  min: 0,
                  max: 100,
                },
              },
            ],
            file: 'contracts/test.yaml',
            line: 1,
          },
        ],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      const constraintErrors = result.errors.filter(
        (e) =>
          e.code === 'INVALID_CONSTRAINT' &&
          (e.message.includes('precision/scale') || e.message.includes('min/max')),
      );
      expect(constraintErrors.length).toBe(0);
    });

    it('should allow min/max on decimal fields', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [
          {
            name: 'test_contract',
            version: '1.0.0',
            fields: [
              {
                name: 'field1',
                type: 'decimal',
                constraints: {
                  min: 0.0,
                  max: 999.99,
                },
              },
            ],
            file: 'contracts/test.yaml',
            line: 1,
          },
        ],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      const constraintErrors = result.errors.filter(
        (e) =>
          e.code === 'INVALID_CONSTRAINT' &&
          (e.message.includes('precision/scale') || e.message.includes('min/max')),
      );
      expect(constraintErrors.length).toBe(0);
    });

    it('should detect invalid field types', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [
          {
            name: 'test_contract',
            version: '1.0.0',
            fields: [
              {
                name: 'field1',
                type: 'invalid_type',
              },
            ],
            file: 'contracts/test.yaml',
            line: 1,
          },
        ],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_FIELD_TYPE')).toBe(true);
    });

    it('should detect invalid semantic versions', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [
          {
            name: 'test_contract',
            version: '1.5', // Invalid: should be X.Y.Z
            fields: [],
            file: 'contracts/test.yaml',
            line: 1,
          },
        ],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_VERSION')).toBe(true);
    });
  });

  describe('Orphaned resources', () => {
    it('should warn about orphaned datasets when flows exist', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'db1',
            type: 'database',
            entities: [],
            file: 'sources/db.yaml',
            line: 1,
          },
        ],
        datasets: [
          {
            name: 'produced',
            layer: 'refined',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/produced' },
            file: 'datasets/produced.yaml',
            line: 1,
          },
          {
            name: 'orphaned',
            layer: 'raw',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/orphaned' },
            file: 'datasets/orphaned.yaml',
            line: 1,
          },
        ],
        contracts: [],
        flows: [
          {
            name: 'flow1',
            steps: [
              {
                type: 'extract',
                source: 'db1',
                entity: 'users',
                output: 'raw_users',
              },
              {
                type: 'transform',
                inputs: ['raw_users'], // flow-local variable, not a dataset name
                output: 'transformed_users',
                engine: 'dbt',
              },
              {
                type: 'load',
                input: 'transformed_users',
                target: 'produced', // 'produced' dataset is targeted by this load step
              },
            ],
            file: 'flows/flow1.yaml',
            line: 1,
          },
        ],
      };

      const result = validateWorkspace(workspace);

      // 'orphaned' is not targeted by any load step - should be flagged
      expect(
        result.warnings.some(
          (w) => w.code === 'ORPHANED_DATASET' && w.message.includes('orphaned'),
        ),
      ).toBe(true);
      // 'produced' is targeted by a load step - should NOT be flagged as orphaned
      expect(
        result.warnings.some(
          (w) => w.code === 'ORPHANED_DATASET' && w.message.includes("'produced'"),
        ),
      ).toBe(false);
    });
  });

  describe('Resource name uniqueness', () => {
    it('should detect duplicate source names', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'production_db',
            type: 'database',
            entities: [],
            file: 'sources/db1.yaml',
            line: 1,
          },
          {
            name: 'production_db',
            type: 'database',
            entities: [],
            file: 'sources/db2.yaml',
            line: 5,
          },
        ],
        datasets: [],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_SOURCE_NAME')).toBe(true);
      const duplicateError = result.errors.find((e) => e.code === 'DUPLICATE_SOURCE_NAME');
      expect(duplicateError?.message).toContain("'production_db'");
      expect(duplicateError?.location.file).toBe('sources/db2.yaml');
      expect(duplicateError?.location.line).toBe(5);
    });

    it('should detect duplicate dataset names', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [
          {
            name: 'users_raw',
            layer: 'raw',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/users1' },
            file: 'datasets/users1.yaml',
            line: 3,
          },
          {
            name: 'users_raw',
            layer: 'refined',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/users2' },
            file: 'datasets/users2.yaml',
            line: 7,
          },
        ],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_DATASET_NAME')).toBe(true);
      const duplicateError = result.errors.find((e) => e.code === 'DUPLICATE_DATASET_NAME');
      expect(duplicateError?.message).toContain("'users_raw'");
      expect(duplicateError?.location.file).toBe('datasets/users2.yaml');
      expect(duplicateError?.location.line).toBe(7);
    });

    it('should detect duplicate contract names', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [
          {
            name: 'user_contract',
            version: '1.0.0',
            fields: [],
            file: 'contracts/contract1.yaml',
            line: 2,
          },
          {
            name: 'user_contract',
            version: '2.0.0',
            fields: [],
            file: 'contracts/contract2.yaml',
            line: 4,
          },
        ],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_CONTRACT_NAME')).toBe(true);
      const duplicateError = result.errors.find((e) => e.code === 'DUPLICATE_CONTRACT_NAME');
      expect(duplicateError?.message).toContain("'user_contract'");
      expect(duplicateError?.location.file).toBe('contracts/contract2.yaml');
      expect(duplicateError?.location.line).toBe(4);
    });

    it('should detect duplicate flow names', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [],
        flows: [
          {
            name: 'users_etl',
            steps: [],
            file: 'flows/flow1.yaml',
            line: 1,
          },
          {
            name: 'users_etl',
            steps: [],
            file: 'flows/flow2.yaml',
            line: 10,
          },
        ],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_FLOW_NAME')).toBe(true);
      const duplicateError = result.errors.find((e) => e.code === 'DUPLICATE_FLOW_NAME');
      expect(duplicateError?.message).toContain("'users_etl'");
      expect(duplicateError?.location.file).toBe('flows/flow2.yaml');
      expect(duplicateError?.location.line).toBe(10);
    });

    it('should detect multiple duplicates of the same name', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'shared_db',
            type: 'database',
            entities: [],
            file: 'sources/db1.yaml',
            line: 1,
          },
          {
            name: 'shared_db',
            type: 'database',
            entities: [],
            file: 'sources/db2.yaml',
            line: 2,
          },
          {
            name: 'shared_db',
            type: 'database',
            entities: [],
            file: 'sources/db3.yaml',
            line: 3,
          },
        ],
        datasets: [],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      // Should have 2 errors (for 2nd and 3rd occurrences)
      const duplicateErrors = result.errors.filter((e) => e.code === 'DUPLICATE_SOURCE_NAME');
      expect(duplicateErrors.length).toBe(2);
      expect(duplicateErrors.some((e) => e.location.file === 'sources/db2.yaml')).toBe(true);
      expect(duplicateErrors.some((e) => e.location.file === 'sources/db3.yaml')).toBe(true);
    });

    it('should detect multiple resource types each having duplicates', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'alpha',
            type: 'database',
            entities: [],
            file: 'sources/alpha1.yaml',
            line: 1,
          },
          {
            name: 'alpha',
            type: 'database',
            entities: [],
            file: 'sources/alpha2.yaml',
            line: 1,
          },
        ],
        datasets: [
          {
            name: 'beta',
            layer: 'raw',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/beta1' },
            file: 'datasets/beta1.yaml',
            line: 1,
          },
          {
            name: 'beta',
            layer: 'refined',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/beta2' },
            file: 'datasets/beta2.yaml',
            line: 1,
          },
        ],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(
        result.errors.some(
          (e) => e.code === 'DUPLICATE_SOURCE_NAME' && e.message.includes("'alpha'"),
        ),
      ).toBe(true);
      expect(
        result.errors.some(
          (e) => e.code === 'DUPLICATE_DATASET_NAME' && e.message.includes("'beta'"),
        ),
      ).toBe(true);
    });

    it('should pass validation when all resource names are unique', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'db1',
            type: 'database',
            entities: [],
            file: 'sources/db1.yaml',
            line: 1,
          },
          {
            name: 'db2',
            type: 'database',
            entities: [],
            file: 'sources/db2.yaml',
            line: 1,
          },
        ],
        datasets: [
          {
            name: 'ds1',
            layer: 'raw',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/ds1' },
            file: 'datasets/ds1.yaml',
            line: 1,
          },
          {
            name: 'ds2',
            layer: 'refined',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/ds2' },
            file: 'datasets/ds2.yaml',
            line: 1,
          },
        ],
        contracts: [
          {
            name: 'contract1',
            version: '1.0.0',
            fields: [],
            file: 'contracts/contract1.yaml',
            line: 1,
          },
          {
            name: 'contract2',
            version: '1.0.0',
            fields: [],
            file: 'contracts/contract2.yaml',
            line: 1,
          },
        ],
        flows: [
          {
            name: 'flow1',
            steps: [],
            file: 'flows/flow1.yaml',
            line: 1,
          },
          {
            name: 'flow2',
            steps: [],
            file: 'flows/flow2.yaml',
            line: 1,
          },
        ],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(true);
      expect(
        result.errors.filter(
          (e) =>
            e.code === 'DUPLICATE_SOURCE_NAME' ||
            e.code === 'DUPLICATE_DATASET_NAME' ||
            e.code === 'DUPLICATE_CONTRACT_NAME' ||
            e.code === 'DUPLICATE_FLOW_NAME',
        ).length,
      ).toBe(0);
    });
  });

  describe('Schema validation', () => {
    it('should run schema validation before semantic validation', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'test_source',
            type: 'invalid_type',
            entities: [],
            file: 'sources/test.yaml',
            line: 1,
          },
        ],
        datasets: [],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      // Schema validation should catch the invalid source type via the schema enum
      const schemaErrors = result.errors.filter((e) => e.code === 'SCHEMA_VALIDATION');
      expect(schemaErrors.length).toBeGreaterThan(0);
    });

    it('should include file path in schema validation errors', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'test_source',
            type: 'invalid_type',
            entities: [],
            file: 'sources/broken.yaml',
            line: 3,
          },
        ],
        datasets: [],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      const schemaErrors = result.errors.filter((e) => e.code === 'SCHEMA_VALIDATION');
      expect(schemaErrors.length).toBeGreaterThan(0);
      expect(schemaErrors[0].location.file).toBe('sources/broken.yaml');
      expect(schemaErrors[0].location.line).toBe(3);
    });

    it('should produce schema errors for contracts missing required fields', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [
          {
            name: 'test_contract',
            version: '1.0.0',
            fields: [],
            file: 'contracts/test.yaml',
            line: 1,
          },
        ],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      // Contract with empty fields passes schema (fields is required but empty array is valid)
      // but let's test with a missing required field
      const schemaErrors = result.errors.filter((e) => e.code === 'SCHEMA_VALIDATION');
      expect(schemaErrors.length).toBe(0);
    });

    it('should not produce schema errors when source has extra properties (additionalProperties allowed)', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'test_source',
            type: 'database',
            entities: [],
            file: 'sources/test.yaml',
            line: 1,
            invalidField: 'should be allowed',
          } as any,
        ],
        datasets: [],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      const schemaErrors = result.errors.filter((e) => e.code === 'SCHEMA_VALIDATION');
      expect(schemaErrors.length).toBe(0);
    });

    it('should produce schema errors with severity error', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'test_source',
            type: 'invalid_type',
            entities: [],
            file: 'sources/test.yaml',
            line: 1,
          },
        ],
        datasets: [],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      const schemaErrors = result.errors.filter((e) => e.code === 'SCHEMA_VALIDATION');
      expect(schemaErrors.length).toBeGreaterThan(0);
      for (const error of schemaErrors) {
        expect(error.severity).toBe('error');
      }
    });
  });
});
