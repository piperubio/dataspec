import Ajv, { type ErrorObject } from 'ajv';

import contractSchema from '../schemas/contract.schema.json';
import flowSchema from '../schemas/flow.schema.json';
import sourceSchema from '../schemas/source.schema.json';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

const validators: Record<string, ReturnType<Ajv['compile']>> = {
  contract: ajv.compile(contractSchema),
  source: ajv.compile(sourceSchema),
  flow: ajv.compile(flowSchema),
};

type ValidateFunction = (data: unknown, type: string) => ValidationResult;

let _validate: ValidateFunction = (data: unknown, type: string): ValidationResult => {
  const validator = validators[type];
  if (!validator) {
    return { valid: true, errors: [] };
  }

  const valid = validator(data);
  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = (validator.errors ?? []).map((err: ErrorObject) => {
    const path = err.instancePath || '/';
    return `${path}: ${err.message}`;
  });

  return { valid: false, errors };
};

export function setSchemaValidator(fn: ValidateFunction): void {
  _validate = fn;
}

export function validateAgainstSchema(data: unknown, type: string): ValidationResult {
  return _validate(data, type);
}
