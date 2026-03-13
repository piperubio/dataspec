## 1. Project Setup

- [x] 1.1 Initialize dpac-core package with package.json, TypeScript config, and directory structure
- [x] 1.2 Install dependencies: `yaml` (eemeli) for YAML parsing
- [x] 1.3 Set up test framework (Bun test) and test directory structure
- [x] 1.4 Create project directory layout: `src/types/`, `src/parsers/`, `src/schemas/`, `examples/`

## 2. Core Domain Model Types

- [x] 2.1 Define base types: `Metadata`, `Tags`, `Timestamp` shared across all resources
- [x] 2.2 Define storage backend types: `StorageBackend`, `StorageType` (s3, postgresql, clickhouse)
- [x] 2.3 Define analytics engine types: `AnalyticsEngine`, `EngineType` (spark, duckdb, dbt, python)
- [x] 2.4 Define data type enums: `DataType` (uuid, string, integer, decimal, boolean, timestamp, date, json)
- [x] 2.5 Define constraint types: `FieldConstraint` (unique, not_null, ref)
- [x] 2.6 Define layer enum: `DatasetLayer` (raw, refined, serving)
- [x] 2.7 Define source type enum: `SourceType` (database, api, file_system, saas)
- [x] 2.8 Define step type enum: `StepType` (extract, transform, load)

## 3. Platform Definition Resource

- [x] 3.1 Create `PlatformConfig` type with storage backends, engines, and defaults
- [x] 3.2 Implement `parsePlatformYaml(yamlContent: string): PlatformConfig` parser function
- [x] 3.3 Add validation for unique backend names in platform configuration
- [x] 3.4 Add validation for unique engine names in platform configuration
- [x] 3.5 Write unit tests for platform parsing and validation

## 4. Source Management Resource

- [x] 4.1 Create `Source` type with name, type, entities, and metadata (no connection details)
- [x] 4.2 Create `SourceEntity` type for tables, collections, endpoints, file patterns
- [x] 4.3 Implement `parseSourceYaml(yamlContent: string): Source` parser function
- [x] 4.4 Add validation for source type values against allowed set
- [x] 4.5 Write unit tests for source parsing with database, API, file_system, and saas types

## 5. Data Contracts Resource

- [x] 5.1 Create `Contract` type with name, version, fields, and metadata
- [x] 5.2 Create `ContractField` type with name, type, constraints, and description
- [x] 5.3 Implement `parseContractYaml(yamlContent: string): Contract` parser function
- [x] 5.4 Add validation for required version field (semantic versioning)
- [x] 5.5 Add validation for unique field names within a contract
- [x] 5.6 Add validation for data type values against allowed set
- [x] 5.7 Write unit tests for contract parsing with various field types and constraints

## 6. Dataset Definition Resource

- [x] 6.1 Create `Dataset` type with name, layer, storage, contract reference, and metadata
- [x] 6.2 Create `StorageConfig` type with backend reference, format, and location
- [x] 6.3 Create `ContractReference` type with name and version
- [x] 6.4 Implement `parseDatasetYaml(yamlContent: string): Dataset` parser function
- [x] 6.5 Add validation for layer values (raw, refined, serving)
- [x] 6.6 Write unit tests for dataset parsing with different layers and storage configs

## 7. Flow Definition Resource

- [x] 7.1 Create `Flow` type with name, steps, and metadata
- [x] 7.2 Create `FlowStep` union type: `ExtractStep`, `TransformStep`, `LoadStep`
- [x] 7.3 Create `ExtractStep` type with source reference and entity
- [x] 7.4 Create `TransformStep` type with inputs, engine, and output
- [x] 7.5 Create `LoadStep` type with input and target dataset references
- [x] 7.6 Implement `parseFlowYaml(yamlContent: string): Flow` parser function
- [x] 7.7 Add validation for step type values against allowed set
- [x] 7.8 Write unit tests for flow parsing with extract, transform, and load steps

## 8. JSON Schema Generation

- [x] 8.1 Generate JSON Schema for `platform.yaml` validation
- [x] 8.2 Generate JSON Schema for source YAML files
- [x] 8.3 Generate JSON Schema for contract YAML files
- [x] 8.4 Generate JSON Schema for dataset YAML files
- [x] 8.5 Generate JSON Schema for flow YAML files
- [x] 8.6 Export all schemas from package entry point for editor integration

## 9. Example Platform Specifications

- [x] 9.1 Create example `platform.yaml` with storage backends (S3, PostgreSQL) and engines (dbt, DuckDB)
- [x] 9.2 Create example source definitions: PostgreSQL database with entity mappings
- [x] 9.3 Create example contract definition: users schema with multiple field types and constraints
- [x] 9.4 Create example dataset definitions: raw, refined, and serving layer datasets
- [x] 9.5 Create example flow definition: ETL pipeline with extract, transform, and load steps
- [x] 9.6 Create complete example platform directory structure under `examples/ecommerce-platform/`

## 10. Integration and Export

- [x] 10.1 Create main entry point (`src/index.ts`) exporting all types and parsers
- [x] 10.2 Create type barrel files for clean imports (`src/types/index.ts`, etc.)
- [x] 10.3 Write integration tests parsing complete platform specifications
- [x] 10.4 Verify all example files parse without errors
- [x] 10.5 Build package and verify TypeScript compilation

## 11. Documentation

- [x] 11.1 Write README.md with installation, usage, and example code
- [x] 11.2 Document each resource type with YAML examples
- [x] 11.3 Document the layered dataset architecture (raw → refined → serving)
- [x] 11.4 Document contract-first approach and versioning strategy
- [x] 11.5 Add inline JSDoc comments for all public types and functions
