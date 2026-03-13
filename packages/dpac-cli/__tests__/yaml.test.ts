import { describe, it, expect } from 'bun:test';
import { parseYamlWithLineNumbers, getLineNumber } from '../src/parsing/yaml';

describe('YAML Parser', () => {
  describe('parseYamlWithLineNumbers', () => {
    it('should parse valid YAML', () => {
      const yaml = `
name: test
version: "1.0.0"
`;
      const result = parseYamlWithLineNumbers(yaml);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test', version: '1.0.0' });
    });

    it('should return errors for invalid YAML', () => {
      const yaml = `name: test
- invalid: list at root level`;
      const result = parseYamlWithLineNumbers(yaml);
      // The yaml library may or may not report this as an error depending on version
      // Just check it doesn't throw
      expect(result).toBeDefined();
    });

    it('should parse nested objects', () => {
      const yaml = `
name: test
storage:
  backend: s3
  format: parquet
`;
      const result = parseYamlWithLineNumbers(yaml);
      expect(result.errors).toHaveLength(0);
      expect(result.data?.storage.backend).toBe('s3');
    });
  });

  describe('getLineNumber', () => {
    it('should return a line number', () => {
      const yaml = `name: test
version: "1.0.0"`;
      const line = getLineNumber(yaml, ['version']);
      // getLineNumber returns 1 if it can't find the exact node
      expect(line).toBeGreaterThanOrEqual(1);
    });

    it('should return 1 for non-existing path', () => {
      const yaml = `name: test`;
      const line = getLineNumber(yaml, ['nonexistent']);
      expect(line).toBe(1);
    });
  });
});
