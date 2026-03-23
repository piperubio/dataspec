# validation-engine Delta Specification

## Purpose

Add schema-level validation as a pre-processing step before semantic validation, catching structural errors earlier.

## ADDED Requirements

### Requirement: Validate YAML structure against JSON Schema before semantic validation

The system SHALL validate parsed YAML data against the corresponding JSON Schema using AJV before running semantic validation (graph integrity, cross-resource references, etc.).

#### Scenario: Schema validation runs first

- **WHEN** the validation engine processes a workspace
- **THEN** schema validation SHALL execute before semantic validation, and semantic validation SHALL only run on data that passes schema validation

#### Scenario: Schema errors reported with file path

- **WHEN** a YAML file fails schema validation
- **THEN** the validation report SHALL include the file path and all schema validation errors for that file

#### Scenario: Schema validation does not block semantic validation on other files

- **WHEN** one file fails schema validation but other files are valid
- **THEN** the system SHALL still run semantic validation on the valid files and report both schema errors and any semantic issues
