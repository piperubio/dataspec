## MODIFIED Requirements

### Requirement: Field constraints

The system SHALL support declaring constraints on fields including: unique, not_null, referential integrity references, and allowed_values for string fields.

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

## ADDED Requirements

(none)
