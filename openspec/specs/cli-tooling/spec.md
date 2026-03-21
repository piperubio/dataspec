# cli-tooling Specification

## Purpose

TBD - created by archiving change dataspec-cli. Update Purpose after archive.

## Requirements

### Requirement: Provide validation command

The system SHALL provide a CLI command `dataspec validate` that validates the entire workspace and reports errors.

#### Scenario: Validate command success

- **WHEN** a user runs `dataspec validate` in a directory with valid platform configuration
- **THEN** the CLI SHALL exit with code 0 and output a success message

#### Scenario: Validate command with errors

- **WHEN** a user runs `dataspec validate` in a directory with validation errors
- **THEN** the CLI SHALL exit with a non-zero code and output a formatted list of errors with file paths and line numbers

#### Scenario: Validate with specific directory

- **WHEN** a user runs `dataspec validate --path ./my-platform`
- **THEN** the CLI SHALL validate files in the specified directory instead of the current directory

#### Scenario: Validate with JSON output

- **WHEN** a user runs `dataspec validate --format json`
- **THEN** the CLI SHALL output the validation report in JSON format suitable for machine parsing

### Requirement: Provide initialization command

The system SHALL provide a CLI command `dataspec init` that scaffolds a new data platform project.

#### Scenario: Initialize new project

- **WHEN** a user runs `dataspec init` in an empty directory
- **THEN** the CLI SHALL create a scaffolded project structure with `dataspec/platform.yaml`, `dataspec/sources/`, `dataspec/datasets/`, `dataspec/contracts/`, and `dataspec/flows/` directories

#### Scenario: Initialize with project name

- **WHEN** a user runs `dataspec init --name my-data-platform`
- **THEN** the CLI SHALL create the project with the specified name in the `dataspec/platform.yaml` file

#### Scenario: Initialize with example resources

- **WHEN** a user runs `dataspec init --with-examples`
- **THEN** the CLI SHALL create the project with example source, dataset, contract, and flow definitions inside the `dataspec/` folder

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

#### Scenario: Initialize in specific directory

- **WHEN** a user runs `dataspec init --path ./new-platform --name my-platform`
- **THEN** the CLI SHALL create the scaffolded project with `dataspec/` folder in the specified directory

### Requirement: Provide version command

The system SHALL provide a CLI command `dataspec --version` that displays the tool version.

#### Scenario: Version output

- **WHEN** a user runs `dataspec --version`
- **THEN** the CLI SHALL output the current version number

#### Scenario: Version flag with other commands

- **WHEN** a user runs `dataspec validate --version`
- **THEN** the CLI SHALL output the version number and not run validation

### Requirement: Provide help command

The system SHALL provide a CLI command `dataspec --help` that displays available commands and options.

#### Scenario: Help output

- **WHEN** a user runs `dataspec --help`
- **THEN** the CLI SHALL display usage information, available commands, and global options

#### Scenario: Command-specific help

- **WHEN** a user runs `dataspec validate --help`
- **THEN** the CLI SHALL display help specific to the validate command including available options

#### Scenario: Help for init command

- **WHEN** a user runs `dataspec init --help`
- **THEN** the CLI SHALL display help specific to the init command including available options

### Requirement: Consistent error formatting

The system SHALL format CLI errors consistently with file paths, line numbers, and clear messages.

#### Scenario: Validation error format

- **WHEN** a validation error is reported
- **THEN** the output SHALL follow the format: `<file-path>:<line>:<severity>: <message>`

#### Scenario: Multiple validation errors

- **WHEN** multiple validation errors are reported
- **THEN** each error SHALL be on a separate line following the consistent format

#### Scenario: CLI argument error format

- **WHEN** a user provides an invalid CLI argument
- **THEN** the error message SHALL indicate the invalid argument and suggest correct usage

#### Scenario: File not found error

- **WHEN** the CLI is run in a directory without DataSpec configuration files
- **THEN** the error message SHALL indicate that no platform configuration was found and suggest running `dataspec init`

### Requirement: Exit codes for CI integration

The system SHALL use specific exit codes to enable CI/CD pipeline integration.

#### Scenario: Successful validation exit code

- **WHEN** validation completes with no errors
- **THEN** the CLI SHALL exit with code 0

#### Scenario: Validation failure exit code

- **WHEN** validation completes with one or more errors
- **THEN** the CLI SHALL exit with code 1

#### Scenario: CLI error exit code

- **WHEN** a CLI error occurs (invalid arguments, file not found)
- **THEN** the CLI SHALL exit with code 2

### Requirement: Provide list command

The system SHALL provide a CLI command `dataspec list [resource]` that lists resources in the workspace.

#### Scenario: List all resources

- **WHEN** a user runs `dataspec list` without specifying a resource type
- **THEN** the CLI SHALL display a summary of all resource types with counts

#### Scenario: List sources

- **WHEN** a user runs `dataspec list sources`
- **THEN** the CLI SHALL display all sources with their names and types

#### Scenario: List datasets

- **WHEN** a user runs `dataspec list datasets`
- **THEN** the CLI SHALL display all datasets with their names and tier (raw/refined/serving)

#### Scenario: List datasets filtered by tier

- **WHEN** a user runs `dataspec list datasets --tier raw`
- **THEN** the CLI SHALL display only datasets in the raw tier

#### Scenario: List flows

- **WHEN** a user runs `dataspec list flows`
- **THEN** the CLI SHALL display all flows with their names and validation status

#### Scenario: List contracts

- **WHEN** a user runs `dataspec list contracts`
- **THEN** the CLI SHALL display all contracts with their names and versions

#### Scenario: List with JSON output

- **WHEN** a user runs `dataspec list --format json`
- **THEN** the CLI SHALL output the resource list in JSON format

### Requirement: Provide show command

The system SHALL provide a CLI command `dataspec show <resource> <name>` that displays detailed information about a specific resource.

#### Scenario: Show source details

- **WHEN** a user runs `dataspec show source production_db`
- **THEN** the CLI SHALL display detailed information about the source including connection type, host, and referenced datasets

#### Scenario: Show dataset details

- **WHEN** a user runs `dataspec show dataset users_raw`
- **THEN** the CLI SHALL display detailed information about the dataset including schema reference, tier, and associated flows

#### Scenario: Show flow details

- **WHEN** a user runs `dataspec show flow orders_etl_pipeline`
- **THEN** the CLI SHALL display detailed information about the flow including steps, inputs, and outputs

#### Scenario: Show contract details

- **WHEN** a user runs `dataspec show contract user_contract`
- **THEN** the CLI SHALL display detailed information about the contract including fields, types, and constraints

#### Scenario: Show with dependencies

- **WHEN** a user runs `dataspec show dataset users_raw --deps`
- **THEN** the CLI SHALL display the dataset details plus upstream and downstream dependencies

#### Scenario: Show resource not found

- **WHEN** a user runs `dataspec show dataset nonexistent`
- **THEN** the CLI SHALL exit with code 2 and display an error message indicating the resource was not found

#### Scenario: Show with JSON output

- **WHEN** a user runs `dataspec show dataset users_raw --format json`
- **THEN** the CLI SHALL output the resource details in JSON format
