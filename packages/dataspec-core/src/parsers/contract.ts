/**
 * Contract YAML parser for the dataspec-core package.
 * @module parsers/contract
 */

import YAML from 'yaml';

import type { Metadata } from '../types/common';
import type { Contract, ContractField, DataType, FieldConstraints } from '../types/contract';
import { validateAgainstSchema } from '../validation/schema-validator';

/**
 * Parses a YAML string into a typed Contract object.
 *
 * @param yamlContent - The YAML content to parse
 * @returns A typed Contract object
 * @throws Error if YAML parsing fails or required fields are missing
 *
 * @example
 * ```typescript
 * const yaml = `
 *   name: Customer
 *   version: "1.0.0"
 *   fields:
 *     - name: id
 *       type: uuid
 *       constraints:
 *         unique: true
 *         not_null: true
 *     - name: email
 *       type: string
 *       constraints:
 *         unique: true
 *         not_null: true
 * `;
 * const contract = parseContractYaml(yaml);
 * ```
 */
export function parseContractYaml(yamlContent: string): Contract {
  const parsed = YAML.parse(yamlContent);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid YAML: expected an object');
  }

  // Validate against JSON Schema
  const schemaResult = validateAgainstSchema(parsed, 'contract');
  if (!schemaResult.valid) {
    throw new Error(`Schema validation failed:\n${schemaResult.errors.join('\n')}`);
  }

  // Parse fields
  const fields: ContractField[] = parsed.fields.map((field: unknown) => {
    const fieldObj = field as Record<string, unknown>;

    // Parse constraints if present
    let constraints: FieldConstraints | undefined;
    if (fieldObj.constraints && typeof fieldObj.constraints === 'object') {
      const constraintsObj = fieldObj.constraints as Record<string, unknown>;
      constraints = {};

      if (constraintsObj.unique !== undefined) {
        constraints.unique = Boolean(constraintsObj.unique);
      }
      if (constraintsObj.not_null !== undefined) {
        constraints.not_null = Boolean(constraintsObj.not_null);
      }
      if (constraintsObj.ref !== undefined) {
        constraints.ref = constraintsObj.ref as string;
      }
      if (constraintsObj.allowed_values !== undefined) {
        if (fieldObj.type !== 'string') {
          throw new Error(
            `Field '${fieldObj.name}' has 'allowed_values' constraint - only valid for string fields`,
          );
        }
        constraints.allowed_values = constraintsObj.allowed_values as string[];
      }
    }

    const contractField: ContractField = {
      name: fieldObj.name as string,
      type: fieldObj.type as DataType,
    };

    if (constraints && Object.keys(constraints).length > 0) {
      contractField.constraints = constraints;
    }

    if (fieldObj.description && typeof fieldObj.description === 'string') {
      contractField.description = fieldObj.description;
    }

    return contractField;
  });

  // Build the contract object
  const contract: Contract = {
    name: parsed.name,
    version: parsed.version,
    fields,
  };

  // Add optional metadata if present
  if (parsed.metadata && typeof parsed.metadata === 'object') {
    contract.metadata = parsed.metadata as Metadata;
  }

  // Add optional tags if present
  if (Array.isArray(parsed.tags)) {
    contract.tags = parsed.tags.filter((tag: unknown): tag is string => typeof tag === 'string');
  }

  return contract;
}
