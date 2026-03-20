# dataset-definition Specification

## Purpose
TBD - created by archiving change dataspec-core. Update Purpose after archive.
## Requirements
### Requirement: Declare logical datasets

The system SHALL support declaring logical data units with unique names and storage configurations.

#### Scenario: Dataset declaration with contract
- **WHEN** a dataset declaration includes name `users_raw`, storage configuration, and optional contract reference
- **THEN** the system SHALL store the dataset definition without requiring or validating a layer property

#### Scenario: Dataset declaration with basic fields
- **WHEN** a dataset declaration contains only `name` and `storage` fields
- **THEN** the system SHALL accept it as a valid dataset definition

### Requirement: Storage backend configuration

The system SHALL support configuring storage backends per dataset, including type, format, and location metadata.

#### Scenario: S3 storage configuration
- **WHEN** a dataset declares storage with type `s3`, bucket name, path prefix, and format `parquet`
- **THEN** the system SHALL store the storage configuration as part of the dataset definition

### Requirement: Dataset name uniqueness

The system SHALL enforce that all dataset names within the workspace are unique.

#### Scenario: Duplicate dataset name
- **WHEN** two dataset YAML files define datasets with the same name
- **THEN** the system SHALL treat this as an invalid configuration

### Requirement: Contract association

The system SHALL support optional association of a contract with a dataset to specify the expected schema.

#### Scenario: Dataset with contract reference
- **WHEN** a dataset declaration includes a `contract` field referencing a contract name and version
- **THEN** the system SHALL store the contract reference as part of the dataset definition

### Requirement: Dataset metadata

The system SHALL support optional descriptive metadata for datasets including description and tags.

#### Scenario: Dataset with metadata
- **WHEN** a dataset declaration includes a `description` field and/or `tags` list
- **THEN** the system SHALL store this metadata as part of the dataset definition

