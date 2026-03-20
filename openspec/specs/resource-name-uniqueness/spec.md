# resource-name-uniqueness Specification

## Purpose
TBD - created by archiving change validate-unique-resource-names. Update Purpose after archive.
## Requirements
### Requirement: Source name uniqueness
The system SHALL enforce that all source names within the workspace are unique.

#### Scenario: Duplicate source names detected
- **WHEN** two or more source YAML files define sources with the same name
- **THEN** the system SHALL report a validation error with error code `DUPLICATE_SOURCE_NAME` for each duplicate occurrence, including the file path and line number

#### Scenario: Unique source names pass validation
- **WHEN** all source files define sources with unique names
- **THEN** the system SHALL NOT report any source name uniqueness errors

### Requirement: Dataset name uniqueness
The system SHALL enforce that all dataset names within the workspace are unique.

#### Scenario: Duplicate dataset names detected
- **WHEN** two or more dataset YAML files define datasets with the same name
- **THEN** the system SHALL report a validation error with error code `DUPLICATE_DATASET_NAME` for each duplicate occurrence, including the file path and line number

#### Scenario: Unique dataset names pass validation
- **WHEN** all dataset files define datasets with unique names
- **THEN** the system SHALL NOT report any dataset name uniqueness errors

### Requirement: Contract name uniqueness
The system SHALL enforce that all contract names within the workspace are unique.

#### Scenario: Duplicate contract names detected
- **WHEN** two or more contract YAML files define contracts with the same name
- **THEN** the system SHALL report a validation error with error code `DUPLICATE_CONTRACT_NAME` for each duplicate occurrence, including the file path and line number

#### Scenario: Same contract name different versions
- **WHEN** two contract files declare the same name with different versions
- **THEN** the system SHALL report a validation error for the duplicate contract name (version does not create a separate namespace)

#### Scenario: Unique contract names pass validation
- **WHEN** all contract files define contracts with unique names
- **THEN** the system SHALL NOT report any contract name uniqueness errors

### Requirement: Flow name uniqueness
The system SHALL enforce that all flow names within the workspace are unique.

#### Scenario: Duplicate flow names detected
- **WHEN** two or more flow YAML files define flows with the same name
- **THEN** the system SHALL report a validation error with error code `DUPLICATE_FLOW_NAME` for each duplicate occurrence, including the file path and line number

#### Scenario: Unique flow names pass validation
- **WHEN** all flow files define flows with unique names
- **THEN** the system SHALL NOT report any flow name uniqueness errors

### Requirement: Multiple duplicate detection
The system SHALL detect and report all instances of duplicate names in a single validation pass.

#### Scenario: Multiple duplicates of the same name
- **WHEN** three source files all define sources with the same name
- **THEN** the system SHALL report two duplicate errors (for the second and third occurrences), each with the corresponding file path and line number

#### Scenario: Multiple names with duplicates
- **WHEN** two sources share name "alpha" and two datasets share name "beta"
- **THEN** the system SHALL report one duplicate source error and one duplicate dataset error

