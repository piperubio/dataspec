/**
 * Common base types used throughout the dataspec-core domain model.
 * @module types/common
 */

export type {
  Timestamp,
  Metadata,
  Tags,
  WithMetadata,
} from './common';

export type {
  StorageType,
  StorageBackend,
  EngineType,
  AnalyticsEngine,
  PlatformConfig,
} from './platform';

export type {
  DataType,
  FieldConstraints,
  ContractField,
  Contract,
} from './contract';

export type {
  DatasetLayer,
  ContractReference,
  StorageConfig,
  Dataset,
  DatasetYamlSchema,
} from './dataset';

export type {
  SourceType,
  SourceEntity,
  Source,
} from './source';

export type {
  StepType,
  FlowMetadata,
  ExtractStep,
  TransformStep,
  LoadStep,
  FlowStep,
  Flow,
} from './flow';
