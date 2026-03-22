## ADDED Requirements

### Requirement: Allowed values constraint for string fields

The system SHALL support an `allowed_values` constraint that restricts string fields to a specific set of permitted values.

#### Scenario: Field with allowed values

- **WHEN** a contract field with `type: string` declares `constraints.allowed_values` as an array of strings
- **THEN** the system SHALL store the allowed values as part of the field constraint definition

#### Scenario: Allowed values on non-string field

- **WHEN** a contract field with a non-string type (e.g., `integer`, `uuid`) declares `constraints.allowed_values`
- **THEN** the system SHALL reject the configuration with an error indicating `allowed_values` is only valid for string fields

#### Scenario: Empty allowed values array

- **WHEN** a contract field declares `constraints.allowed_values` as an empty array
- **THEN** the system SHALL accept the configuration (no values are permitted)

#### Scenario: Allowed values with duplicate entries

- **WHEN** a contract field declares `constraints.allowed_values` with duplicate string values
- **THEN** the system SHALL accept the configuration (duplicates are harmless, unique enforcement is not required)
