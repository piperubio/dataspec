export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

type ValidateFunction = (data: unknown, type: string) => ValidationResult;

let _validate: ValidateFunction = () => ({ valid: true, errors: [] });

export function setSchemaValidator(fn: ValidateFunction): void {
  _validate = fn;
}

export function validateAgainstSchema(data: unknown, type: string): ValidationResult {
  return _validate(data, type);
}
