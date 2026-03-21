# Dataset Definitions

Datasets represent logical collections of data at various stages of the pipeline (raw, refined, analytics). They define WHERE data is stored and optionally link to a CONTRACT that validates its schema.

## Structure

```yaml
name: <string>              # Dataset identifier
storage:                    # Storage configuration (required)
  backend: <string>         # Reference to a platform storage backend name
  format: <string>          # Data format: parquet, csv, json, delta, etc.
  location: <string>        # Storage path (type-specific: s3://, /local/path, etc.)
  config:                   # Optional format-specific settings
    <key>: <value>
contract:                   # Optional schema reference
  name: <string>            # Contract name
  version: <semver>         # Contract version
metadata:                   # Optional metadata
  description: <string>
  owner: <string>
  tags: [<string>, ...]
  refresh_frequency: <string>  # How often data is updated
  retention_days: <number>     # How long data is kept
```

## Storage Configuration

The `storage` block connects the dataset to a physical location:

- **backend**: Must match a storage backend name defined in `platform.yaml`
- **format**: The file format used to store the data
- **location**: The path where data lives (format depends on backend type)

### Common Formats

| Format | Best for | Notes |
|--------|----------|-------|
| `parquet` | Columnar analytics, raw layer | Efficient compression, schema embedded |
| `delta` | Refined layer, ACID transactions | Supports time travel, upserts |
| `csv` | Simple exports, interchange | No schema, no type safety |
| `json` | Semi-structured data | Flexible but less efficient |
| `avro` | Streaming, schema evolution | Row-based, schema embedded |
| `orc` | Hive-based analytics | Columnar, good compression |

## Layer Convention

Datasets typically follow a medallion architecture:

| Layer | Prefix | Format | Purpose |
|-------|--------|--------|---------|
| **Raw** | `*_raw` | parquet | Ingested data, as-is from source |
| **Refined** | `*_refined` | delta | Cleaned, validated, deduplicated |
| **Analytics** | `*_analytics`, `*_dashboard` | delta/parquet | Business-ready aggregates |

This is a convention, not enforced — but following it makes the platform easier to understand.

## Examples

### Raw Dataset

```yaml
name: users_raw
storage:
  backend: s3-data-lake
  format: parquet
  location: s3://data-lake/raw/users/

contract:
  name: users_raw_schema
  version: '1.0.0'

metadata:
  description: Raw user data ingested from production database
  owner: data-engineering-team
  tags:
    - raw
    - users
    - pii
  refresh_frequency: hourly
  retention_days: 90
```

### Refined Dataset

```yaml
name: users_refined
storage:
  backend: s3-data-lake
  format: delta
  location: s3://data-lake/refined/users/

contract:
  name: user_contract
  version: '1.0.0'

metadata:
  description: Cleaned and validated user data with deduplication
  owner: data-platform-team
  tags:
    - refined
    - users
    - silver-layer
  refresh_frequency: hourly
  quality_checks:
    - unique_user_id
    - valid_email_format
```

### Analytics Dataset

```yaml
name: customer_analytics
storage:
  backend: clickhouse-analytics
  format: parquet
  location: /analytics/customers/

contract:
  name: customer_analytics_contract
  version: '1.0.0'

metadata:
  description: Customer analytics for business dashboards
  owner: analytics-team
  tags:
    - analytics
    - customers
    - serving-layer
```

## Validation Rules

- `name` and `storage` are required
- `storage.backend` must reference a storage backend defined in `platform.yaml`
- `storage.format` is required
- `storage.location` is required
- `contract.name` must reference an existing contract (if contract is specified)
- `contract.version` must be valid semver
