# cli-tooling Specification (Delta)

## MODIFIED Requirements

### Requirement: Provide initialization command
The system SHALL provide a CLI command `dataspec init` that scaffolds a new data platform project with the standardized folder structure.

#### Scenario: Initialize new project
- **WHEN** a user runs `dataspec init` in an empty directory
- **THEN** the CLI SHALL create a scaffolded project structure with `dataspec/platform.yaml`, `dataspec/sources/`, `dataspec/datasets/`, `dataspec/contracts/`, and `dataspec/flows/` directories

#### Scenario: Initialize with project name
- **WHEN** a user runs `dataspec init --name my-data-platform`
- **THEN** the CLI SHALL create the project with the specified name in the `dataspec/platform.yaml` file

#### Scenario: Initialize with example resources
- **WHEN** a user runs `dataspec init --with-examples`
- **THEN** the CLI SHALL create the project with example source, dataset, contract, and flow definitions inside the `dataspec/` folder

#### Scenario: Initialize in specific directory
- **WHEN** a user runs `dataspec init --path ./new-platform --name my-platform`
- **THEN** the CLI SHALL create the scaffolded project with `dataspec/` folder in the specified directory

## ADDED Requirements

### Requirement: Workspace structure error messages
The system SHALL provide clear error messages when the workspace structure is invalid.

#### Scenario: Missing dataspec folder error
- **WHEN** the CLI cannot find a `dataspec/` folder in the workspace
- **THEN** the error message SHALL indicate the required folder structure and suggest running `dataspec init` to create a new project

#### Scenario: Resources outside dataspec folder error
- **WHEN** resources are found outside the `dataspec/` folder
- **THEN** the error message SHALL list the misplaced files and indicate they should be moved to `dataspec/`