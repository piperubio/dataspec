import { describe, it, expect } from 'bun:test';

import { validateAgainstSchema } from '../schema-validator';

describe('validateAgainstSchema', () => {
  // 5.1: Valid data passes validation
  describe('valid data passes validation', () => {
    it('should return valid for a complete contract', () => {
      const data = {
        name: 'user_contract',
        version: '1.0.0',
        fields: [
          { name: 'user_id', type: 'uuid' },
          { name: 'email', type: 'string' },
        ],
      };

      const result = validateAgainstSchema(data, 'contract');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return valid for a complete source', () => {
      const data = {
        name: 'production_db',
        type: 'database',
        entities: [
          {
            name: 'users',
            contract: { name: 'users_schema', version: '1.0.0' },
          },
        ],
      };

      const result = validateAgainstSchema(data, 'source');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return valid for a complete platform', () => {
      const data = {
        storage: [{ name: 's3', type: 's3', connection: 's3://bucket' }],
        engines: [{ name: 'spark', type: 'spark' }],
      };

      const result = validateAgainstSchema(data, 'platform');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return valid for a complete dataset', () => {
      const data = {
        name: 'my_dataset',
        storage: {
          backend: 's3',
          format: 'parquet',
          location: 's3://bucket/path',
        },
      };

      const result = validateAgainstSchema(data, 'dataset');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return valid for a complete flow', () => {
      const data = {
        name: 'etl_pipeline',
        steps: [
          {
            type: 'extract',
            source: 'db.users',
            entity: 'users',
            output: 'raw_users',
          },
        ],
      };

      const result = validateAgainstSchema(data, 'flow');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  // 5.2: Invalid data returns descriptive errors with JSON paths
  describe('invalid data returns errors with JSON paths', () => {
    it('should report missing required name field in contract', () => {
      const data = {
        version: '1.0.0',
        fields: [],
      };

      const result = validateAgainstSchema(data, 'contract');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('should report missing required version field in contract', () => {
      const data = {
        name: 'test_contract',
        fields: [],
      };

      const result = validateAgainstSchema(data, 'contract');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('version'))).toBe(true);
    });

    it('should report missing required fields array in contract', () => {
      const data = {
        name: 'test_contract',
        version: '1.0.0',
      };

      const result = validateAgainstSchema(data, 'contract');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('fields'))).toBe(true);
    });

    it('should report invalid field type in contract', () => {
      const data = {
        name: 'test_contract',
        version: '1.0.0',
        fields: [{ name: 'bad_field', type: 'invalid_type' }],
      };

      const result = validateAgainstSchema(data, 'contract');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('type'))).toBe(true);
    });

    it('should report error with instancePath for nested fields', () => {
      const data = {
        name: 'test_contract',
        version: '1.0.0',
        fields: [{ type: 'string' }],
      };

      const result = validateAgainstSchema(data, 'contract');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.startsWith('/fields/0'))).toBe(true);
    });

    it('should report missing entities in source', () => {
      const data = {
        name: 'test_source',
        type: 'database',
      };

      const result = validateAgainstSchema(data, 'source');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('entities'))).toBe(true);
    });
  });

  // 5.3: Tests for all 5 resource types
  describe('all 5 resource types', () => {
    // Platform
    describe('platform', () => {
      it('should validate a valid platform', () => {
        const data = {
          storage: [{ name: 'pg', type: 'postgresql', connection: 'localhost:5432' }],
          engines: [{ name: 'dbt', type: 'dbt', version: '>=1.0.0' }],
        };

        const result = validateAgainstSchema(data, 'platform');
        expect(result.valid).toBe(true);
      });

      it('should accept platform missing storage', () => {
        const data = {
          engines: [{ name: 'dbt', type: 'dbt' }],
        };

        const result = validateAgainstSchema(data, 'platform');
        expect(result.valid).toBe(true);
      });

      it('should accept platform missing engines', () => {
        const data = {
          storage: [{ name: 'pg', type: 'postgresql', connection: 'localhost' }],
        };

        const result = validateAgainstSchema(data, 'platform');
        expect(result.valid).toBe(true);
      });
    });

    // Source
    describe('source', () => {
      it('should validate a valid source', () => {
        const data = {
          name: 'my_source',
          type: 'api',
          entities: [{ name: 'users', contract: { name: 'users', version: '1.0.0' } }],
        };

        const result = validateAgainstSchema(data, 'source');
        expect(result.valid).toBe(true);
      });

      it('should reject source with invalid type', () => {
        const data = {
          name: 'my_source',
          type: 'kafka',
          entities: [],
        };

        const result = validateAgainstSchema(data, 'source');
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('type'))).toBe(true);
      });
    });

    // Contract
    describe('contract', () => {
      it('should validate a valid contract', () => {
        const data = {
          name: 'test',
          version: '1.0.0',
          fields: [{ name: 'id', type: 'uuid' }],
        };

        const result = validateAgainstSchema(data, 'contract');
        expect(result.valid).toBe(true);
      });

      it('should reject contract with invalid field type', () => {
        const data = {
          name: 'test',
          version: '1.0.0',
          fields: [{ name: 'id', type: 'bigint' }],
        };

        const result = validateAgainstSchema(data, 'contract');
        expect(result.valid).toBe(false);
      });
    });

    // Dataset
    describe('dataset', () => {
      it('should validate a valid dataset', () => {
        const data = {
          name: 'my_dataset',
          storage: {
            backend: 's3',
            format: 'parquet',
            location: 's3://bucket/data',
          },
        };

        const result = validateAgainstSchema(data, 'dataset');
        expect(result.valid).toBe(true);
      });

      it('should reject dataset missing storage', () => {
        const data = {
          name: 'my_dataset',
        };

        const result = validateAgainstSchema(data, 'dataset');
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('storage'))).toBe(true);
      });
    });

    // Flow
    describe('flow', () => {
      it('should validate a valid flow', () => {
        const data = {
          name: 'pipeline',
          steps: [
            {
              type: 'extract',
              source: 'db.users',
              entity: 'users',
              output: 'raw',
            },
            {
              type: 'transform',
              engine: 'spark',
              inputs: ['raw'],
              output: 'clean',
            },
            {
              type: 'load',
              input: 'clean',
              target: 'warehouse.users',
            },
          ],
        };

        const result = validateAgainstSchema(data, 'flow');
        expect(result.valid).toBe(true);
      });

      it('should reject flow missing required steps', () => {
        const data = {
          name: 'pipeline',
        };

        const result = validateAgainstSchema(data, 'flow');
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('steps'))).toBe(true);
      });

      it('should reject flow with invalid step type', () => {
        const data = {
          name: 'pipeline',
          steps: [{ type: 'invalid', output: 'x' }],
        };

        const result = validateAgainstSchema(data, 'flow');
        expect(result.valid).toBe(false);
      });
    });
  });

  // 5.4: Multiple errors collected (allErrors: true)
  describe('multiple errors collected', () => {
    it('should report all missing required fields in contract', () => {
      const data = {};

      const result = validateAgainstSchema(data, 'contract');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);

      const errorText = result.errors.join(' ');
      expect(errorText).toContain('name');
      expect(errorText).toContain('version');
      expect(errorText).toContain('fields');
    });

    it('should report all missing required fields in source', () => {
      const data = {};

      const result = validateAgainstSchema(data, 'source');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);

      const errorText = result.errors.join(' ');
      expect(errorText).toContain('name');
      expect(errorText).toContain('type');
      expect(errorText).toContain('entities');
    });

    it('should report errors for multiple invalid fields in contract', () => {
      const data = {
        name: 'test',
        version: '1.0.0',
        fields: [{ type: 'string' }, { name: 'no_type' }],
      };

      const result = validateAgainstSchema(data, 'contract');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors.some((e) => e.includes('/fields/0'))).toBe(true);
      expect(result.errors.some((e) => e.includes('/fields/1'))).toBe(true);
    });

    it('should accept empty platform without required fields', () => {
      const data = {};

      const result = validateAgainstSchema(data, 'platform');
      expect(result.valid).toBe(true);
    });

    it('should report all errors in a flow with multiple bad steps', () => {
      const data = {
        name: 'pipeline',
        steps: [{ type: 'extract' }, { type: 'load' }],
      };

      const result = validateAgainstSchema(data, 'flow');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
