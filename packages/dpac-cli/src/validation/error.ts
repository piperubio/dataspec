export type ValidationSeverity = 'error' | 'warning';

export interface SourceLocation {
  file: string;
  line: number;
}

export interface ValidationError {
  message: string;
  severity: ValidationSeverity;
  location: SourceLocation;
  code?: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  passed: boolean;
}

export function createError(
  message: string,
  location: SourceLocation,
  severity: ValidationSeverity = 'error',
  code?: string
): ValidationError {
  return { message, location, severity, code };
}

export function formatValidationError(error: ValidationError): string {
  const { file, line } = error.location;
  return `${file}:${line}:${error.severity}: ${error.message}`;
}

export function createSuccessResult(warnings: ValidationError[] = []): ValidationResult {
  return {
    errors: [],
    warnings,
    passed: true,
  };
}

export function createFailureResult(
  errors: ValidationError[] = [],
  warnings: ValidationError[] = []
): ValidationResult {
  return {
    errors,
    warnings,
    passed: errors.length === 0,
  };
}
