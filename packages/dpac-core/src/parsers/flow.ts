import { parse } from 'yaml';
import type { Flow, FlowStep, ExtractStep, TransformStep, LoadStep } from '../types/flow';

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

  // Extract and validate required fields
  const { name, steps, metadata } = parsed as Record<string, unknown>;

  if (!name || typeof name !== 'string') {
    throw new Error('Invalid Flow: "name" is required and must be a string');
  }

  // Parse steps
  const parsedSteps: FlowStep[] = [];
  if (steps) {
    if (!Array.isArray(steps)) {
      throw new Error('Invalid Flow: "steps" must be an array');
    }

    for (const step of steps) {
      if (!step || typeof step !== 'object') {
        throw new Error('Invalid FlowStep: each step must be an object');
      }

      const stepObj = step as Record<string, unknown>;

      if (!stepObj.type || typeof stepObj.type !== 'string') {
        throw new Error('Invalid FlowStep: "type" is required and must be a string');
      }

      switch (stepObj.type) {
        case 'extract': {
          if (!stepObj.source || typeof stepObj.source !== 'string') {
            throw new Error('Invalid ExtractStep: "source" is required and must be a string');
          }
          if (!stepObj.entity || typeof stepObj.entity !== 'string') {
            throw new Error('Invalid ExtractStep: "entity" is required and must be a string');
          }
          if (!stepObj.output || typeof stepObj.output !== 'string') {
            throw new Error('Invalid ExtractStep: "output" is required and must be a string');
          }

          const extractStep: ExtractStep = {
            type: 'extract',
            source: stepObj.source,
            entity: stepObj.entity,
            output: stepObj.output,
          };
          parsedSteps.push(extractStep);
          break;
        }

        case 'transform': {
          if (!stepObj.inputs || !Array.isArray(stepObj.inputs)) {
            throw new Error('Invalid TransformStep: "inputs" is required and must be an array');
          }
          if (!stepObj.inputs.every((input) => typeof input === 'string')) {
            throw new Error('Invalid TransformStep: all "inputs" must be strings');
          }
          if (!stepObj.engine || typeof stepObj.engine !== 'string') {
            throw new Error('Invalid TransformStep: "engine" is required and must be a string');
          }
          if (!stepObj.output || typeof stepObj.output !== 'string') {
            throw new Error('Invalid TransformStep: "output" is required and must be a string');
          }

          const transformStep: TransformStep = {
            type: 'transform',
            inputs: stepObj.inputs as string[],
            engine: stepObj.engine,
            output: stepObj.output,
          };
          parsedSteps.push(transformStep);
          break;
        }

        case 'load': {
          if (!stepObj.input || typeof stepObj.input !== 'string') {
            throw new Error('Invalid LoadStep: "input" is required and must be a string');
          }
          if (!stepObj.target || typeof stepObj.target !== 'string') {
            throw new Error('Invalid LoadStep: "target" is required and must be a string');
          }

          const loadStep: LoadStep = {
            type: 'load',
            input: stepObj.input,
            target: stepObj.target,
          };
          parsedSteps.push(loadStep);
          break;
        }

        default:
          throw new Error(
            `Invalid FlowStep type: "${stepObj.type}". Must be one of: extract, transform, load`
          );
      }
    }
  }

  // Construct and return the Flow object
  const flow: Flow = {
    name,
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
