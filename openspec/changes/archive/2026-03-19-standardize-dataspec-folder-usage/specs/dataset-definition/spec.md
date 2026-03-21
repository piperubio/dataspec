# dataset-definition Specification (Delta)

## MODIFIED Requirements

### Requirement: Declare logical datasets

The system SHALL support declaring logical data units in YAML files located inside the `dataspec/datasets/` folder hierarchy with unique names, layer assignments, and storage configurations.

#### Scenario: Dataset declaration with layer

- **WHEN** a dataset YAML file inside `dataspec/datasets/` contains a dataset definition with name `users_raw`, layer `raw`, and storage configuration
- **THEN** the system SHALL validate that the layer value is one of: raw, refined, serving

#### Scenario: Dataset in correct location

- **WHEN** dataset YAML files are located in `dataspec/datasets/` or its subdirectories (e.g., `dataspec/datasets/raw/`)
- **THEN** the system SHALL scan and parse all dataset files recursively

## ADDED Requirements

### Requirement: Dataset file location enforcement

The system SHALL enforce that dataset definition files are located in the `dataspec/datasets/` folder or its subdirectories.

#### Scenario: Datasets in incorrect location

- **WHEN** dataset YAML files are found outside `dataspec/datasets/` (e.g., in root `datasets/` folder)
- **THEN** the system SHALL NOT parse them and SHALL emit an error indicating the correct location

#### Scenario: Legacy datasets folder at root

- **WHEN** a `datasets/` folder exists at the workspace root (outside `dataspec/`)
- **THEN** the system SHALL ignore it and emit a warning suggesting migration
