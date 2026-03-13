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
export declare function createError(message: string, location: SourceLocation, severity?: ValidationSeverity, code?: string): ValidationError;
export declare function formatValidationError(error: ValidationError): string;
export declare function createSuccessResult(): ValidationResult;
export declare function createFailureResult(errors?: ValidationError[], warnings?: ValidationError[]): ValidationResult;
//# sourceMappingURL=error.d.ts.map