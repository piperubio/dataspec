# platform-definition Specification

## Purpose
TBD - created by archiving change dataspec-core. Update Purpose after archive.
## Requirements
### Requirement: Define global platform architecture
The system SHALL provide a mechanism to declare the global data platform architecture including storage backends, analytics engines, and platform-level configurations in a single YAML file.

#### Scenario: Platform configuration file exists
- **WHEN** a file named `platform.yaml` exists in the workspace root
- **THEN** the system SHALL parse the file and extract platform-wide configurations

### Requirement: Declare storage backends
The system SHALL support declaring multiple storage backends with their types and metadata.

#### Scenario: Storage backend declaration
- **WHEN** a platform.yaml file contains a `storage` section with backend definitions including type and name
- **THEN** the system SHALL store these backend definitions for reference by datasets

### Requirement: Declare analytics engines
The system SHALL support declaring analytics engines (Spark, DuckDB, dbt, etc.) with their version requirements and default configurations.

#### Scenario: Analytics engine declaration
- **WHEN** a platform.yaml file contains an `engines` section with engine definitions including name, type, and version constraints
- **THEN** the system SHALL store these engine definitions for reference by transform steps

### Requirement: Platform-wide defaults
The system SHALL support setting default values for common properties that apply across all resources in the platform.

#### Scenario: Default storage backend
- **WHEN** a platform.yaml defines a `defaults.storage` property pointing to a declared backend
- **THEN** all datasets without explicit storage configuration SHALL inherit this default backend reference

### Requirement: Unique backend names
The system SHALL enforce that all storage backend names within the platform configuration are unique.

#### Scenario: Duplicate backend name
- **WHEN** a platform.yaml file defines two storage backends with the same name
- **THEN** the system SHALL treat this as an invalid configuration

### Requirement: Unique engine names
The system SHALL enforce that all analytics engine names within the platform configuration are unique.

#### Scenario: Duplicate engine name
- **WHEN** a platform.yaml file defines two analytics engines with the same name
- **THEN** the system SHALL treat this as an invalid configuration

