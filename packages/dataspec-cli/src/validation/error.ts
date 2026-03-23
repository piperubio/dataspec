/**
 * Error codes for validation errors
 */
export const ErrorCodes = {
  DUPLICATE_SOURCE_NAME: 'DUPLICATE_SOURCE_NAME',
  DUPLICATE_DATASET_NAME: 'DUPLICATE_DATASET_NAME',
  DUPLICATE_CONTRACT_NAME: 'DUPLICATE_CONTRACT_NAME',
  DUPLICATE_FLOW_NAME: 'DUPLICATE_FLOW_NAME',
  INVALID_SOURCE_TYPE: 'INVALID_SOURCE_TYPE',
  MISSING_SOURCE_PROTOCOL: 'MISSING_SOURCE_PROTOCOL',
  MISSING_SOURCE_BASEURL: 'MISSING_SOURCE_BASEURL',
  MISSING_SOURCE_PROVIDER: 'MISSING_SOURCE_PROVIDER',
  INVALID_SOURCE_PROTOCOL: 'INVALID_SOURCE_PROTOCOL',
  FORBIDDEN_FIELD_ON_SOURCE: 'FORBIDDEN_FIELD_ON_SOURCE',
  MISSING_ENTITY_LOCATION: 'MISSING_ENTITY_LOCATION',
  MISSING_ENTITY_CONTRACT: 'MISSING_ENTITY_CONTRACT',
  MISSING_ENTITY_METHOD: 'MISSING_ENTITY_METHOD',
  MISSING_ENTITY_FORMAT: 'MISSING_ENTITY_FORMAT',
  INVALID_LOCATION_FORMAT: 'INVALID_LOCATION_FORMAT',
  INVALID_HTTP_METHOD: 'INVALID_HTTP_METHOD',
  INVALID_FORMAT_VALUE: 'INVALID_FORMAT_VALUE',
  FORBIDDEN_FIELD_ON_ENTITY: 'FORBIDDEN_FIELD_ON_ENTITY',
  DEPRECATED_FIELD: 'DEPRECATED_FIELD',
  UNRESOLVED_CONTRACT: 'UNRESOLVED_CONTRACT',
  UNRESOLVED_CONTRACT_VERSION: 'UNRESOLVED_CONTRACT_VERSION',
  SCHEMA_VALIDATION: 'SCHEMA_VALIDATION',
} as const;

/**
 * Severity level for validation messages
 */
export type ValidationSeverity = 'error' | 'warning';

/**
 * Source location of a validation issue
 */
export interface SourceLocation {
  /** File path where the issue occurred */
  file: string;
  /** Line number in the file (1-indexed) */
  line: number;
}

/**
 * A validation error or warning with location information
 */
export interface ValidationError {
  /** Human-readable error message */
  message: string;
  /** Severity level: 'error' or 'warning' */
  severity: ValidationSeverity;
  /** Source file and line location */
  location: SourceLocation;
  /** Optional error code for programmatic handling */
  code?: string;
}

/**
 * Result of workspace validation containing all errors and warnings
 */
export interface ValidationResult {
  /** Array of validation errors (severity = 'error') */
  errors: ValidationError[];
  /** Array of validation warnings (severity = 'warning') */
  warnings: ValidationError[];
  /** Whether validation passed (true if no errors) */
  passed: boolean;
}

/**
 * Creates a validation error or warning
 * @param message - Human-readable error message
 * @param location - Source file and line location
 * @param severity - Error or warning (default: 'error')
 * @param code - Optional error code for programmatic handling
 * @returns ValidationError object
 */
export function createError(
  message: string,
  location: SourceLocation,
  severity: ValidationSeverity = 'error',
  code?: string,
): ValidationError {
  return { message, location, severity, code };
}

/**
 * Formats a validation error as a string for CI/CD pipelines
 * Format: `<file>:<line>:<severity>: <message>`
 * @param error - The validation error to format
 * @returns Formatted string: `file:line:severity: message`
 */
export function formatValidationError(error: ValidationError): string {
  const { file, line } = error.location;
  return `${file}:${line}:${error.severity}: ${error.message}`;
}

/**
 * Creates a successful validation result with optional warnings
 * @param warnings - Optional array of warnings
 * @returns ValidationResult with passed = true
 */
export function createSuccessResult(warnings: ValidationError[] = []): ValidationResult {
  return {
    errors: [],
    warnings,
    passed: true,
  };
}

/**
 * Creates a failed validation result with errors and optional warnings
 * @param errors - Array of validation errors
 * @param warnings - Optional array of warnings
 * @returns ValidationResult with passed = false (if errors exist)
 */
export function createFailureResult(
  errors: ValidationError[] = [],
  warnings: ValidationError[] = [],
): ValidationResult {
  return {
    errors,
    warnings,
    passed: errors.length === 0,
  };
}
