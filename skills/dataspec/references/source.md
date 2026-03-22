# Source Definitions

Sources declare external data producers — systems that originate data for the platform. They describe WHAT data exists and WHERE, without storing connection credentials (those are deployment-time concerns).

## Common Structure

```yaml
name: <string> # Unique source identifier
type: <source-type> # database | api | file_system | streaming | saas
entities: # Array of data entities in this source
  - name: <string> # Entity name (used in flow extract steps)
    description: <string> # What this entity contains
    location: <string> # Where to find it (type-specific)
    contract: # Schema reference
      name: <string> # Contract name
      version: <semver> # Contract version
    metadata: # Optional entity-level metadata
      <key>: <value>
metadata: # Optional source-level metadata
  description: <string>
  owner: <string>
  tags: [<string>, ...]
```

## Source Types

### database

For relational databases (PostgreSQL, MySQL, etc.) and NoSQL databases.

```yaml
name: production_db
type: database
entities:
  - name: users
    location: public.users # schema.table format
    description: User accounts
    contract:
      name: users_raw_schema
      version: '1.0.0'
    metadata:
      primary_key: user_id
      estimated_rows: 5000000
```

**Entity fields:**

- `location` (required): Physical location — typically `schema.table`
- `contract` (required): Schema reference

### api

For REST or gRPC APIs.

```yaml
name: payment_gateway
type: api
protocol: https
baseUrl: api.payments.example.com
entities:
  - name: transactions
    location: /api/v1/transactions # URL path
    method: GET # HTTP method
    contract:
      name: payment_transactions_schema
      version: '1.0.0'
```

**Source-level fields:**

- `protocol` (required): `http`, `https`, or `grpc`
- `baseUrl` (required): API host

**Entity fields:**

- `location` (required): Endpoint path
- `method` (required): HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`) or gRPC method
- `contract` (required): Schema reference

### file_system

For files in local filesystems, S3, GCS, etc.

```yaml
name: data_warehouse_exports
type: file_system
entities:
  - name: daily_sales
    location: s3://exports/daily-sales/*.parquet
    format: parquet
    partition_by: # Optional partition columns
      - year
      - month
    contract:
      name: daily_sales_schema
      version: '1.0.0'
```

**Entity fields:**

- `location` (required): File path or glob pattern
- `format` (required): `parquet`, `csv`, `json`, `avro`, `orc`, `delta`, `fixed-width`
- `contract` (required): Schema reference
- `partition_by` (optional): Array of partition column names

### streaming

For event streaming platforms (Kafka, WebSocket, MQTT, AMQP).

```yaml
name: kafka_events
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: user_events
    location: user-events # Topic/queue name
    contract:
      name: user_events_stream_schema
      version: '1.0.0'
    metadata:
      partitions: 12
      replication_factor: 3
      retention_ms: 604800000
```

**Source-level fields:**

- `protocol` (required): `kafka`, `ws`, `wss`, `mqtt`, `amqp`
- `baseUrl` (required): Broker or server address

**Entity fields:**

- `location` (required): Topic, queue, or channel name
- `contract` (required): Schema reference

### saas

For SaaS platform connectors (Salesforce, HubSpot, Stripe, etc.).

```yaml
name: salesforce_crm
type: saas
provider: salesforce
entities:
  - name: accounts
    location: Account # SaaS object type
    contract:
      name: salesforce_accounts_schema
      version: '1.0.0'
    metadata:
      object_type: Account
      sync_frequency: hourly
```

**Source-level fields:**

- `provider` (required): SaaS provider name

**Entity fields:**

- `contract` (required): Schema reference
- `location` (optional): Provider-specific resource identifier

## Validation Rules

- `name` and `type` are required
- `type` must be one of: `database`, `api`, `file_system`, `streaming`, `saas`
- `entities` array must have at least one entry
- Each entity must have a `name` and `contract`
- Type-specific required fields must be present (see above)
- `contract.name` must reference an existing contract in the workspace
- `contract.version` must be valid semver
