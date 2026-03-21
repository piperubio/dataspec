# validation-engine Specification

## Purpose

TBD - created by archiving change dataspec-cli. Update Purpose after archive.

## Requirements

### Requirement: Validate graph integrity

The system SHALL validate that the data platform graph has no cycles, no orphaned resources, and no incomplete pipelines.

#### Scenario: Cyclic dependency detection

- **WHEN** a workspace contains flows that form a cycle (Dataset A → Flow 1 → Dataset B → Flow 2 → Dataset A)
- **THEN** the validation engine SHALL report a graph integrity error indicating the cycle and all involved resources

#### Scenario: Orphaned resource detection

- **WHEN** a workspace contains a dataset that is not produced by any flow and not consumed by any flow
- **THEN** the validation engine SHALL report a warning indicating the orphaned dataset

#### Scenario: Incomplete pipeline detection

- **WHEN** a workspace contains a flow with steps that do not form a complete pipeline from input to output
- **THEN** the validation engine SHALL report an error indicating the incomplete pipeline

### Requirement: Validate contract consistency

The system SHALL validate that contract field types are supported, constraints are valid for the field type, and contract versions follow semantic versioning.

#### Scenario: Invalid field type

- **WHEN** a contract declares a field with an unsupported type
- **THEN** the validation engine SHALL report an error listing the invalid type and supported types

#### Scenario: Invalid constraint for field type

- **WHEN** a contract applies a `unique` constraint to a field of type `json`
- **THEN** the validation engine SHALL report an error indicating the constraint is not valid for JSON fields

#### Scenario: Invalid semantic version

- **WHEN** a contract declares a version that does not follow semantic versioning (e.g., "1.5" instead of "1.5.0")
- **THEN** the validation engine SHALL report an error indicating the invalid version format

### Requirement: Validate cross-resource references

The system SHALL validate that all resource references resolve to declared resources within the workspace.

#### Scenario: Unresolved source reference

- **WHEN** a flow extract step references a source named `postgres_main` that does not exist in any source file
- **THEN** the validation engine SHALL report a cross-reference error with the unresolved reference and the file location

#### Scenario: Unresolved dataset reference

- **WHEN** a flow transform step references an input dataset named `orders_raw` that does not exist
- **THEN** the validation engine SHALL report a cross-reference error indicating the missing dataset

#### Scenario: Unresolved contract reference

- **WHEN** a dataset declares a contract reference to `orders_contract` that does not exist
- **THEN** the validation engine SHALL report a cross-reference error indicating the missing contract

#### Scenario: Unresolved flow reference

- **WHEN** a dataset declares it is produced by flow `etl_pipeline` that does not exist
- **THEN** the validation engine SHALL report a cross-reference error indicating the missing flow

### Requirement: Validate step type coherence

The system SHALL validate that extract steps reference sources, transform steps reference datasets, and load steps reference datasets.

#### Scenario: Type mismatch in extract step

- **WHEN** an extract step references a dataset instead of a source
- **THEN** the validation engine SHALL report a step type error indicating the expected resource type

#### Scenario: Type mismatch in transform step

- **WHEN** a transform step references a source instead of a dataset
- **THEN** the validation engine SHALL report a step type error indicating that transform steps MUST reference datasets

#### Scenario: Type mismatch in load step

- **WHEN** a load step references a source instead of a dataset
- **THEN** the validation engine SHALL report a step type error indicating that load steps MUST reference datasets

### Requirement: Detect breaking changes via workspace-wide dependency analysis

The system SHALL detect breaking changes by building and traversing the cross-resource dependency graph within the workspace, NOT by comparing against Git history. The engine SHALL flag incompatibilities where a contract change breaks downstream flows or datasets.

#### Scenario: Breaking change detection via graph analysis

- **WHEN** a contract removes a field `customer_email` and a downstream flow references this field in a transform step
- **THEN** the validation engine SHALL traverse the dependency graph (contract → dataset → flow), detect the incompatibility, and report a breaking change error with the affected resources

#### Scenario: Multi-hop breaking change detection

- **WHEN** Contract A changes a field type, Dataset B (associated with Contract A) is affected, and Flow C consumes Dataset B and produces Dataset D consumed by Flow E
- **THEN** the validation engine SHALL detect the breaking change at Contract A and report all downstream affected resources: Dataset B, Flow C, Dataset D, and Flow E

#### Scenario: Breaking change detection in CI context

- **WHEN** the validation engine runs in a CI pipeline with no Git history available (fresh checkout)
- **THEN** the engine SHALL still detect breaking changes by analyzing the current workspace dependency graph

#### Scenario: Field removal breaking change

- **WHEN** a contract removes a field that is referenced by at least one downstream flow
- **THEN** the validation engine SHALL report a breaking change error indicating the removed field and the flows that reference it

#### Scenario: Type narrowing breaking change

- **WHEN** a contract changes a field type from `string` to `uuid` (type narrowing) and downstream flows expect `string`
- **THEN** the validation engine SHALL report a breaking change error indicating the type incompatibility

#### Scenario: Constraint tightening breaking change

- **WHEN** a contract changes a field from nullable to non-nullable and downstream flows do not handle the constraint
- **THEN** the validation engine SHALL report a breaking change error indicating the constraint tightening

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
