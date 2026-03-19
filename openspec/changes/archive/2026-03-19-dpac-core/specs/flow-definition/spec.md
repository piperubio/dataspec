## ADDED Requirements

### Requirement: Declare data flows
The system SHALL support declaring data flows that define how datasets are produced from sources through a sequence of typed steps.

#### Scenario: Flow declaration with steps
- **WHEN** a flow YAML file contains a flow definition with name `users_pipeline`, input references, a sequence of steps, and output dataset references
- **THEN** the system SHALL store the flow definition with its steps and references

### Requirement: Typed flow steps - Extract
The system SHALL support `extract` steps that read from sources and produce raw-layer datasets.

#### Scenario: Extract step declaration
- **WHEN** a flow contains a step with type `extract` referencing a source name and entity, and producing a raw-layer dataset
- **THEN** the system SHALL store the extract step with its source and entity references

### Requirement: Typed flow steps - Transform
The system SHALL support `transform` steps that read from input datasets, apply transformations using a specified engine, and produce output datasets.

#### Scenario: Transform step with engine
- **WHEN** a flow contains a step with type `transform`, input dataset references, engine specification (e.g., dbt, Spark), and output dataset reference
- **THEN** the system SHALL store the transform step with its inputs, engine, and output

### Requirement: Typed flow steps - Load
The system SHALL support `load` steps that read from input datasets and write to serving-layer datasets.

#### Scenario: Load step declaration
- **WHEN** a flow contains a step with type `load` referencing input datasets and a serving-layer target dataset
- **THEN** the system SHALL store the load step with its input and target references

### Requirement: Flow name uniqueness
The system SHALL enforce that all flow names within the workspace are unique.

#### Scenario: Duplicate flow name
- **WHEN** two flow YAML files define flows with the same name
- **THEN** the system SHALL treat this as an invalid configuration

### Requirement: Step type values
The system SHALL restrict step types to a defined set: `extract`, `transform`, `load`.

#### Scenario: Invalid step type
- **WHEN** a flow step contains a type value not in the allowed set
- **THEN** the system SHALL treat this as an invalid configuration

### Requirement: Flow metadata
The system SHALL support optional descriptive metadata for flows including description, schedule, and tags.

#### Scenario: Flow with metadata
- **WHEN** a flow declaration includes a `description` field, `schedule` field, and/or `tags` list
- **THEN** the system SHALL store this metadata as part of the flow definition
