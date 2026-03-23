import {
  setSchemaValidator,
  type ValidationResult,
  platformSchema,
  sourceSchema,
  contractSchema,
  datasetSchema,
  flowSchema,
} from '@dataspec/dataspec-core';
import Ajv, { type ErrorObject } from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

const validators = {
  platform: ajv.compile(platformSchema),
  source: ajv.compile(sourceSchema),
  contract: ajv.compile(contractSchema),
  dataset: ajv.compile(datasetSchema),
  flow: ajv.compile(flowSchema),
};

type ResourceType = keyof typeof validators;

function validateAgainstSchemaImpl(data: unknown, type: string): ValidationResult {
  const validate = validators[type as ResourceType];
  const valid = validate(data);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = (validate.errors as ErrorObject[]).map((e) => `${e.instancePath}: ${e.message}`);

  return { valid: false, errors };
}

setSchemaValidator(validateAgainstSchemaImpl);

export { validateAgainstSchemaImpl as validateAgainstSchema };
export type { ValidationResult };
