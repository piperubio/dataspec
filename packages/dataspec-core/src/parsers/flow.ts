import { parse } from 'yaml';

import type { Flow, FlowStep, ExtractStep, TransformStep, LoadStep } from '../types/flow';
import { validateAgainstSchema } from '../validation/schema-validator';

/**
 * Parses a YAML content string into a typed Flow object.
 *
 * @param yamlContent - The YAML string to parse
 * @returns A typed Flow object
 * @throws Error if YAML parsing fails or required fields are missing
 *
 * @example
 * ```typescript
 * const yaml = `
 * name: user_ingestion_pipeline
 * steps:
 *   - type: extract
 *     source: production_db.users
 *     entity: users
 *     output: raw_users
 *   - type: transform
 *     inputs: [raw_users]
 *     engine: user_cleaning
 *     output: cleaned_users
 *   - type: load
 *     input: cleaned_users
 *     target: warehouse.dim_users
 * metadata:
 *   description: Daily user data ingestion
 * `;
 * const flow = parseFlowYaml(yaml);
 * ```
 */
export function parseFlowYaml(yamlContent: string): Flow {
  // Parse the YAML content
  const parsed = parse(yamlContent);

  // Validate basic structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid YAML: expected an object');
  }

  // Validate against JSON Schema
  const schemaResult = validateAgainstSchema(parsed, 'flow');
  if (!schemaResult.valid) {
    throw new Error(`Schema validation failed:\n${schemaResult.errors.join('\n')}`);
  }

  // Extract fields
  const { name, steps, metadata } = parsed as Record<string, unknown>;

  // Parse steps
  const parsedSteps: FlowStep[] = [];
  for (const step of steps as unknown[]) {
    const stepObj = step as Record<string, unknown>;

    switch (stepObj.type) {
      case 'extract': {
        const extractStep: ExtractStep = {
          type: 'extract',
          source: stepObj.source as string,
          entity: stepObj.entity as string,
          output: stepObj.output as string,
        };
        parsedSteps.push(extractStep);
        break;
      }

      case 'transform': {
        const transformStep: TransformStep = {
          type: 'transform',
          inputs: stepObj.inputs as string[],
          engine: stepObj.engine as string,
          output: stepObj.output as string,
        };
        parsedSteps.push(transformStep);
        break;
      }

      case 'load': {
        const loadStep: LoadStep = {
          type: 'load',
          input: stepObj.input as string,
          target: stepObj.target as string,
        };
        parsedSteps.push(loadStep);
        break;
      }

      default:
        throw new Error(
          `Invalid FlowStep type: "${stepObj.type}". Must be one of: extract, transform, load`,
        );
    }
  }

  // Construct and return the Flow object
  const flow: Flow = {
    name: name as string,
    steps: parsedSteps,
  };

  // Add metadata if present
  if (metadata && typeof metadata === 'object') {
    flow.metadata = {
      description: (metadata as Record<string, unknown>).description as string | undefined,
      labels: (metadata as Record<string, unknown>).labels as string[] | undefined,
      definedAt: (metadata as Record<string, unknown>).definedAt as string | undefined,
      version: (metadata as Record<string, unknown>).version as string | undefined,
    };
  }

  return flow;
}
