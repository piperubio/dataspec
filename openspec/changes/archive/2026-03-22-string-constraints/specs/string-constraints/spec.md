## Purpose

Define the behavior of four string-specific constraints: `min_length`, `max_length`, `format`, and `pattern`.

## Requirements

### Requirement: min_length constraint for string fields

The system SHALL support a `min_length` constraint that specifies the minimum number of characters for a string field.

#### Scenario: Valid min_length on string field

- **WHEN** a contract field with `type: string` declares `constraints.min_length` as a positive integer
- **THEN** the system SHALL accept the configuration and store the constraint

#### Scenario: min_length on non-string field

- **WHEN** a contract field with a non-string type declares `constraints.min_length`
- **THEN** the system SHALL reject the configuration with an error indicating `min_length` is only valid for string fields

#### Scenario: min_length is zero or negative

- **WHEN** a contract field declares `constraints.min_length` with a value of 0 or a negative integer
- **THEN** the system SHALL reject the configuration with an error indicating `min_length` must be a positive integer

#### Scenario: min_length is not an integer

- **WHEN** a contract field declares `constraints.min_length` with a non-integer value (e.g., 1.5)
- **THEN** the system SHALL reject the configuration with an error indicating `min_length` must be a positive integer

#### Scenario: min_length greater than max_length

- **WHEN** a contract field declares both `constraints.min_length` and `constraints.max_length` where `min_length > max_length`
- **THEN** the system SHALL reject the configuration with an error indicating `min_length` cannot exceed `max_length`

### Requirement: max_length constraint for string fields

The system SHALL support a `max_length` constraint that specifies the maximum number of characters for a string field.

#### Scenario: Valid max_length on string field

- **WHEN** a contract field with `type: string` declares `constraints.max_length` as a positive integer
- **THEN** the system SHALL accept the configuration and store the constraint

#### Scenario: max_length on non-string field

- **WHEN** a contract field with a non-string type declares `constraints.max_length`
- **THEN** the system SHALL reject the configuration with an error indicating `max_length` is only valid for string fields

#### Scenario: max_length is zero or negative

- **WHEN** a contract field declares `constraints.max_length` with a value of 0 or a negative integer
- **THEN** the system SHALL reject the configuration with an error indicating `max_length` must be a positive integer

#### Scenario: max_length is not an integer

- **WHEN** a contract field declares `constraints.max_length` with a non-integer value
- **THEN** the system SHALL reject the configuration with an error indicating `max_length` must be a positive integer

#### Scenario: max_length less than min_length

- **WHEN** a contract field declares both `constraints.min_length` and `constraints.max_length` where `max_length < min_length`
- **THEN** the system SHALL reject the configuration with an error indicating `max_length` cannot be less than `min_length`

### Requirement: format constraint for string fields

The system SHALL support a `format` constraint that provides semantic metadata about the expected content of a string field.

#### Scenario: Valid format on string field

- **WHEN** a contract field with `type: string` declares `constraints.format` as a string
- **THEN** the system SHALL accept the configuration and store the constraint value

#### Scenario: format on non-string field

- **WHEN** a contract field with a non-string type declares `constraints.format`
- **THEN** the system SHALL reject the configuration with an error indicating `format` is only valid for string fields

#### Scenario: format with any string value

- **WHEN** a contract field with `type: string` declares `constraints.format` with any arbitrary string (e.g., `email`, `uri`, `phone`, `custom-format`)
- **THEN** the system SHALL accept the configuration without validating the format value

### Requirement: pattern constraint for string fields

The system SHALL support a `pattern` constraint that specifies a regular expression the string field value must match.

#### Scenario: Valid pattern on string field

- **WHEN** a contract field with `type: string` declares `constraints.pattern` as a valid regex string
- **THEN** the system SHALL accept the configuration and store the constraint

#### Scenario: pattern on non-string field

- **WHEN** a contract field with a non-string type declares `constraints.pattern`
- **THEN** the system SHALL reject the configuration with an error indicating `pattern` is only valid for string fields

#### Scenario: pattern with invalid regex syntax

- **WHEN** a contract field declares `constraints.pattern` with an invalid regex string (e.g., `[unclosed`)
- **THEN** the system SHALL reject the configuration with an error indicating the pattern is not a valid regular expression

### Requirement: Combined string constraints

The system SHALL allow multiple string constraints to be used together on the same field.

#### Scenario: All string constraints together

- **WHEN** a contract field with `type: string` declares `min_length`, `max_length`, `format`, and `pattern` constraints simultaneously
- **THEN** the system SHALL accept the configuration provided all individual validations pass
