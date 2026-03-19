# source-management Specification (Delta)

## MODIFIED Requirements

### Requirement: Declare external data sources
The system SHALL support declaring external data producers in YAML files located inside the `dataspec/sources/` folder.

#### Scenario: Database source declaration
- **WHEN** a source YAML file inside `dataspec/sources/` contains a source definition with type `database` and entity mappings
- **THEN** the system SHALL store the source definition with its type and entities

#### Scenario: API source declaration
- **WHEN** a source YAML file inside `dataspec/sources/` contains a source definition with type `api` and endpoint entities
- **THEN** the system SHALL store the source definition with its type and entities

#### Scenario: File system source declaration
- **WHEN** a source YAML file inside `dataspec/sources/` contains a source definition with type `file_system` and file pattern entities
- **THEN** the system SHALL store the source definition with its type and entities

## ADDED Requirements

### Requirement: Source file location enforcement
The system SHALL enforce that source definition files are located in the `dataspec/sources/` folder.

#### Scenario: Sources in correct location
- **WHEN** source YAML files are located in `dataspec/sources/`
- **THEN** the system SHALL scan and parse all source files

#### Scenario: Sources in incorrect location
- **WHEN** source YAML files are found outside `dataspec/sources/` (e.g., in root `sources/` folder)
- **THEN** the system SHALL NOT parse them and SHALL emit an error indicating the correct location

#### Scenario: Legacy sources folder at root
- **WHEN** a `sources/` folder exists at the workspace root (outside `dataspec/`)
- **THEN** the system SHALL ignore it and emit a warning suggesting migration