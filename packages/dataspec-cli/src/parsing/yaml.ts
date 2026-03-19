import YAML from 'yaml';
import type { ValidationError } from '../validation/error.js';

export interface YamlNode {
  value: unknown;
  lineNumber: number;
  columnNumber: number;
}

export interface ParseResult<T> {
  data: T;
  errors: ValidationError[];
}

export interface ParseOptions {
  file?: string;
}

export function parseYamlWithLineNumbers<T>(content: string, options: ParseOptions = {}): ParseResult<T> {
  const errors: ValidationError[] = [];
  const file = options.file || '<unknown>';
  
  try {
    const doc = YAML.parseDocument(content);
    
    if (doc.errors.length > 0) {
      for (const err of doc.errors) {
        const line = err.linePos?.[0]?.line || 1;
        errors.push({
          message: `YAML parse error: ${err.message}`,
          severity: 'error',
          location: { file, line },
          code: 'YAML_PARSE_ERROR'
        });
      }
    }
    
    const data = doc.toJS() as T;
    return { data, errors };
  } catch (e) {
    const error = e as Error;
    // Try to extract line number from error message
    const lineMatch = error.message.match(/line\s+(\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;
    
    errors.push({
      message: `Parse error: ${error.message}`,
      severity: 'error',
      location: { file, line },
      code: 'YAML_PARSE_ERROR'
    });
    return { data: null as T, errors };
  }
}

export function getLineNumber(content: string, path: string[]): number {
  try {
    const doc = YAML.parseDocument(content);
    const node = doc.getIn(path);
    
    if (node && typeof node === 'object' && 'range' in node && node.range && typeof node.range === 'object' && 'start' in node.range) {
      const lines = content.substring(0, (node.range as { start: number }).start).split('\n');
      return lines.length;
    }
  } catch {
    // If parsing fails, return line 1
  }
  
  return 1;
}

/**
 * Validates if a string is valid YAML syntax
 * @param content - YAML content to validate
 * @param file - Optional file path for error reporting
 * @returns Array of validation errors, empty if valid
 */
export function validateYamlSyntax(content: string, file?: string): ValidationError[] {
  const result = parseYamlWithLineNumbers<unknown>(content, { file });
  return result.errors;
}
