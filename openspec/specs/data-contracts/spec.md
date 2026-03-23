# data-contracts Specification

## Purpose

TBD - created by archiving change dataspec-core. Update Purpose after archive.

## Requirements

### Requirement: Declare data contracts with schemas

The system SHALL support declaring versioned data contracts that define schemas with field definitions, data types, and constraints. This is the structural definition only — breaking change detection logic belongs in dataspec-cli.

#### Scenario: Contract with field definitions

- **WHEN** a contract YAML file contains a contract definition with name `users_contract`, version `1.0`, and fields including `user_id` (type: uuid), `email` (type: string, constraints: unique, not_null)
- **THEN** the system SHALL store the contract definition with its fields, types, and constraints

### Requirement: Support data types

The system SHALL support the following data types in contract field definitions: uuid, string, integer, decimal, boolean, timestamp, date, json.

#### Scenario: Contract with multiple types

- **WHEN** a contract declares fields with types uuid, string, integer, decimal, boolean, timestamp, date, and json
- **THEN** the system SHALL accept all fields as valid and store their type information

### Requirement: Field constraints

The system SHALL support declaring constraints on fields including: unique, not_null, referential integrity references, allowed_values for string fields, precision and scale for decimal fields, min and max for numeric fields, and min_length, max_length, format, and pattern for string fields.

#### Scenario: Field with multiple constraints

- **WHEN** a contract field declares constraints `unique` and `not_null`
- **THEN** the system SHALL store the constraints as part of the field definition

#### Scenario: Field with allowed_values constraint

- **WHEN** a contract field with `type: string` declares `constraints.allowed_values` as an array of strings
- **THEN** the system SHALL store the allowed values as part of the field constraint definition

#### Scenario: Field with precision and scale

- **WHEN** a contract field with `type: decimal` declares `constraints.precision` and `constraints.scale` as positive integers
- **THEN** the system SHALL store precision and scale as part of the field constraint definition

#### Scenario: Field with min and max

- **WHEN** a contract field with a numeric type (integer or decimal) declares `constraints.min` and `constraints.max` as finite numbers
- **THEN** the system SHALL store min and max as part of the field constraint definition

#### Scenario: Precision/scale on non-decimal type

- **WHEN** a contract field with a non-decimal type declares `constraints.precision` or `constraints.scale`
- **THEN** the system MUST reject the constraint with an error indicating precision/scale are only valid for decimal types

#### Scenario: Scale greater than precision

- **WHEN** a contract field declares `constraints.scale` greater than `constraints.precision`
- **THEN** the system MUST reject the constraint with an error indicating scale must be less than or equal to precision

#### Scenario: Precision without scale

- **WHEN** a contract field declares `constraints.precision` without `constraints.scale`
- **THEN** the system MUST reject the constraint with an error indicating precision and scale must be specified together

#### Scenario: Min/max on non-numeric type

- **WHEN** a contract field with a non-numeric type declares `constraints.min` or `constraints.max`
- **THEN** the system MUST reject the constraint with an error indicating min/max are only valid for numeric types

#### Scenario: Min greater than max

- **WHEN** a contract field declares `constraints.min` greater than `constraints.max`
- **THEN** the system MUST reject the constraint with an error indicating min must be less than or equal to max

#### Scenario: Non-positive precision or scale

- **WHEN** a contract field declares `constraints.precision` or `constraints.scale` as a non-positive integer
- **THEN** the system MUST reject the constraint with an error indicating precision and scale must be positive integers

#### Scenario: Non-finite min or max

- **WHEN** a contract field declares `constraints.min` or `constraints.max` as a non-finite number (NaN or Infinity)
- **THEN** the system MUST reject the constraint with an error indicating min and max must be finite numbers

#### Scenario: Field with min_length constraint

- **WHEN** a contract field with `type: string` declares `constraints.min_length` as a positive integer
- **THEN** the system SHALL store min_length as part of the field constraint definition

#### Scenario: Field with max_length constraint

- **WHEN** a contract field with `type: string` declares `constraints.max_length` as a positive integer
- **THEN** the system SHALL store max_length as part of the field constraint definition

#### Scenario: min_length greater than max_length

- **WHEN** a contract field declares `constraints.min_length` greater than `constraints.max_length`
- **THEN** the system MUST reject the constraint with an error indicating min_length must be less than or equal to max_length

#### Scenario: Field with format constraint

- **WHEN** a contract field with `type: string` declares `constraints.format` as a string
- **THEN** the system SHALL store format as part of the field constraint definition

#### Scenario: Field with pattern constraint

- **WHEN** a contract field with `type: string` declares `constraints.pattern` as a valid regex string
- **THEN** the system SHALL store pattern as part of the field constraint definition

#### Scenario: Pattern with invalid regex syntax

- **WHEN** a contract field declares `constraints.pattern` with an invalid regex string
- **THEN** the system MUST reject the constraint with an error indicating the pattern is not a valid regular expression

#### Scenario: String constraints on non-string type

- **WHEN** a contract field with a non-string type declares `constraints.min_length`, `constraints.max_length`, `constraints.format`, or `constraints.pattern`
- **THEN** the system MUST reject the constraint with an error indicating these constraints are only valid for string types

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
