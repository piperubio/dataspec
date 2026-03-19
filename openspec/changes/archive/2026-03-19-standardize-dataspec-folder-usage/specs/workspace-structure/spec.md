# workspace-structure Specification (Delta)

## ADDED Requirements

### Requirement: Mandatory dataspec container folder
The system SHALL require all dataspec resources to be located within a `dataspec/` folder at the workspace root.

#### Scenario: Valid workspace structure
- **WHEN** a workspace contains a `dataspec/` folder at its root with `platform.yaml`, `sources/`, `datasets/`, `contracts/`, and `flows/` inside
- **THEN** the system SHALL accept the workspace structure as valid

#### Scenario: Missing dataspec folder
- **WHEN** a workspace does not contain a `dataspec/` folder at its root
- **THEN** the system SHALL reject the workspace with an error message indicating the required folder structure

#### Scenario: Resources outside dataspec folder
- **WHEN** resources are found outside the `dataspec/` folder (e.g., `sources/` directly in workspace root)
- **THEN** the system SHALL reject the workspace with an error message guiding the user to move resources into `dataspec/`

### Requirement: Dataspec folder contents
The system SHALL recognize the following subdirectories within `dataspec/`: `sources/`, `datasets/`, `contracts/`, and `flows/`.

#### Scenario: Complete folder structure
- **WHEN** the `dataspec/` folder contains all required subdirectories (`sources/`, `datasets/`, `contracts/`, `flows/`)
- **THEN** the system SHALL scan all subdirectories for resources

#### Scenario: Partial folder structure
- **WHEN** the `dataspec/` folder is missing some subdirectories
- **THEN** the system SHALL accept the structure and scan only existing directories

#### Scenario: Platform configuration location
- **WHEN** `platform.yaml` exists inside the `dataspec/` folder
- **THEN** the system SHALL parse it as the platform configuration

### Requirement: Workspace root identification
The system SHALL identify the workspace root as the parent directory of the `dataspec/` folder.

#### Scenario: Single dataspec folder
- **WHEN** a workspace contains exactly one `dataspec/` folder
- **THEN** the system SHALL use its parent directory as the workspace root

#### Scenario: Multiple dataspec folders
- **WHEN** a workspace contains multiple `dataspec/` folders at different levels
- **THEN** the system SHALL use the highest-level `dataspec/` folder and its parent as the workspace root