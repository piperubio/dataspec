## ADDED Requirements

### Requirement: Provide validation command
The system SHALL provide a CLI command `dpac validate` that validates the entire workspace and reports errors.

#### Scenario: Validate command success
- **WHEN** a user runs `dpac validate` in a directory with valid platform configuration
- **THEN** the CLI SHALL exit with code 0 and output a success message

#### Scenario: Validate command with errors
- **WHEN** a user runs `dpac validate` in a directory with validation errors
- **THEN** the CLI SHALL exit with a non-zero code and output a formatted list of errors with file paths and line numbers

#### Scenario: Validate with specific directory
- **WHEN** a user runs `dpac validate --path ./my-platform`
- **THEN** the CLI SHALL validate files in the specified directory instead of the current directory

#### Scenario: Validate with JSON output
- **WHEN** a user runs `dpac validate --format json`
- **THEN** the CLI SHALL output the validation report in JSON format suitable for machine parsing

### Requirement: Provide initialization command
The system SHALL provide a CLI command `dpac init` that scaffolds a new data platform project.

#### Scenario: Initialize new project
- **WHEN** a user runs `dpac init` in an empty directory
- **THEN** the CLI SHALL create a scaffolded project structure with `platform.yaml`, `sources/`, `datasets/`, `contracts/`, and `flows/` directories

#### Scenario: Initialize with project name
- **WHEN** a user runs `dpac init --name my-data-platform`
- **THEN** the CLI SHALL create the project with the specified name in the platform.yaml file

#### Scenario: Initialize with example resources
- **WHEN** a user runs `dpac init --with-examples`
- **THEN** the CLI SHALL create the project with example source, dataset, contract, and flow definitions

#### Scenario: Initialize in specific directory
- **WHEN** a user runs `dpac init --path ./new-platform --name my-platform`
- **THEN** the CLI SHALL create the scaffolded project in the specified directory

### Requirement: Provide version command
The system SHALL provide a CLI command `dpac --version` that displays the tool version.

#### Scenario: Version output
- **WHEN** a user runs `dpac --version`
- **THEN** the CLI SHALL output the current version number

#### Scenario: Version flag with other commands
- **WHEN** a user runs `dpac validate --version`
- **THEN** the CLI SHALL output the version number and not run validation

### Requirement: Provide help command
The system SHALL provide a CLI command `dpac --help` that displays available commands and options.

#### Scenario: Help output
- **WHEN** a user runs `dpac --help`
- **THEN** the CLI SHALL display usage information, available commands, and global options

#### Scenario: Command-specific help
- **WHEN** a user runs `dpac validate --help`
- **THEN** the CLI SHALL display help specific to the validate command including available options

#### Scenario: Help for init command
- **WHEN** a user runs `dpac init --help`
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
- **WHEN** the CLI is run in a directory without DPaC configuration files
- **THEN** the error message SHALL indicate that no platform configuration was found and suggest running `dpac init`

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
