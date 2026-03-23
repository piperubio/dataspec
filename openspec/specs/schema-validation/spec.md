# schema-validation Specification

## Purpose

AJV-powered runtime JSON Schema validation for YAML resource files. Validates parsed YAML data against existing JSON Schemas before any business logic parsing occurs.

## Requirements

### Requirement: Compile JSON Schemas into AJV validators

The system SHALL compile all 5 resource type JSON Schemas (platform, source, contract, dataset, flow) into reusable AJV validator functions at module load time.

#### Scenario: Validators are compiled at startup

- **WHEN** the schema-validator module is imported
- **THEN** the system SHALL compile AJV validators for all 5 resource types and cache them for reuse

#### Scenario: AJV is configured for draft-07

- **WHEN** validators are compiled
- **THEN** AJV SHALL be configured with `allErrors: true` (report all validation errors, not just the first) and `strict: false` (allow draft-07 schemas)

### Requirement: Validate data against a specific resource type schema

The system SHALL expose a function that validates a parsed YAML object against the JSON Schema for a given resource type and returns structured error information.

#### Scenario: Valid data passes validation

- **WHEN** a well-formed contract object is validated against the `contract` schema
- **THEN** the function SHALL return `{ valid: true, errors: [] }`

#### Scenario: Invalid data fails validation with descriptive errors

- **WHEN** a contract object missing the required `name` field is validated
- **THEN** the function SHALL return `{ valid: false, errors: [...] }` where each error includes the JSON path (e.g., `/name`) and a descriptive message

#### Scenario: Multiple errors are collected

- **WHEN** a source object has both a missing `name` field and an invalid `type` value
- **THEN** the function SHALL return all errors, not just the first one

### Requirement: Support all 5 resource types

The system SHALL support validation for platform, source, contract, dataset, and flow resource types.

#### Scenario: Platform validation

- **WHEN** a platform object is validated with type `platform`
- **THEN** the system SHALL validate against the platform JSON Schema

#### Scenario: Source validation

- **WHEN** a source object is validated with type `source`
- **THEN** the system SHALL validate against the source JSON Schema

#### Scenario: Contract validation

- **WHEN** a contract object is validated with type `contract`
- **THEN** the system SHALL validate against the contract JSON Schema

#### Scenario: Dataset validation

- **WHEN** a dataset object is validated with type `dataset`
- **THEN** the system SHALL validate against the dataset JSON Schema

#### Scenario: Flow validation

- **WHEN** a flow object is validated with type `flow`
- **THEN** the system SHALL validate against the flow JSON Schema

### Requirement: Provide consistent error format

The system SHALL format AJV validation errors as an array of strings, each containing the JSON instance path and the error message.

#### Scenario: Error format for missing required field

- **WHEN** validation fails because a required field is missing
- **THEN** each error string SHALL include the instance path (e.g., `/name`) and message (e.g., `must have required property 'name'`)

#### Scenario: Error format for type mismatch

- **WHEN** validation fails because a field has the wrong type
- **THEN** each error string SHALL include the instance path and a message indicating the expected type
