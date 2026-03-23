import { describe, it, expect } from 'bun:test';

import { parseSourceYaml } from '../parsers/source';
import { SourceType } from '../types/source';
import type {
  Source,
  SourceDatabase,
  SourceApi,
  SourceFileSystem,
  SourceStreaming,
  SourceSaas,
  SourceEntity,
  SourceEntityDatabase,
  SourceEntityApi,
  SourceEntityFileSystem,
  SourceEntityStreaming,
  SourceEntitySaas,
} from '../types/source';

describe('SourceType enum values', () => {
  it('should have DATABASE value', () => {
    expect(SourceType.DATABASE).toBe('database');
  });

  it('should have API value', () => {
    expect(SourceType.API).toBe('api');
  });

  it('should have FILE_SYSTEM value', () => {
    expect(SourceType.FILE_SYSTEM).toBe('file_system');
  });

  it('should have STREAMING value', () => {
    expect(SourceType.STREAMING).toBe('streaming');
  });

  it('should have SAAS value', () => {
    expect(SourceType.SAAS).toBe('saas');
  });
});

describe('Discriminated union for SourceEntity', () => {
  it('should correctly narrow SourceEntity to SourceEntityDatabase', () => {
    const yaml = `
name: test_db
type: database
entities:
  - name: users
    location: public.users
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('database');
    if (result.type === 'database') {
      const entity = result.entities[0];
      expect(entity.location).toBe('public.users');
      expect('method' in entity).toBe(false);
      expect('format' in entity).toBe(false);
    }
  });

  it('should correctly narrow SourceEntity to SourceEntityApi', () => {
    const yaml = `
name: test_api
type: api
protocol: https
baseUrl: api.example.com
entities:
  - name: users
    location: /api/v1/users
    method: GET
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('api');
    if (result.type === 'api') {
      const entity = result.entities[0];
      expect(entity.method).toBe('GET');
      expect('format' in entity).toBe(false);
    }
  });

  it('should correctly narrow SourceEntity to SourceEntityFileSystem', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/*.csv
    format: csv
    partition_by:
      - date
      - region
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('file_system');
    if (result.type === 'file_system') {
      const entity = result.entities[0];
      expect(entity.format).toBe('csv');
      expect(entity.partition_by).toEqual(['date', 'region']);
      expect('method' in entity).toBe(false);
    }
  });

  it('should correctly narrow SourceEntity to SourceEntityStreaming', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    location: user-events
    contract:
      name: events_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('streaming');
    if (result.type === 'streaming') {
      const entity = result.entities[0];
      expect(entity.location).toBe('user-events');
      expect('method' in entity).toBe(false);
      expect('format' in entity).toBe(false);
    }
  });

  it('should correctly narrow SourceEntity to SourceEntitySaas', () => {
    const yaml = `
name: test_saas
type: saas
provider: salesforce
entities:
  - name: leads
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('saas');
    if (result.type === 'saas') {
      const entity = result.entities[0];
      expect(entity.contract.name).toBe('leads_schema');
      expect(entity.location).toBeUndefined();
      expect('method' in entity).toBe(false);
    }
  });
});

describe('Database source validation', () => {
  it('should parse a valid database source', () => {
    const yaml = `
name: production_db
type: database
entities:
  - name: users
    location: public.users
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('database');
    if (result.type === 'database') {
      expect(result.entities[0].location).toBe('public.users');
    }
  });

  it('should accept valid database locations with schema.table format', () => {
    const yaml = `
name: test_db
type: database
entities:
  - name: users
    location: public.users
    contract:
      name: users_schema
      version: "1.0.0"
  - name: orders
    location: analytics.orders
    contract:
      name: orders_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('database');
    if (result.type === 'database') {
      expect(result.entities[0].location).toBe('public.users');
      expect(result.entities[1].location).toBe('analytics.orders');
    }
  });

  it('should reject database location with forward slash', () => {
    const yaml = `
name: test_db
type: database
entities:
  - name: users
    location: /api/users
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('database "location" must be a logical identifier');
  });

  it('should reject database location with storage URI', () => {
    const yaml = `
name: test_db
type: database
entities:
  - name: users
    location: s3://bucket/data
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('database "location" must be a logical identifier');
  });

  it('should reject database entity with method field', () => {
    const yaml = `
name: test_db
type: database
entities:
  - name: users
    location: public.users
    method: GET
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"method" is not allowed for database entities');
  });

  it('should reject database entity with format field', () => {
    const yaml = `
name: test_db
type: database
entities:
  - name: users
    location: public.users
    format: csv
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"format" is not allowed for database entities');
  });

  it('should reject database entity with partition_by field', () => {
    const yaml = `
name: test_db
type: database
entities:
  - name: users
    location: public.users
    partition_by:
      - date
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow(
      '"partition_by" is not allowed for database entities',
    );
  });
});

describe('API source validation', () => {
  it('should parse valid http API source', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /api/v1/users
    method: GET
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('api');
    if (result.type === 'api') {
      expect(result.protocol).toBe('http');
      expect(result.entities[0].method).toBe('GET');
    }
  });

  it('should parse valid https API source', () => {
    const yaml = `
name: test_api
type: api
protocol: https
baseUrl: api.example.com
entities:
  - name: users
    location: /api/v1/users
    method: POST
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('api');
    if (result.type === 'api') {
      expect(result.protocol).toBe('https');
    }
  });

  it('should parse valid grpc API source', () => {
    const yaml = `
name: test_api
type: api
protocol: grpc
baseUrl: grpc.example.com
entities:
  - name: users
    location: /api/v1/users
    method: GetUser
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('api');
    if (result.type === 'api') {
      expect(result.protocol).toBe('grpc');
      expect(result.entities[0].method).toBe('GetUser');
    }
  });

  it('should require protocol for API source', () => {
    const yaml = `
name: test_api
type: api
baseUrl: api.example.com
entities:
  - name: users
    location: /api/v1/users
    method: GET
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"protocol" is required for api sources');
  });

  it('should require baseUrl for API source', () => {
    const yaml = `
name: test_api
type: api
protocol: http
entities:
  - name: users
    location: /api/v1/users
    method: GET
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"baseUrl" is required for api sources');
  });

  it('should accept valid API location starting with forward slash', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /api/v1/users
    method: GET
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('api');
    if (result.type === 'api') {
      expect(result.entities[0].location).toBe('/api/v1/users');
    }
  });

  it('should reject API location not starting with forward slash', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: public.users
    method: GET
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('API "location" must start with');
  });

  it('should accept GET method for http protocol', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: GET
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('api');
    if (result.type === 'api') {
      expect(result.entities[0].method).toBe('GET');
    }
  });

  it('should accept POST method for http protocol', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: POST
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'api') {
      expect(result.entities[0].method).toBe('POST');
    }
  });

  it('should accept PUT method for http protocol', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: PUT
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'api') {
      expect(result.entities[0].method).toBe('PUT');
    }
  });

  it('should accept DELETE method for http protocol', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: DELETE
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'api') {
      expect(result.entities[0].method).toBe('DELETE');
    }
  });

  it('should accept PATCH method for http protocol', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: PATCH
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'api') {
      expect(result.entities[0].method).toBe('PATCH');
    }
  });

  it('should accept any method value for grpc protocol', () => {
    const yaml = `
name: test_api
type: api
protocol: grpc
baseUrl: grpc.example.com
entities:
  - name: users
    location: /users/Users
    method: GetUserById
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'api') {
      expect(result.entities[0].method).toBe('GetUserById');
    }
  });

  it('should reject API entity with format field', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: GET
    format: json
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"format" is not allowed for API entities');
  });

  it('should reject API entity with partition_by field', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: GET
    partition_by:
      - date
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"partition_by" is not allowed for API entities');
  });
});

describe('File system source validation', () => {
  it('should parse valid file_system source', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/*.csv
    format: csv
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('file_system');
    if (result.type === 'file_system') {
      expect(result.entities[0].location).toBe('/data/*.csv');
      expect(result.entities[0].format).toBe('csv');
    }
  });

  it('should accept file system location starting with forward slash', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/*.csv
    format: csv
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].location).toBe('/data/*.csv');
    }
  });

  it('should accept file system location with s3 URI', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: s3://bucket/path/data.parquet
    format: parquet
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].location).toBe('s3://bucket/path/data.parquet');
    }
  });

  it('should accept file system location with gs URI', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: gs://bucket/path/data.json
    format: json
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].location).toBe('gs://bucket/path/data.json');
    }
  });

  it('should accept file system location with relative path', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: ./data/files
    format: csv
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].location).toBe('./data/files');
    }
  });

  it('should reject file_system location that looks like database identifier', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: public.users
    format: csv
    contract:
      name: files_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('file_system "location" must start with');
  });

  it('should accept parquet format', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: parquet
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].format).toBe('parquet');
    }
  });

  it('should accept csv format', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: csv
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].format).toBe('csv');
    }
  });

  it('should accept json format', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: json
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].format).toBe('json');
    }
  });

  it('should accept avro format', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: avro
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].format).toBe('avro');
    }
  });

  it('should accept fixed-width format', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: fixed-width
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].format).toBe('fixed-width');
    }
  });

  it('should accept orc format', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: orc
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].format).toBe('orc');
    }
  });

  it('should accept delta format', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: delta
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].format).toBe('delta');
    }
  });

  it('should accept partition_by field', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: parquet
    partition_by:
      - date
      - region
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].partition_by).toEqual(['date', 'region']);
    }
  });

  it('should accept file_system entity without partition_by', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: parquet
    contract:
      name: files_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'file_system') {
      expect(result.entities[0].partition_by).toBeUndefined();
    }
  });

  it('should reject file_system entity with method field', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: csv
    method: GET
    contract:
      name: files_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"method" is not allowed for file_system entities');
  });
});

describe('Streaming source validation', () => {
  it('should parse valid streaming source with ws protocol', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: ws
baseUrl: ws.example.com
entities:
  - name: events
    location: /ws/events
    contract:
      name: events_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('streaming');
    if (result.type === 'streaming') {
      expect(result.protocol).toBe('ws');
    }
  });

  it('should parse valid streaming source with wss protocol', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: wss
baseUrl: wss.example.com
entities:
  - name: events
    location: /ws/events
    contract:
      name: events_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'streaming') {
      expect(result.protocol).toBe('wss');
    }
  });

  it('should parse valid streaming source with kafka protocol', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    location: user-events
    contract:
      name: events_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'streaming') {
      expect(result.protocol).toBe('kafka');
    }
  });

  it('should parse valid streaming source with mqtt protocol', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: mqtt
baseUrl: mqtt.example.com
entities:
  - name: events
    location: devices/+/status
    contract:
      name: events_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'streaming') {
      expect(result.protocol).toBe('mqtt');
    }
  });

  it('should parse valid streaming source with amqp protocol', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: amqp
baseUrl: amqp.example.com
entities:
  - name: events
    location: /queue/events
    contract:
      name: events_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'streaming') {
      expect(result.protocol).toBe('amqp');
    }
  });

  it('should require protocol for streaming source', () => {
    const yaml = `
name: test_stream
type: streaming
baseUrl: kafka.example.com
entities:
  - name: events
    location: user-events
    contract:
      name: events_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"protocol" is required for streaming sources');
  });

  it('should require baseUrl for streaming source', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
entities:
  - name: events
    location: user-events
    contract:
      name: events_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"baseUrl" is required for streaming sources');
  });

  it('should require location for streaming entity', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    contract:
      name: events_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"location" is required for streaming entities');
  });

  it('should reject streaming entity with method field', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    location: user-events
    method: GET
    contract:
      name: events_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"method" is not allowed for streaming entities');
  });

  it('should reject streaming entity with format field', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    location: user-events
    format: json
    contract:
      name: events_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"format" is not allowed for streaming entities');
  });

  it('should reject streaming entity with partition_by field', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    location: user-events
    partition_by:
      - date
    contract:
      name: events_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow(
      '"partition_by" is not allowed for streaming entities',
    );
  });
});

describe('SaaS source validation', () => {
  it('should parse valid saas source', () => {
    const yaml = `
name: test_saas
type: saas
provider: salesforce
entities:
  - name: leads
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    expect(result.type).toBe('saas');
    if (result.type === 'saas') {
      expect(result.provider).toBe('salesforce');
    }
  });

  it('should require provider for saas source', () => {
    const yaml = `
name: test_saas
type: saas
entities:
  - name: leads
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"provider" is required for saas sources');
  });

  it('should accept saas entity without location', () => {
    const yaml = `
name: test_saas
type: saas
provider: hubspot
entities:
  - name: contacts
    contract:
      name: contacts_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'saas') {
      expect(result.entities[0].location).toBeUndefined();
    }
  });

  it('should accept saas entity with optional location', () => {
    const yaml = `
name: test_saas
type: saas
provider: salesforce
entities:
  - name: leads
    location: Lead
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml);
    if (result.type === 'saas') {
      expect(result.entities[0].location).toBe('Lead');
    }
  });

  it('should reject saas entity with method field', () => {
    const yaml = `
name: test_saas
type: saas
provider: salesforce
entities:
  - name: leads
    method: GET
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"method" is not allowed for saas entities');
  });

  it('should reject saas entity with format field', () => {
    const yaml = `
name: test_saas
type: saas
provider: salesforce
entities:
  - name: leads
    format: json
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"format" is not allowed for saas entities');
  });

  it('should reject saas entity with partition_by field', () => {
    const yaml = `
name: test_saas
type: saas
provider: salesforce
entities:
  - name: leads
    partition_by:
      - date
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"partition_by" is not allowed for saas entities');
  });
});

describe('Schema validation errors', () => {
  it('should throw schema validation error for missing name', () => {
    const yaml = `
type: database
entities:
  - name: users
    contract:
      name: users_schema
      version: "1.0.0"
`;

    expect(() => parseSourceYaml(yaml)).toThrow('Schema validation failed');
  });

  it('should throw schema validation error for missing type', () => {
    const yaml = `
name: test_source
entities:
  - name: users
    contract:
      name: users_schema
      version: "1.0.0"
`;

    expect(() => parseSourceYaml(yaml)).toThrow('Schema validation failed');
    expect(() => parseSourceYaml(yaml)).toThrow('type');
  });

  it('should throw schema validation error for missing entities', () => {
    const yaml = `
name: test_source
type: database
`;

    expect(() => parseSourceYaml(yaml)).toThrow('Schema validation failed');
    expect(() => parseSourceYaml(yaml)).toThrow('entities');
  });

  it('should collect multiple schema validation errors', () => {
    const yaml = `{}`;

    expect(() => parseSourceYaml(yaml)).toThrow('Schema validation failed');
    expect(() => parseSourceYaml(yaml)).toThrow('name');
    expect(() => parseSourceYaml(yaml)).toThrow('type');
  });

  it('should throw schema error for invalid source type', () => {
    const yaml = `
name: test_source
type: invalid_type
entities: []
`;

    expect(() => parseSourceYaml(yaml)).toThrow('Schema validation failed');
  });
});

describe('Deprecated fields rejection', () => {
  it('should reject deprecated pattern field', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/*.csv
    format: csv
    pattern: "*.csv"
    contract:
      name: files_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('Deprecated field "pattern"');
  });

  it('should reject deprecated pathParams field', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users/{id}
    method: GET
    pathParams:
      - id
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('Deprecated field "pathParams"');
  });

  it('should reject deprecated queryParams field', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: GET
    queryParams:
      - status
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('Deprecated field "queryParams"');
  });
});

describe('Integration tests', () => {
  it('should parse complete valid database source definition', () => {
    const yaml = `
name: production_db
type: database
entities:
  - name: users
    location: public.users
    contract:
      name: users_schema
      version: "1.0.0"
    description: User accounts table
    entityType: table
  - name: orders
    location: analytics.orders
    contract:
      name: orders_schema
      version: "1.0.0"
    description: Orders table
    entityType: table
`;
    const result = parseSourceYaml(yaml) as SourceDatabase;
    expect(result.name).toBe('production_db');
    expect(result.type).toBe('database');
    expect(result.entities).toHaveLength(2);
    expect(result.entities[0].name).toBe('users');
    expect(result.entities[0].location).toBe('public.users');
    expect(result.entities[0].contract.name).toBe('users_schema');
    expect(result.entities[0].contract.version).toBe('1.0.0');
    expect(result.entities[1].name).toBe('orders');
    expect(result.entities[1].location).toBe('analytics.orders');
  });

  it('should parse complete valid API source definition for http', () => {
    const yaml = `
name: payment_api
type: api
protocol: http
baseUrl: api.payment.com
entities:
  - name: transactions
    location: /api/v1/transactions
    method: GET
    contract:
      name: transactions_schema
      version: "1.0.0"
    description: Transactions endpoint
    entityType: endpoint
`;
    const result = parseSourceYaml(yaml) as SourceApi;
    expect(result.name).toBe('payment_api');
    expect(result.type).toBe('api');
    expect(result.protocol).toBe('http');
    expect(result.baseUrl).toBe('api.payment.com');
    expect(result.entities[0].method).toBe('GET');
    expect(result.entities[0].location).toBe('/api/v1/transactions');
  });

  it('should parse complete valid API source definition for https', () => {
    const yaml = `
name: payment_api
type: api
protocol: https
baseUrl: api.payment.com
entities:
  - name: transactions
    location: /api/v1/transactions
    method: POST
    contract:
      name: transactions_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml) as SourceApi;
    expect(result.protocol).toBe('https');
    expect(result.entities[0].method).toBe('POST');
  });

  it('should parse complete valid API source definition for grpc', () => {
    const yaml = `
name: grpc_service
type: api
protocol: grpc
baseUrl: grpc.example.com
entities:
  - name: users
    location: /api/users
    method: GetUsers
    contract:
      name: users_schema
      version: "1.0.0"
`;
    const result = parseSourceYaml(yaml) as SourceApi;
    expect(result.protocol).toBe('grpc');
    expect(result.entities[0].method).toBe('GetUsers');
  });

  it('should parse complete valid file_system source definition', () => {
    const yaml = `
name: data_lake
type: file_system
entities:
  - name: daily_sales
    location: s3://data-lake/sales/daily/*.parquet
    format: parquet
    partition_by:
      - year
      - month
      - day
    contract:
      name: sales_schema
      version: "1.0.0"
    description: Daily sales data
    entityType: file
`;
    const result = parseSourceYaml(yaml) as SourceFileSystem;
    expect(result.name).toBe('data_lake');
    expect(result.type).toBe('file_system');
    expect(result.entities[0].format).toBe('parquet');
    expect(result.entities[0].partition_by).toEqual(['year', 'month', 'day']);
    expect(result.entities[0].location).toBe('s3://data-lake/sales/daily/*.parquet');
  });

  it('should parse complete valid streaming source definition', () => {
    const yaml = `
name: event_stream
type: streaming
protocol: kafka
baseUrl: kafka-cluster-1:9092,kafka-cluster-2:9092
entities:
  - name: user_events
    location: user-events-topic
    contract:
      name: user_events_schema
      version: "1.0.0"
    description: User activity events
    entityType: topic
  - name: order_events
    location: order-events-topic
    contract:
      name: order_events_schema
      version: "1.0.0"
    description: Order events stream
    entityType: topic
`;
    const result = parseSourceYaml(yaml) as SourceStreaming;
    expect(result.name).toBe('event_stream');
    expect(result.type).toBe('streaming');
    expect(result.protocol).toBe('kafka');
    expect(result.baseUrl).toBe('kafka-cluster-1:9092,kafka-cluster-2:9092');
    expect(result.entities).toHaveLength(2);
    expect(result.entities[0].location).toBe('user-events-topic');
    expect(result.entities[1].location).toBe('order-events-topic');
  });

  it('should parse complete valid saas source definition', () => {
    const yaml = `
name: crm_integration
type: saas
provider: salesforce
entities:
  - name: contacts
    location: Contact
    contract:
      name: contact_schema
      version: "1.0.0"
    description: Salesforce contacts
    entityType: object
  - name: accounts
    location: Account
    contract:
      name: account_schema
      version: "1.0.0"
    description: Salesforce accounts
    entityType: object
`;
    const result = parseSourceYaml(yaml) as SourceSaas;
    expect(result.name).toBe('crm_integration');
    expect(result.type).toBe('saas');
    expect(result.provider).toBe('salesforce');
    expect(result.entities).toHaveLength(2);
    expect(result.entities[0].location).toBe('Contact');
    expect(result.entities[1].location).toBe('Account');
  });

  it('should reject forbidden fields cross-type: method on database entity', () => {
    const yaml = `
name: test_db
type: database
entities:
  - name: users
    location: public.users
    method: GET
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"method" is not allowed for database entities');
  });

  it('should reject forbidden fields cross-type: format on api entity', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: GET
    format: json
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"format" is not allowed for API entities');
  });

  it('should reject forbidden fields cross-type: method on file_system entity', () => {
    const yaml = `
name: test_fs
type: file_system
entities:
  - name: files
    location: /data/files
    format: csv
    method: GET
    contract:
      name: files_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"method" is not allowed for file_system entities');
  });

  it('should reject forbidden fields cross-type: method on streaming entity', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    location: user-events
    method: GET
    contract:
      name: events_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"method" is not allowed for streaming entities');
  });

  it('should reject forbidden fields cross-type: method on saas entity', () => {
    const yaml = `
name: test_saas
type: saas
provider: salesforce
entities:
  - name: leads
    location: Lead
    method: GET
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"method" is not allowed for saas entities');
  });

  it('should reject forbidden fields cross-type: format on streaming entity', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    location: user-events
    format: json
    contract:
      name: events_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"format" is not allowed for streaming entities');
  });

  it('should reject forbidden fields cross-type: format on saas entity', () => {
    const yaml = `
name: test_saas
type: saas
provider: salesforce
entities:
  - name: leads
    location: Lead
    format: json
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"format" is not allowed for saas entities');
  });

  it('should reject forbidden fields cross-type: partition_by on database entity', () => {
    const yaml = `
name: test_db
type: database
entities:
  - name: users
    location: public.users
    partition_by:
      - date
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow(
      '"partition_by" is not allowed for database entities',
    );
  });

  it('should reject forbidden fields cross-type: partition_by on api entity', () => {
    const yaml = `
name: test_api
type: api
protocol: http
baseUrl: api.example.com
entities:
  - name: users
    location: /users
    method: GET
    partition_by:
      - date
    contract:
      name: users_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"partition_by" is not allowed for API entities');
  });

  it('should reject forbidden fields cross-type: partition_by on streaming entity', () => {
    const yaml = `
name: test_stream
type: streaming
protocol: kafka
baseUrl: kafka.example.com:9092
entities:
  - name: events
    location: user-events
    partition_by:
      - date
    contract:
      name: events_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow(
      '"partition_by" is not allowed for streaming entities',
    );
  });

  it('should reject forbidden fields cross-type: partition_by on saas entity', () => {
    const yaml = `
name: test_saas
type: saas
provider: salesforce
entities:
  - name: leads
    location: Lead
    partition_by:
      - date
    contract:
      name: leads_schema
      version: "1.0.0"
`;
    expect(() => parseSourceYaml(yaml)).toThrow('"partition_by" is not allowed for saas entities');
  });
});
