import { parse } from 'yaml';

import type { Source, SourceEntity, SourceType } from '../types/source';

/**
 * Parses a YAML content string into a typed Source object
 *
 * @param yamlContent - The YAML string to parse
 * @returns A typed Source object
 * @throws Error if YAML parsing fails or required fields are missing
 *
 * @example
 * ```typescript
 * const yaml = `
 * name: my_database
 * type: database
 * entities:
 *   - name: users
 *     description: User accounts table
 * `;
 * const source = parseSourceYaml(yaml);
 * ```
 */
export function parseSourceYaml(yamlContent: string): Source {
  // Parse the YAML content
  const parsed = parse(yamlContent);

  // Validate basic structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid YAML: expected an object');
  }

  // Extract and validate required fields
  const { name, type, entities, metadata } = parsed as Record<string, unknown>;

  if (!name || typeof name !== 'string') {
    throw new Error('Invalid Source: "name" is required and must be a string');
  }

  if (!type || typeof type !== 'string') {
    throw new Error('Invalid Source: "type" is required and must be a string');
  }

  // Validate source type
  const validTypes: SourceType[] = ['database', 'api', 'file_system', 'saas'];
  if (!validTypes.includes(type as SourceType)) {
    throw new Error(`Invalid Source type: "${type}". Must be one of: ${validTypes.join(', ')}`);
  }

  // Parse entities
  const parsedEntities: SourceEntity[] = [];
  if (entities) {
    if (!Array.isArray(entities)) {
      throw new Error('Invalid Source: "entities" must be an array');
    }

    for (const entity of entities) {
      if (!entity || typeof entity !== 'object') {
        throw new Error('Invalid SourceEntity: each entity must be an object');
      }

      const entityObj = entity as Record<string, unknown>;

      if (!entityObj.name || typeof entityObj.name !== 'string') {
        throw new Error('Invalid SourceEntity: "name" is required and must be a string');
      }

      parsedEntities.push({
        name: entityObj.name,
        description: entityObj.description as string | undefined,
        entityType: entityObj.entityType as string | undefined,
        schema: entityObj.schema as Record<string, unknown> | undefined,
        pattern: entityObj.pattern as string | undefined,
        method: entityObj.method as string | undefined,
        pathParams: entityObj.pathParams as string[] | undefined,
        queryParams: entityObj.queryParams as string[] | undefined,
        metadata: entityObj.metadata as Record<string, unknown> | undefined,
      });
    }
  }

  // Construct and return the Source object
  const source: Source = {
    name,
    type: type as SourceType,
    entities: parsedEntities,
  };

  // Add metadata if present
  if (metadata && typeof metadata === 'object') {
    source.metadata = {
      description: (metadata as Record<string, unknown>).description as string | undefined,
      labels: (metadata as Record<string, unknown>).labels as string[] | undefined,
      definedAt: (metadata as Record<string, unknown>).definedAt as string | undefined,
      version: (metadata as Record<string, unknown>).version as string | undefined,
    };
  }

  return source;
}
