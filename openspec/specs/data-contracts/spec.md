# data-contracts Specification

## Purpose
TBD - created by archiving change dpac-core. Update Purpose after archive.
## Requirements
### Requirement: Declare data contracts with schemas
The system SHALL support declaring versioned data contracts that define schemas with field definitions, data types, and constraints. This is the structural definition only — breaking change detection logic belongs in dpac-cli.

#### Scenario: Contract with field definitions
- **WHEN** a contract YAML file contains a contract definition with name `users_contract`, version `1.0`, and fields including `user_id` (type: uuid), `email` (type: string, constraints: unique, not_null)
- **THEN** the system SHALL store the contract definition with its fields, types, and constraints

### Requirement: Support data types
The system SHALL support the following data types in contract field definitions: uuid, string, integer, decimal, boolean, timestamp, date, json.

#### Scenario: Contract with multiple types
- **WHEN** a contract declares fields with types uuid, string, integer, decimal, boolean, timestamp, date, and json
- **THEN** the system SHALL accept all fields as valid and store their type information

### Requirement: Field constraints
The system SHALL support declaring constraints on fields including: unique, not_null, and referential integrity references.

#### Scenario: Field with multiple constraints
- **WHEN** a contract field declares constraints `unique` and `not_null`
- **THEN** the system SHALL store the constraints as part of the field definition

### Requirement: Contract versioning
The system SHALL require every contract to declare a semantic version number.

#### Scenario: Missing contract version
- **WHEN** a contract declaration does not include a version field
- **THEN** the system SHALL treat this as an invalid configuration

### Requirement: Contract name uniqueness per version
The system SHALL enforce that contract names are unique, with version changes treated as updates to the same contract.

#### Scenario: Same contract name different version
- **WHEN** a workspace contains two contract declarations with the same name but different versions
- **THEN** the system SHALL treat these as versions of the same contract

### Requirement: Field name uniqueness within contract
The system SHALL enforce that field names are unique within a contract.

#### Scenario: Duplicate field name
- **WHEN** a contract declares two fields with the same name
- **THEN** the system SHALL treat this as an invalid configuration

### Requirement: Contract metadata
The system SHALL support optional descriptive metadata for contracts including description and deprecation notices.

#### Scenario: Contract with metadata
- **WHEN** a contract declaration includes a `description` field and/or `deprecated` flag
- **THEN** the system SHALL store this metadata as part of the contract definition

