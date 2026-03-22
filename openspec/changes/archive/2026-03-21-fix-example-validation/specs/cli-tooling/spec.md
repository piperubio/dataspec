# Delta for cli-tooling

## MODIFIED Requirements

### Requirement: Initialize with example resources

The system SHALL create the project with example source, dataset, contract, and flow definitions inside the `dataspec/` folder. All generated examples MUST pass validation without errors.

(Previously: The CLI SHALL create the project with example source, dataset, contract, and flow definitions inside the `dataspec/` folder)

#### Scenario: Initialize with validation-compliant examples

- **GIVEN** the user runs `dataspec init --with-examples` in an empty directory
- **WHEN** the CLI generates example resources
- **THEN** each generated YAML resource SHALL be valid according to the validation schema
- **AND** running `dataspec validate` SHALL exit with code 0

#### Scenario: Initialize examples with missing required fields

- **GIVEN** the user runs `dataspec init --with-examples`
- **WHEN** the CLI generates example source entities
- **THEN** each source entity SHALL include the `location` field specifying the database location
- **AND** each source entity SHALL include a `contract` field with `name` and `version` properties

## ADDED Requirements

### Requirement: Example source entities include location

The system SHALL generate example source entities with a `location` field that specifies the database and schema path.

#### Scenario: Source entity location field

- **GIVEN** the user runs `dataspec init --with-examples`
- **WHEN** the CLI generates example source entity YAML
- **THEN** the source entity SHALL contain a `location` field in the format `schema.table` (e.g., `public.users`)

### Requirement: Example source entities include contract reference

The system SHALL generate example source entities with a `contract` field that references an existing contract by name and version.

#### Scenario: Source entity contract field

- **GIVEN** the user runs `dataspec init --with-examples`
- **WHEN** the CLI generates example source entity YAML
- **THEN** the source entity SHALL contain a `contract` object with `name` and `version` properties
- **AND** the referenced contract SHALL exist in the `dataspec/contracts/` directory

### Requirement: Example flows include complete ETL steps

The system SHALL generate example flows that include all three ETL stages: extract, transform, and load.

#### Scenario: Complete ETL flow generation

- **GIVEN** the user runs `dataspec init --with-examples`
- **WHEN** the CLI generates example flow YAML
- **THEN** the flow SHALL contain an `extract` step that reads from a source entity
- **AND** the flow SHALL contain a `transform` step that specifies a transformation engine (e.g., `dbt`)
- **AND** the flow SHALL contain a `load` step that writes to a dataset

### Requirement: Example dataset linked to flow output

The system SHALL generate example datasets that are linked as the load target of the example flow.

#### Scenario: Dataset as flow load target

- **GIVEN** the user runs `dataspec init --with-examples`
- **WHEN** the CLI generates example flow and dataset
- **THEN** the flow's `load` step SHALL specify a dataset name that exists in the workspace
- **AND** the specified dataset SHALL be present in `dataspec/datasets/`
