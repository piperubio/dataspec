import YAML from 'yaml';

export interface YamlNode {
  value: unknown;
  lineNumber: number;
  columnNumber: number;
}

export interface ParseResult<T> {
  data: T;
  errors: string[];
}

export function parseYamlWithLineNumbers<T>(content: string): ParseResult<T> {
  const errors: string[] = [];
  
  try {
    const doc = YAML.parseDocument(content);
    
    if (doc.errors.length > 0) {
      for (const err of doc.errors) {
        errors.push(`YAML parse error at line ${err.linePos?.[0]?.line}: ${err.message}`);
      }
    }
    
    const data = doc.toJS() as T;
    return { data, errors };
  } catch (e) {
    const error = e as Error;
    errors.push(`Parse error: ${error.message}`);
    return { data: null as T, errors };
  }
}

export function getLineNumber(content: string, path: string[]): number {
  const doc = YAML.parseDocument(content);
  const node = doc.getIn(path);
  
  if (node && typeof node === 'object' && 'range' in node && node.range && typeof node.range === 'object' && 'start' in node.range) {
    const lines = content.substring(0, (node.range as { start: number }).start).split('\n');
    return lines.length;
  }
  
  return 1;
}
