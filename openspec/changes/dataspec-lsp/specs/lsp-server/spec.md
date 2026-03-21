## ADDED Requirements

### Requirement: Provide real-time diagnostics

The system SHALL provide real-time diagnostics (errors and warnings) as the user edits YAML files, reusing the validation engine for consistency.

#### Scenario: Real-time error on invalid type

- **WHEN** a user types an invalid field type in a contract file while the LSP server is active
- **THEN** the LSP server SHALL publish a diagnostic within 500ms indicating the invalid type and valid options

#### Scenario: Cross-reference error in real-time

- **WHEN** a user references a non-existent dataset in a flow file
- **THEN** the LSP server SHALL publish a diagnostic indicating the unresolved reference

### Requirement: Provide hover documentation

The system SHALL display documentation when hovering over resource references, showing relevant metadata about the target resource.

#### Scenario: Hover on dataset reference

- **WHEN** a user hovers over a dataset reference in a flow file
- **THEN** the LSP server SHALL return hover text containing the dataset's layer, storage backend, and associated contract

#### Scenario: Hover on contract field

- **WHEN** a user hovers over a contract field name
- **THEN** the LSP server SHALL return hover text containing the field type, constraints, and description

#### Scenario: Hover on flow step

- **WHEN** a user hovers over a flow step definition
- **THEN** the LSP server SHALL return hover text containing the step type, inputs, outputs, and engine (if applicable)

### Requirement: Provide go-to-definition

The system SHALL support navigating from a resource reference to its definition across files.

#### Scenario: Go-to-definition for dataset

- **WHEN** a user invokes go-to-definition on a dataset reference in a flow transform step
- **THEN** the LSP server SHALL return the location (file path and line number) of the dataset definition

#### Scenario: Go-to-definition for source

- **WHEN** a user invokes go-to-definition on a source reference in a flow extract step
- **THEN** the LSP server SHALL return the location of the source definition

#### Scenario: Go-to-definition for contract

- **WHEN** a user invokes go-to-definition on a contract reference in a dataset declaration
- **THEN** the LSP server SHALL return the location of the contract definition

### Requirement: Provide completion suggestions

The system SHALL provide autocompletion for resource names, contract fields, engine identifiers, and layer values.

#### Scenario: Completion for dataset names

- **WHEN** a user types in a dataset reference field and triggers completion
- **THEN** the LSP server SHALL return a list of all declared dataset names as completion items

#### Scenario: Completion for contract fields

- **WHEN** a user types in a field mapping and triggers completion
- **THEN** the LSP server SHALL return a list of fields from the referenced contract as completion items

#### Scenario: Completion for engine identifiers

- **WHEN** a user types in an engine field within a transform step and triggers completion
- **THEN** the LSP server SHALL return supported engine identifiers: spark, duckdb, dbt, python

#### Scenario: Completion for layer values

- **WHEN** a user types in a layer field and triggers completion
- **THEN** the LSP server SHALL return valid layer values: raw, refined, serving

### Requirement: Diagnostics for cross-resource incompatibilities

The system SHALL include diagnostics for breaking changes and cross-resource incompatibilities detected via workspace dependency graph analysis.

#### Scenario: Real-time breaking change warning

- **WHEN** a user modifies a contract to remove a field that is referenced by a flow in the workspace
- **THEN** the LSP server SHALL publish a diagnostic warning within 500ms indicating the breaking change and the affected flow

#### Scenario: Multi-file impact analysis

- **WHEN** a user changes a contract field type and multiple flows reference fields from this contract
- **THEN** the LSP server SHALL publish diagnostics in all affected files indicating the potential breaking change

#### Scenario: Detect missing required field impact

- **WHEN** a user adds a required field to a contract that is consumed by existing datasets
- **THEN** the LSP server SHALL publish diagnostics indicating which datasets need to provide the new required field

### Requirement: Workspace index synchronization

The system SHALL maintain an in-memory index of all resources in the workspace, updating incrementally as files change.

#### Scenario: Incremental index update

- **WHEN** a user saves a modified source file
- **THEN** the LSP server SHALL update its workspace index for that file only, without re-parsing the entire workspace

#### Scenario: Full index on initialization

- **WHEN** the LSP server initializes on a workspace
- **THEN** the server SHALL build a complete index of all resources across all YAML files in the workspace

#### Scenario: Index update on file creation

- **WHEN** a new YAML file is created in the workspace
- **THEN** the LSP server SHALL add the resources from that file to the workspace index

#### Scenario: Index update on file deletion

- **WHEN** a YAML file is deleted from the workspace
- **THEN** the LSP server SHALL remove all resources from that file from the workspace index and publish diagnostics for any broken references
