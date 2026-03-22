# Platform Configuration

The platform file (`dataspec/platform.yaml`) defines the global infrastructure: storage backends and analytics engines available to the platform.

## Structure

```yaml
platform:
  name: <string> # Platform name
  version: <semver> # Platform version (e.g., "1.0.0")
  description: <string> # Human-readable description
  owner: <string> # Team or person responsible

storage: # Array of storage backends (required)
  - name: <string> # Unique identifier (referenced by datasets)
    type: <storage-type> # s3 | postgresql | clickhouse
    connection: <string> # Connection string or URI
    options: # Optional backend-specific settings
      <key>: <value>

engines: # Array of analytics engines (required)
  - name: <string> # Unique identifier (referenced by flow transform steps)
    type: <engine-type> # spark | duckdb | dbt | python
    version: <string> # Optional version constraint (e.g., ">=1.5.0")
    config: # Optional engine-specific settings
      <key>: <value>

defaults: # Optional default settings
  storage: <string> # Default storage backend name
  engine: <string> # Default engine name
```

## Storage Types

| Type         | Description                    | Connection format           |
| ------------ | ------------------------------ | --------------------------- |
| `s3`         | Amazon S3 object storage       | `s3://bucket-name/`         |
| `postgresql` | PostgreSQL relational database | `postgresql://host:port/db` |
| `clickhouse` | ClickHouse columnar database   | `clickhouse://host:port/db` |

## Engine Types

| Type     | Description                         | Common config keys                                   |
| -------- | ----------------------------------- | ---------------------------------------------------- |
| `spark`  | Apache Spark distributed processing | `executor_memory`, `executor_cores`, `driver_memory` |
| `duckdb` | Embedded analytics database         | `memory_limit`, `temp_directory`                     |
| `dbt`    | Data build tool for transformations | `threads`, `target`                                  |
| `python` | Python script execution             | `python_version`, `requirements`                     |

## Example

```yaml
platform:
  name: my-data-platform
  version: '1.0.0'
  description: 'Analytics platform for retail operations'
  owner: data-platform-team

storage:
  - name: s3-data-lake
    type: s3
    connection: 's3://data-lake-bucket/'
    options:
      region: us-east-1
      encryption: AES256

  - name: postgresql-warehouse
    type: postgresql
    connection: 'postgresql://warehouse:5432/analytics'
    options:
      ssl_mode: require
      pool_size: 20

engines:
  - name: dbt-transforms
    type: dbt
    version: '>=1.5.0'
    config:
      threads: 8
      target: production

  - name: spark-cluster
    type: spark
    version: '>=3.4.0'
    config:
      executor_memory: 4g
      executor_cores: 4

defaults:
  storage: s3-data-lake
  engine: dbt-transforms
```

## Validation Rules

- `name` is required in the `platform` block
- At least one storage backend must be defined
- At least one engine must be defined
- Storage `type` must be one of: `s3`, `postgresql`, `clickhouse`
- Engine `type` must be one of: `spark`, `duckdb`, `dbt`, `python`
- `defaults.storage` must reference a declared storage backend name
- `defaults.engine` must reference a declared engine name
