## 1. Core Types

- [x] 1.1 Add `streaming` to `SourceType` enum: `database`, `api`, `file_system`, `streaming`, `saas`
- [x] 1.2 Add `SourceType` literal type for strict validation
- [x] 1.3 Add `contract` field to `SourceEntity` interface (required: `{ name: string; version: string }`)
- [x] 1.4 Add `location` field to `SourceEntity` interface (string)
- [x] 1.5 Add `method` field to `SourceEntity` interface (string, api only)
- [x] 1.6 Add `format` field to `SourceEntity` interface (string, file_system only)
- [x] 1.7 Add `partition_by` field to `SourceEntity` interface (string[], file_system only)
- [x] 1.8 Remove `pattern` field from `SourceEntity` interface
- [x] 1.9 Remove `pathParams` field from `SourceEntity` interface
- [x] 1.10 Remove `queryParams` field from `SourceEntity` interface
- [x] 1.11 Add `protocol` field to `Source` interface (string)
- [x] 1.12 Add `baseUrl` field to `Source` interface (string)
- [x] 1.13 Add `provider` field to `Source` interface (string)
- [x] 1.14 Create `SourceEntityDatabase`, `SourceEntityApi`, `SourceEntityFileSystem`, `SourceEntityStreaming`, `SourceEntitySaas` interfaces with type-specific fields
- [x] 1.15 Create discriminated union type for `SourceEntity` based on source type

## 2. Parser Updates

- [x] 2.1 Parse `streaming` source type
- [x] 2.2 Parse `protocol` field at source level (required for api, streaming)
- [x] 2.3 Parse `baseUrl` field at source level (required for api, streaming)
- [x] 2.4 Parse `provider` field at source level (required for saas)
- [x] 2.5 Parse `contract` field from source entity (required)
- [x] 2.6 Parse `location` field from source entity
- [x] 2.7 Parse `method` field from source entity
- [x] 2.8 Parse `format` field from source entity
- [x] 2.9 Parse `partition_by` field from source entity (optional)
- [x] 2.10 Reject deprecated fields with clear error messages

## 3. Strict Type Validation

- [x] 3.1 Validate source type is one of: `database`, `api`, `file_system`, `streaming`, `saas`
- [x] 3.2 Validate `protocol` required for `api` and `streaming` sources
- [x] 3.3 Validate `protocol` NOT allowed for `database`, `file_system`, `saas` sources
- [x] 3.4 Validate `protocol` values for `api`: `http`, `https`, `grpc`
- [x] 3.5 Validate `protocol` values for `streaming`: `ws`, `wss`, `kafka`, `mqtt`, `amqp`
- [x] 3.6 Validate `baseUrl` required for `api` and `streaming` sources
- [x] 3.7 Validate `baseUrl` NOT allowed for `database`, `file_system`, `saas` sources
- [x] 3.8 Validate `provider` required for `saas` sources
- [x] 3.9 Validate `provider` NOT allowed for `database`, `api`, `file_system`, `streaming` sources

## 4. Strict Entity Validation by Type

### Database Entities
- [x] 4.1 Validate `location` required
- [x] 4.2 Validate `contract` required
- [x] 4.3 Validate `location` format: `^[a-zA-Z_][a-zA-Z0-9_.]*$` (no `/`, `://`, `?`)
- [x] 4.4 Validate `method` NOT allowed
- [x] 4.5 Validate `format` NOT allowed
- [x] 4.6 Validate `partition_by` NOT allowed

### API Entities
- [x] 4.7 Validate `location` required
- [x] 4.8 Validate `contract` required
- [x] 4.9 Validate `method` required
- [x] 4.10 Validate `location` format: starts with `/`
- [x] 4.11 For `http`/`https`: validate `method` in `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- [x] 4.12 For `grpc`: accept any `method` value
- [x] 4.13 Validate `format` NOT allowed
- [x] 4.14 Validate `partition_by` NOT allowed

### File System Entities
- [x] 4.15 Validate `location` required
- [x] 4.16 Validate `contract` required
- [x] 4.17 Validate `format` required
- [x] 4.18 Validate `format` in: `parquet`, `csv`, `json`, `avro`, `fixed-width`, `orc`, `delta`
- [x] 4.19 Validate `location` format: starts with `/`, `.`, or storage URI (`s3://`, `gs://`, etc.)
- [x] 4.20 Validate `partition_by` optional array of strings
- [x] 4.21 Validate `method` NOT allowed

### Streaming Entities
- [x] 4.22 Validate `contract` required
- [x] 4.23 Validate `location` required (topic/queue/channel address)
- [x] 4.24 Validate `method` NOT allowed (strict: streaming uses continuous flow)
- [x] 4.25 Validate `format` NOT allowed
- [x] 4.26 Validate `partition_by` NOT allowed

### SaaS Entities
- [x] 4.27 Validate `contract` required
- [x] 4.28 Validate `location` optional
- [x] 4.29 Validate `method` NOT allowed
- [x] 4.30 Validate `format` NOT allowed
- [x] 4.31 Validate `partition_by` NOT allowed

## 5. Deprecated Field Validation

- [x] 5.1 Reject `pattern` field with migration message: "Use 'location' instead"
- [x] 5.2 Reject `pathParams` field with migration message: "Use path templates in 'location'"
- [x] 5.3 Reject `queryParams` field with migration message: "Implementation tools handle query parameters"
- [x] 5.4 Reject `method` at source level with migration message: "Move 'method' to entity level for API sources"

## 6. Contract Reference Validation

- [x] 6.1 Validate contract name exists in workspace
- [x] 6.2 Validate contract version exists for named contract

## 7. Validation Error Codes

- [x] 7.1 `INVALID_SOURCE_TYPE` - type not in allowed values
- [x] 7.2 `MISSING_SOURCE_PROTOCOL` - protocol required for api/streaming
- [x] 7.3 `MISSING_SOURCE_BASEURL` - baseUrl required for api/streaming
- [x] 7.4 `MISSING_SOURCE_PROVIDER` - provider required for saas
- [x] 7.5 `INVALID_SOURCE_PROTOCOL` - protocol not valid for type
- [x] 7.6 `FORBIDDEN_FIELD_ON_SOURCE` - field not allowed for source type
- [x] 7.7 `MISSING_ENTITY_LOCATION` - location required
- [x] 7.8 `MISSING_ENTITY_CONTRACT` - contract required
- [x] 7.9 `MISSING_ENTITY_METHOD` - method required for api entities
- [x] 7.10 `MISSING_ENTITY_FORMAT` - format required for file_system entities
- [x] 7.11 `INVALID_LOCATION_FORMAT` - location format invalid for type
- [x] 7.12 `INVALID_HTTP_METHOD` - method not in allowed HTTP verbs
- [x] 7.13 `INVALID_FORMAT_VALUE` - format not in allowed values
- [x] 7.14 `FORBIDDEN_FIELD_ON_ENTITY` - field not allowed for entity type
- [x] 7.15 `DEPRECATED_FIELD` - deprecated field used
- [x] 7.16 `UNRESOLVED_CONTRACT` - contract not found
- [x] 7.17 `UNRESOLVED_CONTRACT_VERSION` - contract version not found

## 8. Tests

### Unit Tests - Types
- [x] 8.1 Test SourceType enum values
- [x] 8.2 Test discriminated union for SourceEntity

### Unit Tests - Database
- [x] 8.3 Test valid database source parsing
- [x] 8.4 Test database location validation (valid: `public.users`, `analytics.orders`)
- [x] 8.5 Test database location rejection (invalid: `/api/users`, `s3://bucket`)
- [x] 8.6 Test database entity forbidden fields (`method`, `format`, `partition_by`)

### Unit Tests - API
- [x] 8.7 Test valid API source parsing (http, https, grpc)
- [x] 8.8 Test API source requires `protocol` and `baseUrl`
- [x] 8.9 Test API location validation (valid: `/api/v1/users`)
- [x] 8.10 Test API location rejection (invalid: `public.users`)
- [x] 8.11 Test HTTP method validation (GET, POST, PUT, DELETE, PATCH)
- [x] 8.12 Test gRPC method accepts any value
- [x] 8.13 Test API entity forbidden fields (`format`, `partition_by`)

### Unit Tests - File System
- [x] 8.14 Test valid file_system source parsing
- [x] 8.15 Test file_system location validation (valid: `/data/*.csv`, `s3://bucket/path`)
- [x] 8.16 Test file_system location rejection (invalid: `public.users`)
- [x] 8.17 Test format validation (parquet, csv, json, avro, fixed-width, orc, delta)
- [x] 8.18 Test partition_by optional field
- [x] 8.19 Test file_system entity forbidden fields (`method`)

### Unit Tests - Streaming
- [x] 8.20 Test valid streaming source parsing (ws, wss, kafka, mqtt, amqp)
- [x] 8.21 Test streaming source requires `protocol` and `baseUrl`
- [x] 8.22 Test streaming entity requires `location` (topic/channel address)
- [x] 8.23 Test streaming entity forbidden fields (`method`, `format`, `partition_by`)

### Unit Tests - SaaS
- [x] 8.24 Test valid saas source parsing
- [x] 8.25 Test saas source requires `provider`
- [x] 8.26 Test saas entity optional `location`
- [x] 8.27 Test saas entity forbidden fields (`method`, `format`, `partition_by`)

### Unit Tests - Deprecated Fields
- [x] 8.28 Test `pattern` field rejection
- [x] 8.29 Test `pathParams` field rejection
- [x] 8.30 Test `queryParams` field rejection

### Integration Tests
- [x] 8.31 Test complete database source definition
- [x] 8.32 Test complete API source definition (http, https, grpc)
- [x] 8.33 Test complete file_system source definition
- [x] 8.34 Test complete streaming source definition
- [x] 8.35 Test complete saas source definition
- [x] 8.36 Test cross-type field rejection in integration

## 9. Examples (Breaking Change Migration)

- [x] 9.1 Update `production_db.yaml` - database type with entities
- [x] 9.2 Update `analytics_db.yaml` - database type with entities
- [x] 9.3 Update `external_apis.yaml` - API type with http/https entities
- [x] 9.4 Create `grpc_api.yaml` - API type with grpc entities
- [x] 9.5 Update `external_s3_bucket.yaml` - file_system type with entities
- [x] 9.6 Create `kafka_stream.yaml` - streaming type example
- [x] 9.7 Create `websocket_stream.yaml` - streaming type example
- [x] 9.8 Create `salesforce_saas.yaml` - saas type example
- [x] 9.9 Remove all deprecated fields from all examples