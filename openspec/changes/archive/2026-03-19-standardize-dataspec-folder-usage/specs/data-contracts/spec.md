# data-contracts Specification (Delta)

## MODIFIED Requirements

### Requirement: Declare data contracts with schemas

The system SHALL support declaring versioned data contracts in YAML files located inside the `dataspec/contracts/` folder hierarchy with field definitions, data types, and constraints.

#### Scenario: Contract with field definitions

- **WHEN** a contract YAML file inside `dataspec/contracts/` contains a contract definition with name `users_contract`, version `1.0`, and fields including `user_id` (type: uuid), `email` (type: string, constraints: unique, not_null)
- **THEN** the system SHALL store the contract definition with its fields, types, and constraints

#### Scenario: Contract in correct location

- **WHEN** contract YAML files are located in `dataspec/contracts/` or its subdirectories (e.g., `dataspec/contracts/refined/`)
- **THEN** the system SHALL scan and parse all contract files recursively

## ADDED Requirements

### Requirement: Contract file location enforcement

The system SHALL enforce that contract definition files are located in the `dataspec/contracts/` folder or its subdirectories.

#### Scenario: Contracts in incorrect location

- **WHEN** contract YAML files are found outside `dataspec/contracts/` (e.g., in root `contracts/` folder)
- **THEN** the system SHALL NOT parse them and SHALL emit an error indicating the correct location

#### Scenario: Legacy contracts folder at root

- **WHEN** a `contracts/` folder exists at the workspace root (outside `dataspec/`)
- **THEN** the system SHALL ignore it and emit a warning suggesting migration
