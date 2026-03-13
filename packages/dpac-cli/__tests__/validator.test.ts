import { describe, it, expect } from 'bun:test';
import { validateWorkspace } from '../src/validation/validator';
import type { Workspace } from '../src/parsing/workspace';

describe('Validation Engine', () => {
  describe('Cross-resource references', () => {
    it('should detect unresolved source references', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [],
        flows: [{
          name: 'flow1',
          steps: [{
            type: 'extract',
            source: 'nonexistent_db',
            entity: 'users',
            output: 'raw_users',
          }],
          file: 'flows/flow1.yaml',
          line: 1,
        }],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.code === 'UNRESOLVED_SOURCE')).toBe(true);
    });

    it('should detect unresolved dataset references', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [],
        flows: [{
          name: 'flow1',
          steps: [{
            type: 'transform',
            inputs: ['nonexistent_dataset'],
            output: 'output',
            engine: 'dbt',
          }],
          file: 'flows/flow1.yaml',
          line: 1,
        }],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.code === 'UNRESOLVED_DATASET')).toBe(true);
    });

    it('should detect unresolved contract references', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [{
          name: 'users',
          layer: 'raw',
          storage: { backend: 's3', format: 'parquet', location: 's3://bucket/users' },
          contract: { name: 'nonexistent_contract', version: '1.0.0' },
          file: 'datasets/users.yaml',
          line: 1,
        }],
        contracts: [],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.code === 'UNRESOLVED_CONTRACT')).toBe(true);
    });

    it('should pass when all references resolve', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [{
          name: 'db1',
          type: 'database',
          entities: [],
          file: 'sources/db.yaml',
          line: 1,
        }],
        datasets: [{
          name: 'users_raw',
          layer: 'raw',
          storage: { backend: 's3', format: 'parquet', location: 's3://bucket/users' },
          file: 'datasets/users.yaml',
          line: 1,
        }],
        contracts: [],
        flows: [{
          name: 'flow1',
          steps: [{
            type: 'extract',
            source: 'db1',
            entity: 'users',
            output: 'users_raw',
          }],
          file: 'flows/flow1.yaml',
          line: 1,
        }],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(true);
    });
  });

  describe('Contract consistency', () => {
    it('should detect invalid field types', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [{
          name: 'test_contract',
          version: '1.0.0',
          fields: [{
            name: 'field1',
            type: 'invalid_type',
          }],
          file: 'contracts/test.yaml',
          line: 1,
        }],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_FIELD_TYPE')).toBe(true);
    });

    it('should detect invalid semantic versions', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [],
        contracts: [{
          name: 'test_contract',
          version: '1.5',  // Invalid: should be X.Y.Z
          fields: [],
          file: 'contracts/test.yaml',
          line: 1,
        }],
        flows: [],
      };

      const result = validateWorkspace(workspace);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_VERSION')).toBe(true);
    });
  });

  describe('Orphaned resources', () => {
    it('should warn about orphaned datasets when flows exist', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [{
          name: 'db1',
          type: 'database',
          entities: [],
          file: 'sources/db.yaml',
          line: 1,
        }],
        datasets: [
          {
            name: 'consumed',
            layer: 'raw',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/consumed' },
            file: 'datasets/consumed.yaml',
            line: 1,
          },
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
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/users' },
            file: 'datasets/orphaned.yaml',
            line: 1,
          },
        ],
        contracts: [],
        flows: [{
          name: 'flow1',
          steps: [
            {
              type: 'transform',
              inputs: ['consumed'],  // This consumes the 'consumed' dataset
              output: 'intermediate',
              engine: 'dbt',
            },
            {
              type: 'load',
              input: 'produced',  // This produces the 'produced' dataset
              target: 'data_lake',
            },
          ],
          file: 'flows/flow1.yaml',
          line: 1,
        }],
      };

      const result = validateWorkspace(workspace);
      
      // Debug: log all warnings
      console.log('Warnings:', result.warnings.map(w => w.message));
      
      // 'orphaned' is not used at all - should be flagged
      expect(result.warnings.some(w => w.code === 'ORPHANED_DATASET' && w.message.includes('orphaned'))).toBe(true);
      // 'consumed' is consumed by the transform step - should NOT be flagged
      expect(result.warnings.some(w => w.code === 'ORPHANED_DATASET' && w.message.includes('consumed'))).toBe(false);
      // 'produced' is produced by the load step - should NOT be flagged
      expect(result.warnings.some(w => w.code === 'ORPHANED_DATASET' && w.message.includes('produced'))).toBe(false);
    });
  });
});
