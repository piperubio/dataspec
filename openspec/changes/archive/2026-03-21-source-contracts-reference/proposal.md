## Why

Sources represent external systems with defined schemas, but the DSL currently prevents expressing this relationship. Users work around this limitation by creating "raw contracts" with manual `source` metadata—a pattern visible in the examples that reveals the missing feature. This creates inconsistency, impedes tooling for schema drift detection, and makes source-to-destination lineage harder to trace.

Additionally, source entities use fragmented properties for location and type-specific metadata. This redesign unifies location definition while properly handling type-specific requirements.

**BREAKING CHANGE**: Source entities will now require `contract` and type-specific fields. New `streaming` source type added. Type-specific properties removed in favor of structured fields.

## What Changes

- **BREAKING**: Require `contract` field on all source entities
- **BREAKING**: Require `location` field on most source entities (except some SaaS)
- **BREAKING**: Remove `pattern`, `method`, `pathParams`, `queryParams` (replaced by structured fields)
- **NEW**: Add `streaming` source type (ws/wss/kafka/mqtt/amqp)
- **NEW**: Add source-level fields: `protocol`, `baseUrl` (api/streaming), `provider` (saas)
- **NEW**: Add entity-level fields: `method` (api), `format` (file_system), `partition_by` (file_system, optional)
- Semantic validation for `location` based on source type

## Capabilities

### New Capabilities

- `source-schema-reference`: Enables source entities to reference contracts documenting their expected schema
- `streaming-source-type`: New source type for streaming protocols (WebSocket, Kafka, MQTT, AMQP)

### Modified Capabilities

- `source-management`: **BREAKING** - Restructured with type-specific fields, new streaming type, unified location

## Impact

- **Sources**: Complete restructure of entity fields, new type-specific requirements
- **Types**: New `streaming` source type added
- **Validation**: Type-specific location validation, required fields per type
- **Examples**: All example sources must be updated