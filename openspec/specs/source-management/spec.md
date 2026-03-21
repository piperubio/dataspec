# source-management Specification

## Purpose

TBD - created by archiving change dataspec-core. Update Purpose after archive.

## Requirements

### Requirement: Declare external data sources

The system SHALL support declaring external data producers (databases, APIs, file systems, SaaS applications) with their type and available entities. Connection details and credentials are NOT included — dataspec-core is definitions-only.

#### Scenario: Database source declaration

- **WHEN** a source YAML file contains a source definition with type `database` and entity mappings
- **THEN** the system SHALL store the source definition with its type and entities

#### Scenario: API source declaration

- **WHEN** a source YAML file contains a source definition with type `api` and endpoint entities
- **THEN** the system SHALL store the source definition with its type and entities

#### Scenario: File system source declaration

- **WHEN** a source YAML file contains a source definition with type `file_system` and file pattern entities
- **THEN** the system SHALL store the source definition with its type and entities

### Requirement: Source entity declarations

The system SHALL support declaring entities (tables, collections, endpoints, files) available within each source for reference by flows.

#### Scenario: Entity mapping in database source

- **WHEN** a source definition includes an `entities` section listing available tables or collections
- **THEN** the system SHALL store these entity definitions for reference by extract steps in flows

#### Scenario: Entity mapping in API source

- **WHEN** a source definition includes an `entities` section listing available endpoints
- **THEN** the system SHALL store these entity definitions for reference by extract steps in flows

### Requirement: Source name uniqueness

The system SHALL enforce that all source names within the workspace are unique.

#### Scenario: Duplicate source name

- **WHEN** two source YAML files define sources with the same name
- **THEN** the system SHALL treat this as an invalid configuration

### Requirement: Source type values

**BREAKING**: Valid source types are `database`, `api`, `file_system`, `streaming`, `saas`. The value `saas` replaces any previous SaaS handling. The new type `streaming` is added.

#### Scenario: Invalid source type

- **WHEN** a source declaration contains a type value not in the allowed set
- **THEN** the system SHALL treat this as an invalid configuration

### Requirement: Source-level fields by type

**BREAKING**: Each source type has specific required fields at source level:

| Type          | Required Fields                       |
| ------------- | ------------------------------------- |
| `database`    | `name`, `type`                        |
| `api`         | `name`, `type`, `protocol`, `baseUrl` |
| `file_system` | `name`, `type`                        |
| `streaming`   | `name`, `type`, `protocol`, `baseUrl` |
| `saas`        | `name`, `type`, `provider`            |

### Requirement: Entity-level fields by type

**BREAKING**: Each source type has specific required fields at entity level:

| Type          | Required Fields                          | Optional Fields |
| ------------- | ---------------------------------------- | --------------- |
| `database`    | `name`, `location`, `contract`           | —               |
| `api`         | `name`, `location`, `method`, `contract` | —               |
| `file_system` | `name`, `location`, `format`, `contract` | `partition_by`  |
| `streaming`   | `name`, `location`, `contract`           | —               |
| `saas`        | `name`, `contract`                       | `location`      |

### Requirement: Field exclusivity by type

**BREAKING**: Fields are exclusive to specific source types. Cross-type usage is invalid.

| Field          | Allowed Types           |
| -------------- | ----------------------- |
| `method`       | `api` only              |
| `format`       | `file_system` only      |
| `partition_by` | `file_system` only      |
| `protocol`     | `api`, `streaming` only |
| `baseUrl`      | `api`, `streaming` only |
| `provider`     | `saas` only             |

### Requirement: Strict validation error format

All validation errors MUST include:

1. Error code
2. Human-readable message
3. File and line location
4. Field name that failed validation

### Requirement: Source metadata

The system SHALL support optional descriptive metadata for sources including description and tags.

#### Scenario: Source with metadata

- **WHEN** a source declaration includes a `description` field and/or `tags` list
- **THEN** the system SHALL store this metadata as part of the source definition
