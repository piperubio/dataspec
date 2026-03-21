## Context

The DSL currently separates sources and contracts semantically—sources declare external systems while contracts define schemas. However, external systems DO have schemas, and users need to document expected source structures for drift detection, lineage, and documentation purposes.

Additionally, source entities use fragmented properties for location (`pattern`, `method`, `pathParams`, `queryParams`) that don't properly capture type-specific requirements.

**This is a breaking change**: Complete restructure of source entity fields with type-specific requirements. No backward compatibility maintained.

## Goals / Non-Goals

**Goals:**

- Require source entities to reference contracts (matching dataset pattern)
- Unify location definition with type-specific semantic validation
- Add proper support for streaming sources
- Separate type-specific fields appropriately

**Non-Goals:**

- Backward compatibility with existing source definitions
- Gradual migration path (clean break)
- Streaming implementation details (kafka topics, partitions, etc.)

## Decisions

### Decision 1: Required `contract` field on all source entities

All source entities must declare a contract reference. Consistency with dataset pattern.

### Decision 2: Type-specific source structure

Each source type has specific required fields:

| Type          | Source Level          | Entity Level (Required)          |
| ------------- | --------------------- | -------------------------------- |
| `database`    | —                     | `location`, `contract`           |
| `api`         | `protocol`, `baseUrl` | `location`, `method`, `contract` |
| `file_system` | —                     | `location`, `format`, `contract` |
| `streaming`   | `protocol`, `baseUrl` | `location`\*, `contract`         |
| `saas`        | `provider`            | `contract`                       |

\*`location` optional for streaming (depends on protocol)

### Decision 3: New `streaming` source type

WebSocket, Kafka, MQTT, AMQP sources are distinct from request-response APIs:

- No `method` (continuous flow, not discrete requests)
- `protocol` required at source level
- `location` is topic/path depending on protocol

### Decision 4: `method` semantics by protocol

For `api` type:

- `http`/`https`: `method` = HTTP verb (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
- `grpc`: `method` = RPC method name from proto definition (`GetUser`, `CreateOrder`)

### Decision 5: `format` and `partition_by` for file_system

- Files need explicit format (extension in location is hint, not reliable)
- `partition_by` optional for partitioned data lakes

### Decision 6: Semantic location validation

Location format validated by source type:

- `database`: Logical identifier (`public.users`), no `/`, `://`, `?`
- `api`: URL path (starts with `/`)
- `file_system`: File path or storage URI (`/data/*.csv`, `s3://bucket/path`)
- `streaming`: Topic/path (protocol-specific)
- `saas`: Provider-specific format, optional

## Type Definitions

### Database

```yaml
type: database
entities:
  - name: users
    location: public.users
    contract: { name: users_schema, version: '1.0.0' }
```

### API (HTTP/gRPC)

```yaml
type: api
protocol: http | https | grpc
baseUrl: api.example.com
entities:
  - name: users
    location: /api/v1/users/{id} # path for HTTP, service for gRPC
    method: GET | GetUser # HTTP verb or RPC method
    contract: { name: users_schema, version: '1.0.0' }
```

### File System

```yaml
type: file_system
entities:
  - name: users
    location: s3://bucket/path/*.parquet
    format: parquet | csv | json | avro | fixed-width
    partition_by: [date, region] # optional
    contract: { name: users_schema, version: '1.0.0' }
```

### Streaming

```yaml
type: streaming
protocol: ws | wss | kafka | mqtt | amqp
baseUrl: events.example.com
entities:
  - name: events
    location: /ws/events # topic/path
    contract: { name: events_schema, version: '1.0.0' }
```

### SaaS

```yaml
type: saas
provider: salesforce | hubspot | stripe | ...
entities:
  - name: accounts
    location: Account # optional
    contract: { name: accounts_schema, version: '1.0.0' }
```

## Risks / Trade-offs

- **Risk:** Breaking change requires complete migration
  - **Mitigation:** Clear error messages, straightforward per-type migration

- **Risk:** Streaming type may need refinement for specific protocols
  - **Mitigation:** Minimal fields now, extend as needed
