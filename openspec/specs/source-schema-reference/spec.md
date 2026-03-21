# source-schema-reference Specification

## Purpose

TBD - created by syncing change source-contracts-reference. Update Purpose after archive.

## Requirements

### Requirement: Source entities must reference contracts

The system SHALL require all source entities to include a `contract` field referencing a contract that documents the entity's expected schema.

#### Scenario: Source entity with contract reference

- **WHEN** a source entity definition includes a `contract` field with `name` and `version`
- **THEN** the system SHALL store the contract reference as part of the entity definition

#### Scenario: Source entity without contract reference

- **WHEN** a source entity definition does not include a `contract` field
- **THEN** the system SHALL report a validation error: "Source entity '{name}' must declare a contract reference"

### Requirement: Source types strict validation

The system SHALL strictly validate source types and reject invalid values.

#### Scenario: Valid source types

- **WHEN** a source declaration specifies type as one of `database`, `api`, `file_system`, `streaming`, or `saas`
- **THEN** the system SHALL accept it as a valid source type

#### Scenario: Invalid source type

- **WHEN** a source declaration specifies a type not in the allowed set
- **THEN** the system SHALL report a validation error: "Invalid source type '{type}'. Must be one of: database, api, file_system, streaming, saas"

### Requirement: Database source strict structure

The system SHALL strictly validate database source structure.

#### Scenario: Valid database source

- **WHEN** a database source is declared with name and type only
- **THEN** the system SHALL accept the source definition

#### Scenario: Database source with forbidden fields

- **WHEN** a database source includes `protocol`, `baseUrl`, or `provider` fields
- **THEN** the system SHALL report a validation error: "Database source cannot have 'protocol', 'baseUrl', or 'provider' fields"

#### Scenario: Database entity valid location

- **WHEN** a database entity has `location` matching pattern `^[a-zA-Z_][a-zA-Z0-9_.]*$`
- **THEN** the system SHALL accept the location (e.g., `public.users`, `analytics.orders`)

#### Scenario: Database entity invalid location

- **WHEN** a database entity has `location` containing `/`, `://`, `?`, or starting with digit
- **THEN** the system SHALL report a validation error: "Database location must be a logical identifier (e.g., 'schema.table'), got '{location}'"

#### Scenario: Database entity with forbidden fields

- **WHEN** a database entity includes `method`, `format`, or `partition_by` fields
- **THEN** the system SHALL report a validation error: "Database entity cannot have 'method', 'format', or 'partition_by' fields"

### Requirement: API source strict structure

The system SHALL strictly validate API source structure.

#### Scenario: Valid API source

- **WHEN** an API source is declared with `name`, `type`, `protocol`, and `baseUrl`
- **THEN** the system SHALL accept the source definition

#### Scenario: API source missing protocol

- **WHEN** an API source does not include `protocol` field
- **THEN** the system SHALL report a validation error: "API source must declare 'protocol' field"

#### Scenario: API source invalid protocol

- **WHEN** an API source has `protocol` not in `http`, `https`, `grpc`
- **THEN** the system SHALL report a validation error: "Invalid API protocol '{protocol}'. Must be one of: http, https, grpc"

#### Scenario: API source missing baseUrl

- **WHEN** an API source does not include `baseUrl` field
- **THEN** the system SHALL report a validation error: "API source must declare 'baseUrl' field"

#### Scenario: API source with forbidden fields

- **WHEN** an API source includes `provider` field
- **THEN** the system SHALL report a validation error: "API source cannot have 'provider' field"

#### Scenario: API entity valid location

- **WHEN** an API entity has `location` starting with `/`
- **THEN** the system SHALL accept the location (e.g., `/api/v1/users`, `/users/{id}`)

#### Scenario: API entity invalid location

- **WHEN** an API entity has `location` not starting with `/`
- **THEN** the system SHALL report a validation error: "API location must be a URL path starting with '/', got '{location}'"

#### Scenario: API HTTP entity valid method

- **WHEN** an API entity has `protocol: http` or `https` and `method` in `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- **THEN** the system SHALL accept the method

#### Scenario: API HTTP entity invalid method

- **WHEN** an API entity has `protocol: http` or `https` and `method` not in allowed values
- **THEN** the system SHALL report a validation error: "Invalid HTTP method '{method}'. Must be one of: GET, POST, PUT, DELETE, PATCH"

#### Scenario: API gRPC entity method

- **WHEN** an API entity has `protocol: grpc` and any `method` value
- **THEN** the system SHALL accept the method (RPC method name from proto)

#### Scenario: API entity missing method

- **WHEN** an API entity does not include `method` field
- **THEN** the system SHALL report a validation error: "API entity must declare 'method' field"

#### Scenario: API entity with forbidden fields

- **WHEN** an API entity includes `format` or `partition_by` fields
- **THEN** the system SHALL report a validation error: "API entity cannot have 'format' or 'partition_by' fields"

### Requirement: File system source strict structure

The system SHALL strictly validate file system source structure.

#### Scenario: Valid file system source

- **WHEN** a file_system source is declared with name and type only
- **THEN** the system SHALL accept the source definition

#### Scenario: File system source with forbidden fields

- **WHEN** a file_system source includes `protocol`, `baseUrl`, or `provider` fields
- **THEN** the system SHALL report a validation error: "File system source cannot have 'protocol', 'baseUrl', or 'provider' fields"

#### Scenario: File system entity valid location

- **WHEN** a file_system entity has `location` matching path pattern (`^/`, `^[a-z]+://`, or starting with `.`)
- **THEN** the system SHALL accept the location (e.g., `/data/*.csv`, `s3://bucket/path`, `./relative/path`)

#### Scenario: File system entity invalid location

- **WHEN** a file_system entity has `location` matching database pattern (no `/`, no `://`)
- **THEN** the system SHALL report a validation error: "File system location must be a file path or URI, got '{location}'"

#### Scenario: File system entity valid format

- **WHEN** a file_system entity has `format` in `parquet`, `csv`, `json`, `avro`, `fixed-width`, `orc`, `delta`
- **THEN** the system SHALL accept the format

#### Scenario: File system entity missing format

- **WHEN** a file_system entity does not include `format` field
- **THEN** the system SHALL report a validation error: "File system entity must declare 'format' field"

#### Scenario: File system entity with partition_by

- **WHEN** a file_system entity includes `partition_by` as array of strings
- **THEN** the system SHALL accept the partition columns

#### Scenario: File system entity with forbidden fields

- **WHEN** a file_system entity includes `method` field
- **THEN** the system SHALL report a validation error: "File system entity cannot have 'method' field"

### Requirement: Streaming source strict structure

The system SHALL strictly validate streaming source structure.

#### Scenario: Valid streaming source

- **WHEN** a streaming source is declared with `name`, `type`, `protocol`, and `baseUrl`
- **THEN** the system SHALL accept the source definition

#### Scenario: Streaming source missing protocol

- **WHEN** a streaming source does not include `protocol` field
- **THEN** the system SHALL report a validation error: "Streaming source must declare 'protocol' field"

#### Scenario: Streaming source invalid protocol

- **WHEN** a streaming source has `protocol` not in `ws`, `wss`, `kafka`, `mqtt`, `amqp`
- **THEN** the system SHALL report a validation error: "Invalid streaming protocol '{protocol}'. Must be one of: ws, wss, kafka, mqtt, amqp"

#### Scenario: Streaming source missing baseUrl

- **WHEN** a streaming source does not include `baseUrl` field
- **THEN** the system SHALL report a validation error: "Streaming source must declare 'baseUrl' field"

#### Scenario: Streaming entity valid structure

- **WHEN** a streaming entity has `location` and `contract` fields
- **THEN** the system SHALL accept the entity definition

#### Scenario: Streaming entity missing location

- **WHEN** a streaming entity does not include `location` field
- **THEN** the system SHALL report a validation error: "Streaming entity must declare 'location' field (topic, queue, or channel address)"

#### Scenario: Streaming entity with method

- **WHEN** a streaming entity includes `method` field
- **THEN** the system SHALL report a validation error: "Streaming entity cannot have 'method' field (streaming uses continuous flow, not request/response)"

#### Scenario: Streaming entity with forbidden fields

- **WHEN** a streaming entity includes `format` or `partition_by` fields
- **THEN** the system SHALL report a validation error: "Streaming entity cannot have 'format' or 'partition_by' fields"

### Requirement: SaaS source strict structure

The system SHALL strictly validate SaaS source structure.

#### Scenario: Valid SaaS source

- **WHEN** a SaaS source is declared with `name`, `type`, and `provider`
- **THEN** the system SHALL accept the source definition

#### Scenario: SaaS source missing provider

- **WHEN** a SaaS source does not include `provider` field
- **THEN** the system SHALL report a validation error: "SaaS source must declare 'provider' field"

#### Scenario: SaaS source with forbidden fields

- **WHEN** a SaaS source includes `protocol` or `baseUrl` fields
- **THEN** the system SHALL report a validation error: "SaaS source cannot have 'protocol' or 'baseUrl' fields"

#### Scenario: SaaS entity without location

- **WHEN** a SaaS entity does not include `location` field
- **THEN** the system SHALL accept the entity (location is optional for SaaS)

#### Scenario: SaaS entity with forbidden fields

- **WHEN** a SaaS entity includes `method`, `format`, or `partition_by` fields
- **THEN** the system SHALL report a validation error: "SaaS entity cannot have 'method', 'format', or 'partition_by' fields"

### Requirement: Deprecated fields rejection

The system SHALL reject deprecated fields with clear error messages.

#### Scenario: Deprecated pattern field

- **WHEN** any source entity includes `pattern` field
- **THEN** the system SHALL report a validation error: "Field 'pattern' is deprecated. Use 'location' instead"

#### Scenario: Deprecated pathParams field

- **WHEN** any source entity includes `pathParams` field
- **THEN** the system SHALL report a validation error: "Field 'pathParams' is deprecated. Use path templates in 'location' instead (e.g., '/users/{id}')"

#### Scenario: Deprecated queryParams field

- **WHEN** any source entity includes `queryParams` field
- **THEN** the system SHALL report a validation error: "Field 'queryParams' is deprecated. Implementation tools should handle query parameters"

### Requirement: Contract reference validation

The system SHALL validate that all source entity contract references exist.

#### Scenario: Valid contract reference

- **WHEN** a source entity references a contract that exists in the workspace with the specified version
- **THEN** the system SHALL accept the reference

#### Scenario: Missing contract name

- **WHEN** a source entity references a contract name that does not exist
- **THEN** the system SHALL report a validation error: "Contract '{name}' referenced by source entity '{entity}' not found"

#### Scenario: Missing contract version

- **WHEN** a source entity references a contract version that does not exist
- **THEN** the system SHALL report a validation error: "Contract '{name}' version '{version}' not found"