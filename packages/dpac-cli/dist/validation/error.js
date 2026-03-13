export function createError(message, location, severity = 'error', code) {
    return { message, location, severity, code };
}
export function formatValidationError(error) {
    const { file, line } = error.location;
    return `${file}:${line}:${error.severity}: ${error.message}`;
}
export function createSuccessResult() {
    return {
        errors: [],
        warnings: [],
        passed: true,
    };
}
export function createFailureResult(errors = [], warnings = []) {
    return {
        errors,
        warnings,
        passed: errors.length === 0,
    };
}
//# sourceMappingURL=error.js.map