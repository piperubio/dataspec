# flow-definition Specification (Delta)

## MODIFIED Requirements

### Requirement: Declare data flows
The system SHALL support declaring data flows in YAML files located inside the `dataspec/flows/` folder that define how datasets are produced from sources through a sequence of typed steps.

#### Scenario: Flow declaration with steps
- **WHEN** a flow YAML file inside `dataspec/flows/` contains a flow definition with name `users_pipeline`, input references, a sequence of steps, and output dataset references
- **THEN** the system SHALL store the flow definition with its steps and references

#### Scenario: Flow in correct location
- **WHEN** flow YAML files are located in `dataspec/flows/`
- **THEN** the system SHALL scan and parse all flow files

## ADDED Requirements

### Requirement: Flow file location enforcement
The system SHALL enforce that flow definition files are located in the `dataspec/flows/` folder.

#### Scenario: Flows in incorrect location
- **WHEN** flow YAML files are found outside `dataspec/flows/` (e.g., in root `flows/` folder)
- **THEN** the system SHALL NOT parse them and SHALL emit an error indicating the correct location

#### Scenario: Legacy flows folder at root
- **WHEN** a `flows/` folder exists at the workspace root (outside `dataspec/`)
- **THEN** the system SHALL ignore it and emit a warning suggesting migration