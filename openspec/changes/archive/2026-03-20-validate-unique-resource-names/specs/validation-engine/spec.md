# validation-engine Specification (Delta)

## MODIFIED Requirements

### Requirement: Validation report with severity levels
The system SHALL produce a validation report categorizing issues as errors or warnings with file paths and line numbers, including resource name uniqueness errors.

#### Scenario: Validation report with errors
- **WHEN** the validation engine completes analysis of a workspace with validation errors
- **THEN** the report SHALL list each error with severity (error), message, file path, and line number

#### Scenario: Validation report with warnings
- **WHEN** the validation engine completes analysis of a workspace with warnings but no errors
- **THEN** the report SHALL list each warning with severity (warning), message, file path, and line number

#### Scenario: Validation report with mixed severities
- **WHEN** the validation engine completes analysis of a workspace with both errors and warnings
- **THEN** the report SHALL list all issues grouped by severity, with errors listed before warnings

#### Scenario: Validation report with no issues
- **WHEN** the validation engine completes analysis of a workspace with no validation issues
- **THEN** the report SHALL indicate successful validation with no errors or warnings

#### Scenario: Validation report with duplicate resource names
- **WHEN** the validation engine encounters duplicate resource names in the workspace
- **THEN** the report SHALL include errors with codes `DUPLICATE_SOURCE_NAME`, `DUPLICATE_DATASET_NAME`, `DUPLICATE_CONTRACT_NAME`, or `DUPLICATE_FLOW_NAME` as appropriate, with file paths and line numbers for each duplicate occurrence