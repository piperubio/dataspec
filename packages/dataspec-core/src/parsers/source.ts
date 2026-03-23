import { parse } from 'yaml';

import {
  type Source,
  type SourceDatabase,
  type SourceApi,
  type SourceFileSystem,
  type SourceStreaming,
  type SourceSaas,
  type SourceEntity,
  type SourceEntityDatabase,
  type SourceEntityApi,
  type SourceEntityFileSystem,
  type SourceEntityStreaming,
  type SourceEntitySaas,
  type ContractReference,
} from '../types/source';
import { validateAgainstSchema } from '../validation/schema-validator';

const VALID_API_PROTOCOLS = ['http', 'https', 'grpc'];
const VALID_STREAMING_PROTOCOLS = ['ws', 'wss', 'kafka', 'mqtt', 'amqp'];
const VALID_FORMATS = ['parquet', 'csv', 'json', 'avro', 'fixed-width', 'orc', 'delta'];
const DEPRECATED_FIELDS = ['pattern', 'pathParams', 'queryParams'];

function parseContractReference(contract: unknown, entityName: string): ContractReference {
  if (!contract || typeof contract !== 'object') {
    throw new Error(
      `Invalid SourceEntity "${entityName}": "contract" is required and must be an object with name and version`,
    );
  }
  const contractObj = contract as Record<string, unknown>;
  if (!contractObj.name || typeof contractObj.name !== 'string') {
    throw new Error(
      `Invalid SourceEntity "${entityName}": contract "name" is required and must be a string`,
    );
  }
  if (!contractObj.version || typeof contractObj.version !== 'string') {
    throw new Error(
      `Invalid SourceEntity "${entityName}": contract "version" is required and must be a string`,
    );
  }
  return {
    name: contractObj.name,
    version: contractObj.version,
  };
}

function rejectDeprecatedFields(entityObj: Record<string, unknown>, entityName: string): void {
  for (const field of DEPRECATED_FIELDS) {
    if (field in entityObj) {
      const messages: Record<string, string> = {
        pattern: `Deprecated field "pattern" in entity "${entityName}": Use 'location' instead`,
        pathParams: `Deprecated field "pathParams" in entity "${entityName}": Use path templates in 'location'`,
        queryParams: `Deprecated field "queryParams" in entity "${entityName}": Implementation tools handle query parameters`,
      };
      throw new Error(messages[field]);
    }
  }
}

function parseDatabaseEntity(entityObj: Record<string, unknown>): SourceEntityDatabase {
  const name = entityObj.name as string;
  if (!entityObj.location || typeof entityObj.location !== 'string') {
    throw new Error(`Invalid SourceEntity "${name}": "location" is required for database entities`);
  }
  if (
    entityObj.location.includes('/') ||
    entityObj.location.includes('://') ||
    entityObj.location.includes('?')
  ) {
    throw new Error(
      `Invalid SourceEntity "${name}": database "location" must be a logical identifier (no '/', '://', or '?')`,
    );
  }
  if ('method' in entityObj) {
    throw new Error(
      `Invalid SourceEntity "${name}": "method" is not allowed for database entities`,
    );
  }
  if ('format' in entityObj) {
    throw new Error(
      `Invalid SourceEntity "${name}": "format" is not allowed for database entities`,
    );
  }
  if ('partition_by' in entityObj) {
    throw new Error(
      `Invalid SourceEntity "${name}": "partition_by" is not allowed for database entities`,
    );
  }
  return {
    name,
    location: entityObj.location,
    contract: parseContractReference(entityObj.contract, name),
    description: entityObj.description as string | undefined,
    entityType: entityObj.entityType as string | undefined,
    schema: entityObj.schema as Record<string, unknown> | undefined,
    metadata: entityObj.metadata as Record<string, unknown> | undefined,
  };
}

function parseApiEntity(entityObj: Record<string, unknown>): SourceEntityApi {
  const name = entityObj.name as string;
  if (!entityObj.location || typeof entityObj.location !== 'string') {
    throw new Error(`Invalid SourceEntity "${name}": "location" is required for API entities`);
  }
  if (!entityObj.location.startsWith('/')) {
    throw new Error(`Invalid SourceEntity "${name}": API "location" must start with '/'`);
  }
  if (!entityObj.method || typeof entityObj.method !== 'string') {
    throw new Error(`Invalid SourceEntity "${name}": "method" is required for API entities`);
  }
  if ('format' in entityObj) {
    throw new Error(`Invalid SourceEntity "${name}": "format" is not allowed for API entities`);
  }
  if ('partition_by' in entityObj) {
    throw new Error(
      `Invalid SourceEntity "${name}": "partition_by" is not allowed for API entities`,
    );
  }
  return {
    name,
    location: entityObj.location,
    method: entityObj.method,
    contract: parseContractReference(entityObj.contract, name),
    description: entityObj.description as string | undefined,
    entityType: entityObj.entityType as string | undefined,
    schema: entityObj.schema as Record<string, unknown> | undefined,
    metadata: entityObj.metadata as Record<string, unknown> | undefined,
  };
}

function parseFileSystemEntity(entityObj: Record<string, unknown>): SourceEntityFileSystem {
  const name = entityObj.name as string;
  if (!entityObj.location || typeof entityObj.location !== 'string') {
    throw new Error(
      `Invalid SourceEntity "${name}": "location" is required for file_system entities`,
    );
  }
  const location = entityObj.location;
  const validLocation =
    location.startsWith('/') ||
    location.startsWith('.') ||
    location.startsWith('s3://') ||
    location.startsWith('gs://') ||
    location.startsWith('abfs://') ||
    location.startsWith('hdfs://');
  if (!validLocation) {
    throw new Error(
      `Invalid SourceEntity "${name}": file_system "location" must start with '/', '.', or a storage URI (s3://, gs://, etc.)`,
    );
  }
  if (!entityObj.format || typeof entityObj.format !== 'string') {
    throw new Error(
      `Invalid SourceEntity "${name}": "format" is required for file_system entities`,
    );
  }
  if (!VALID_FORMATS.includes(entityObj.format)) {
    throw new Error(
      `Invalid SourceEntity "${name}": "format" must be one of: ${VALID_FORMATS.join(', ')}`,
    );
  }
  if ('method' in entityObj) {
    throw new Error(
      `Invalid SourceEntity "${name}": "method" is not allowed for file_system entities`,
    );
  }
  let partitionBy: string[] | undefined;
  if (entityObj.partition_by !== undefined) {
    if (!Array.isArray(entityObj.partition_by)) {
      throw new Error(`Invalid SourceEntity "${name}": "partition_by" must be an array of strings`);
    }
    partitionBy = entityObj.partition_by as string[];
  }
  return {
    name,
    location,
    format: entityObj.format,
    contract: parseContractReference(entityObj.contract, name),
    partition_by: partitionBy,
    description: entityObj.description as string | undefined,
    entityType: entityObj.entityType as string | undefined,
    schema: entityObj.schema as Record<string, unknown> | undefined,
    metadata: entityObj.metadata as Record<string, unknown> | undefined,
  };
}

function parseStreamingEntity(entityObj: Record<string, unknown>): SourceEntityStreaming {
  const name = entityObj.name as string;
  if (!entityObj.location || typeof entityObj.location !== 'string') {
    throw new Error(
      `Invalid SourceEntity "${name}": "location" is required for streaming entities`,
    );
  }
  if ('method' in entityObj) {
    throw new Error(
      `Invalid SourceEntity "${name}": "method" is not allowed for streaming entities`,
    );
  }
  if ('format' in entityObj) {
    throw new Error(
      `Invalid SourceEntity "${name}": "format" is not allowed for streaming entities`,
    );
  }
  if ('partition_by' in entityObj) {
    throw new Error(
      `Invalid SourceEntity "${name}": "partition_by" is not allowed for streaming entities`,
    );
  }
  return {
    name,
    location: entityObj.location,
    contract: parseContractReference(entityObj.contract, name),
    description: entityObj.description as string | undefined,
    entityType: entityObj.entityType as string | undefined,
    schema: entityObj.schema as Record<string, unknown> | undefined,
    metadata: entityObj.metadata as Record<string, unknown> | undefined,
  };
}

function parseSaasEntity(entityObj: Record<string, unknown>): SourceEntitySaas {
  const name = entityObj.name as string;
  if ('method' in entityObj) {
    throw new Error(`Invalid SourceEntity "${name}": "method" is not allowed for saas entities`);
  }
  if ('format' in entityObj) {
    throw new Error(`Invalid SourceEntity "${name}": "format" is not allowed for saas entities`);
  }
  if ('partition_by' in entityObj) {
    throw new Error(
      `Invalid SourceEntity "${name}": "partition_by" is not allowed for saas entities`,
    );
  }
  return {
    name,
    contract: parseContractReference(entityObj.contract, name),
    location: entityObj.location as string | undefined,
    description: entityObj.description as string | undefined,
    entityType: entityObj.entityType as string | undefined,
    schema: entityObj.schema as Record<string, unknown> | undefined,
    metadata: entityObj.metadata as Record<string, unknown> | undefined,
  };
}

function parseMetadata(metadata: unknown): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }
  const meta = metadata as Record<string, unknown>;
  return {
    description: meta.description as string | undefined,
    labels: meta.labels as string[] | undefined,
    definedAt: meta.definedAt as string | undefined,
    version: meta.version as string | undefined,
  };
}

export function parseSourceYaml(yamlContent: string): Source {
  const parsed = parse(yamlContent);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid YAML: expected an object');
  }

  // Validate against JSON Schema
  const schemaResult = validateAgainstSchema(parsed, 'source');
  if (!schemaResult.valid) {
    throw new Error(`Schema validation failed:\n${schemaResult.errors.join('\n')}`);
  }

  const { name, type, entities, metadata } = parsed as Record<string, unknown>;

  const sourceName = name as string;
  const sourceType = type as string;

  const parsedEntities: SourceEntity[] = [];
  for (const entity of entities as unknown[]) {
    const entityObj = entity as Record<string, unknown>;
    rejectDeprecatedFields(entityObj, entityObj.name as string);
    switch (sourceType) {
      case 'database':
        parsedEntities.push(parseDatabaseEntity(entityObj));
        break;
      case 'api':
        parsedEntities.push(parseApiEntity(entityObj));
        break;
      case 'file_system':
        parsedEntities.push(parseFileSystemEntity(entityObj));
        break;
      case 'streaming':
        parsedEntities.push(parseStreamingEntity(entityObj));
        break;
      case 'saas':
        parsedEntities.push(parseSaasEntity(entityObj));
        break;
    }
  }

  const meta = parseMetadata(metadata);

  switch (sourceType) {
    case 'database': {
      const source: SourceDatabase = {
        name: sourceName,
        type: 'database',
        entities: parsedEntities as SourceEntityDatabase[],
      };
      if (meta) {
        source.metadata = meta;
      }
      return source;
    }
    case 'api': {
      const parsedObj = parsed as Record<string, unknown>;
      if (!parsedObj.protocol || typeof parsedObj.protocol !== 'string') {
        throw new Error('Invalid Source: "protocol" is required for api sources');
      }
      if (!VALID_API_PROTOCOLS.includes(parsedObj.protocol)) {
        throw new Error(
          `Invalid Source: "protocol" must be one of: ${VALID_API_PROTOCOLS.join(', ')} for api sources`,
        );
      }
      if (!parsedObj.baseUrl || typeof parsedObj.baseUrl !== 'string') {
        throw new Error('Invalid Source: "baseUrl" is required for api sources');
      }
      const source: SourceApi = {
        name: sourceName,
        type: 'api',
        protocol: parsedObj.protocol,
        baseUrl: parsedObj.baseUrl,
        entities: parsedEntities as SourceEntityApi[],
      };
      if (meta) {
        source.metadata = meta;
      }
      return source;
    }
    case 'file_system': {
      const source: SourceFileSystem = {
        name: sourceName,
        type: 'file_system',
        entities: parsedEntities as SourceEntityFileSystem[],
      };
      if (meta) {
        source.metadata = meta;
      }
      return source;
    }
    case 'streaming': {
      const parsedObj = parsed as Record<string, unknown>;
      if (!parsedObj.protocol || typeof parsedObj.protocol !== 'string') {
        throw new Error('Invalid Source: "protocol" is required for streaming sources');
      }
      if (!VALID_STREAMING_PROTOCOLS.includes(parsedObj.protocol)) {
        throw new Error(
          `Invalid Source: "protocol" must be one of: ${VALID_STREAMING_PROTOCOLS.join(', ')} for streaming sources`,
        );
      }
      if (!parsedObj.baseUrl || typeof parsedObj.baseUrl !== 'string') {
        throw new Error('Invalid Source: "baseUrl" is required for streaming sources');
      }
      const source: SourceStreaming = {
        name: sourceName,
        type: 'streaming',
        protocol: parsedObj.protocol,
        baseUrl: parsedObj.baseUrl,
        entities: parsedEntities as SourceEntityStreaming[],
      };
      if (meta) {
        source.metadata = meta;
      }
      return source;
    }
    case 'saas': {
      const parsedObj = parsed as Record<string, unknown>;
      if (!parsedObj.provider || typeof parsedObj.provider !== 'string') {
        throw new Error('Invalid Source: "provider" is required for saas sources');
      }
      const source: SourceSaas = {
        name: sourceName,
        type: 'saas',
        provider: parsedObj.provider,
        entities: parsedEntities as SourceEntitySaas[],
      };
      if (meta) {
        source.metadata = meta;
      }
      return source;
    }
    default:
      throw new Error(`Invalid Source type: ${sourceType}`);
  }
}
