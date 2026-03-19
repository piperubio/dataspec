# validation-engine Specification (Delta)

## ADDED Requirements

### Requirement: Validate workspace structure
The system SHALL validate that the workspace follows the required `dataspec/` folder structure before processing resources.

#### Scenario: Valid workspace structure
- **WHEN** a workspace contains a `dataspec/` folder with required resources inside
- **THEN** the validation SHALL pass and proceed with resource validation

#### Scenario: Missing dataspec folder
- **WHEN** a workspace does not contain a `dataspec/` folder
- **THEN** the validation SHALL fail with an error message: "Workspace must contain a 'dataspec/' folder. Run 'dataspec init' to create a new project."

#### Scenario: Resources outside dataspec folder
- **WHEN** resources are found outside the `dataspec/` folder (e.g., `platform.yaml` at root, `sources/` at root)
- **THEN** the validation SHALL fail with an error listing the misplaced resources: "Found resources outside 'dataspec/' folder. Move the following into 'dataspec/': [list of files/folders]"

### Requirement: Detect legacy workspace structure
The system SHALL detect and warn about legacy workspace structures where resources are at the root instead of in `dataspec/`.

#### Scenario: Legacy structure detection
- **WHEN** a workspace has `platform.yaml` at root and/or `sources/`, `datasets/`, `contracts/`, `flows/` directories at root
- **THEN** the system SHALL emit a warning: "Legacy workspace structure detected. Please move resources into 'dataspec/' folder."

#### Scenario: Mixed structure detection
- **WHEN** a workspace has some resources in `dataspec/` and some at root level
- **THEN** the system SHALL emit an error listing the misplaced resources that need to be moved