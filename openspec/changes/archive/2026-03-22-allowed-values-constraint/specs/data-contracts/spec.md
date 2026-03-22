## MODIFIED Requirements

### Requirement: Field constraints

The system SHALL support declaring constraints on fields including: unique, not_null, referential integrity references, and allowed_values for string fields.

#### Scenario: Field with multiple constraints

- **WHEN** a contract field declares constraints `unique` and `not_null`
- **THEN** the system SHALL store the constraints as part of the field definition

#### Scenario: Field with allowed_values constraint

- **WHEN** a contract field with `type: string` declares `constraints.allowed_values` as an array of strings
- **THEN** the system SHALL store the allowed values as part of the field constraint definition
