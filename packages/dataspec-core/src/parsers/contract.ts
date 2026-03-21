/**
 * Contract YAML parser for the dataspec-core package.
 * @module parsers/contract
 */

import YAML from 'yaml';

import type { Metadata } from '../types/common';
import type { Contract, ContractField, DataType, FieldConstraints } from '../types/contract';

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

  // Validate required fields
  if (!parsed.name || typeof parsed.name !== 'string') {
    throw new Error("Contract must have a 'name' field");
  }

  if (!parsed.version || typeof parsed.version !== 'string') {
    throw new Error("Contract must have a 'version' field");
  }

  if (!Array.isArray(parsed.fields)) {
    throw new Error("Contract must have a 'fields' array");
  }

  // Parse fields
  const fields: ContractField[] = parsed.fields.map((field: unknown, index: number) => {
    if (!field || typeof field !== 'object') {
      throw new Error(`Field at index ${index} must be an object`);
    }

    const fieldObj = field as Record<string, unknown>;

    if (!fieldObj.name || typeof fieldObj.name !== 'string') {
      throw new Error(`Field at index ${index} must have a 'name' field`);
    }

    if (!fieldObj.type || typeof fieldObj.type !== 'string') {
      throw new Error(`Field at index ${index} must have a 'type' field`);
    }

    // Validate that the type is a valid DataType
    const validTypes: DataType[] = [
      'uuid',
      'string',
      'integer',
      'decimal',
      'boolean',
      'timestamp',
      'date',
      'json',
    ];
    if (!validTypes.includes(fieldObj.type as DataType)) {
      throw new Error(
        `Field '${fieldObj.name}' has invalid type '${fieldObj.type}'. ` +
          `Valid types are: ${validTypes.join(', ')}`,
      );
    }

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
        if (typeof constraintsObj.ref !== 'string') {
          throw new Error(
            `Field '${fieldObj.name}' has invalid 'ref' constraint - must be a string`,
          );
        }
        constraints.ref = constraintsObj.ref;
      }
    }

    const contractField: ContractField = {
      name: fieldObj.name,
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
