/**
 * Flow types for data pipeline definitions.
 * @module types/flow
 */

/**
 * Step type for data pipeline flows.
 * Represents the operation performed in a pipeline step.
 */
export const StepType = {
  /** Extract data from source */
  EXTRACT: 'extract',
  /** Transform data */
  TRANSFORM: 'transform',
  /** Load data to destination */
  LOAD: 'load',
} as const;

/**
 * Step type values.
 */
export type StepType = typeof StepType[keyof typeof StepType];

/**
 * Metadata for a Flow resource.
 */
export interface FlowMetadata {
  /** Human-readable description of the flow */
  description?: string;
  /** Labels for categorization and filtering */
  labels?: string[];
  /** Location where the flow was defined */
  definedAt?: string;
  /** Version of the flow */
  version?: string;
}

/**
 * Extract step - reads data from a source.
 * This is the first step in an ETL pipeline.
 */
export interface ExtractStep {
  /** Discriminant type */
  type: 'extract';
  /** Reference to the source resource (e.g., 'my_database.users') */
  source: string;
  /** Entity name within the source */
  entity: string;
  /** Output variable name to reference this data in subsequent steps */
  output: string;
}

/**
 * Transform step - applies transformations to data.
 * This is the middle step in an ETL pipeline.
 */
export interface TransformStep {
  /** Discriminant type */
  type: 'transform';
  /** Input variable names from previous steps */
  inputs: string[];
  /** Reference to the transformation engine by name */
  engine: string;
  /** Output variable name to reference transformed data in subsequent steps */
  output: string;
}

/**
 * Load step - writes data to the serving layer.
 * This is the final step in an ETL pipeline.
 */
export interface LoadStep {
  /** Discriminant type */
  type: 'load';
  /** Input variable name from a previous step */
  input: string;
  /** Reference to the target dataset (e.g., 'warehouse.customers') */
  target: string;
}

/**
 * Union type for all flow step types.
 * Uses discriminated union pattern with 'type' property.
 */
export type FlowStep = ExtractStep | TransformStep | LoadStep;

/**
 * Flow resource - defines a data pipeline with ordered steps.
 * Flows orchestrate the movement and transformation of data
 * from sources through transformations to serving layer datasets.
 */
export interface Flow {
  /** Unique name for the flow */
  name: string;
  /** Ordered list of pipeline steps (extract → transform → load) */
  steps: FlowStep[];
  /** Optional metadata for the flow */
  metadata?: FlowMetadata;
}
