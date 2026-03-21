## REMOVED Requirements

### Requirement: Source entity pattern field

**BREAKING**: Removed without replacement. Use `location` field.
**Migration**: Move file patterns to `location: s3://bucket/path/*.csv"`

### Requirement: Source entity pathParams field

**BREAKING**: Removed without replacement.
**Migration**: Use path templates in `location: /api/v1/users/{id}"`

### Requirement: Source entity queryParams field

**BREAKING**: Removed without replacement.
**Migration**: Implementation tools handle query parameters.

### Requirement: Source entity method field at source level

**BREAKING**: Moved to entity level for API sources only.
**Migration**: Move `method` to each entity for API sources.

## MODIFIED Requirements

### Requirement: Source type values

**BREAKING**: Valid source types are `database`, `api`, `file_system`, `streaming`, `saas`. The value `saas` replaces any previous SaaS handling. The new type `streaming` is added.

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
