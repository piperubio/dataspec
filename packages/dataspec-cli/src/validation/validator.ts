import { buildDependencyGraph } from '../graph/builder.js';
import { detectCycles, getDownstream, DependencyGraph } from '../graph/index.js';
import { Workspace, ParsedSource } from '../parsing/index.js';
import {
  ValidationError,
  ValidationResult,
  createError,
  createSuccessResult,
  createFailureResult,
  ErrorCodes,
} from './error.js';
import { validateAgainstSchema } from './schema-validator.js';

const VALID_SOURCE_TYPES = ['database', 'api', 'file_system', 'streaming', 'saas'] as const;

function stripWorkspaceProperties(obj: Record<string, unknown>): Record<string, unknown> {
  const { file: _file, line: _line, layer: _layer, ...rest } = obj;
  return rest;
}
const API_PROTOCOLS = ['http', 'https', 'grpc'] as const;
const STREAMING_PROTOCOLS = ['ws', 'wss', 'kafka', 'mqtt', 'amqp'] as const;
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const FILE_FORMATS = ['parquet', 'csv', 'json', 'avro', 'fixed-width', 'orc', 'delta'] as const;

export class Validator {
  private workspace: Workspace;
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private graph: DependencyGraph;

  constructor(workspace: Workspace) {
    this.workspace = workspace;
    this.graph = buildDependencyGraph(workspace);
  }

  validate(): ValidationResult {
    this.validateSchema();
    this.validateUniqueResourceNames();
    this.validateCrossResourceReferences();
    this.validateStepTypeCoherence();
    this.validateGraphIntegrity();
    this.validateContractConsistency();
    this.validateBreakingChanges();
    this.validateSources();

    if (this.errors.length > 0) {
      return createFailureResult(this.errors, this.warnings);
    }

    return createSuccessResult(this.warnings);
  }

  private validateResourceSchema(
    resources: any[],
    type: 'source' | 'dataset' | 'contract' | 'flow' | 'platform',
  ): void {
    for (const resource of resources) {
      const result = validateAgainstSchema(stripWorkspaceProperties(resource), type);
      if (!result.valid) {
        for (const error of result.errors) {
          this.errors.push(
            createError(
              `Schema validation error: ${error}`,
              { file: resource.file, line: resource.line },
              'error',
              ErrorCodes.SCHEMA_VALIDATION,
            ),
          );
        }
      }
    }
  }

  private validateSchema(): void {
    this.validateResourceSchema(this.workspace.sources, 'source');
    this.validateResourceSchema(this.workspace.datasets, 'dataset');
    this.validateResourceSchema(this.workspace.contracts, 'contract');
    this.validateResourceSchema(this.workspace.flows, 'flow');
    if (this.workspace.platform) {
      this.validateResourceSchema([this.workspace.platform], 'platform');
    }
  }

  private validateSources(): void {
    for (const source of this.workspace.sources) {
      this.validateSourceType(source);
      this.validateSourceFields(source);
      this.validateSourceEntities(source);
    }
  }

  private validateSourceType(source: ParsedSource): void {
    if (!VALID_SOURCE_TYPES.includes(source.type as any)) {
      this.errors.push(
        createError(
          `Invalid source type '${source.type}'. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}`,
          { file: source.file, line: source.line },
          'error',
          'INVALID_SOURCE_TYPE',
        ),
      );
    }
  }

  private validateSourceFields(source: ParsedSource): void {
    const type = source.type;

    if (type === 'api' || type === 'streaming') {
      if (!(source as any).protocol) {
        this.errors.push(
          createError(
            `${type === 'api' ? 'API' : 'Streaming'} source must declare 'protocol' field`,
            { file: source.file, line: source.line },
            'error',
            'MISSING_SOURCE_PROTOCOL',
          ),
        );
      }
      if (!(source as any).baseUrl) {
        this.errors.push(
          createError(
            `${type === 'api' ? 'API' : 'Streaming'} source must declare 'baseUrl' field`,
            { file: source.file, line: source.line },
            'error',
            'MISSING_SOURCE_BASEURL',
          ),
        );
      }
    }

    if (type === 'api' && (source as any).protocol) {
      const protocol = (source as any).protocol;
      if (!API_PROTOCOLS.includes(protocol)) {
        this.errors.push(
          createError(
            `Invalid API protocol '${protocol}'. Must be one of: ${API_PROTOCOLS.join(', ')}`,
            { file: source.file, line: source.line },
            'error',
            'INVALID_SOURCE_PROTOCOL',
          ),
        );
      }
    }

    if (type === 'streaming' && (source as any).protocol) {
      const protocol = (source as any).protocol;
      if (!STREAMING_PROTOCOLS.includes(protocol)) {
        this.errors.push(
          createError(
            `Invalid streaming protocol '${protocol}'. Must be one of: ${STREAMING_PROTOCOLS.join(', ')}`,
            { file: source.file, line: source.line },
            'error',
            'INVALID_SOURCE_PROTOCOL',
          ),
        );
      }
    }

    if (type === 'saas') {
      if (!(source as any).provider) {
        this.errors.push(
          createError(
            "SaaS source must declare 'provider' field",
            { file: source.file, line: source.line },
            'error',
            'MISSING_SOURCE_PROVIDER',
          ),
        );
      }
    }

    const forbiddenChecks: Record<string, string[]> = {
      database: ['protocol', 'baseUrl', 'provider'],
      file_system: ['protocol', 'baseUrl', 'provider'],
      saas: ['protocol', 'baseUrl'],
      api: ['provider'],
      streaming: ['provider'],
    };

    const forbidden = forbiddenChecks[type] || [];
    for (const field of forbidden) {
      if ((source as any)[field] !== undefined) {
        this.errors.push(
          createError(
            `${this.getTypeDisplayName(type)} source cannot have '${field}' field`,
            { file: source.file, line: source.line },
            'error',
            'FORBIDDEN_FIELD_ON_SOURCE',
          ),
        );
      }
    }
  }

  private validateSourceEntities(source: ParsedSource): void {
    const entities = source.entities || [];
    for (const entity of entities) {
      this.validateDeprecatedFields(entity, source);
      this.validateEntityContract(entity, source);

      switch (source.type) {
        case 'database':
          this.validateDatabaseEntity(entity, source);
          break;
        case 'api':
          this.validateApiEntity(entity, source);
          break;
        case 'file_system':
          this.validateFileSystemEntity(entity, source);
          break;
        case 'streaming':
          this.validateStreamingEntity(entity, source);
          break;
        case 'saas':
          this.validateSaasEntity(entity, source);
          break;
      }
    }
  }

  private validateDeprecatedFields(entity: any, source: ParsedSource): void {
    const line = entity.line || source.line;

    if (entity.pattern !== undefined) {
      this.errors.push(
        createError(
          "Field 'pattern' is deprecated. Use 'location' instead",
          { file: source.file, line },
          'error',
          'DEPRECATED_FIELD',
        ),
      );
    }

    if (entity.pathParams !== undefined) {
      this.errors.push(
        createError(
          "Field 'pathParams' is deprecated. Use path templates in 'location' instead (e.g., '/users/{id}')",
          { file: source.file, line },
          'error',
          'DEPRECATED_FIELD',
        ),
      );
    }

    if (entity.queryParams !== undefined) {
      this.errors.push(
        createError(
          "Field 'queryParams' is deprecated. Implementation tools should handle query parameters",
          { file: source.file, line },
          'error',
          'DEPRECATED_FIELD',
        ),
      );
    }
  }

  private validateEntityContract(entity: any, source: ParsedSource): void {
    const line = entity.line || source.line;

    if (!entity.contract) {
      this.errors.push(
        createError(
          `Source entity '${entity.name}' must declare a contract reference`,
          { file: source.file, line },
          'error',
          'MISSING_ENTITY_CONTRACT',
        ),
      );
      return;
    }

    if (!entity.contract.name) {
      this.errors.push(
        createError(
          `Source entity '${entity.name}' contract must have a name`,
          { file: source.file, line },
          'error',
          'MISSING_ENTITY_CONTRACT',
        ),
      );
    }

    if (!entity.contract.version) {
      this.errors.push(
        createError(
          `Source entity '${entity.name}' contract must have a version`,
          { file: source.file, line },
          'error',
          'MISSING_ENTITY_CONTRACT',
        ),
      );
    }
  }

  private validateContractReference(
    contractRef: { name: string; version: string },
    entityName: string,
    file: string,
    line: number,
  ): void {
    const contractExists = this.workspace.contracts.some((c) => c.name === contractRef.name);
    if (!contractExists) {
      this.errors.push(
        createError(
          `Contract '${contractRef.name}' referenced by source entity '${entityName}' not found`,
          { file, line },
          'error',
          'UNRESOLVED_CONTRACT',
        ),
      );
      return;
    }

    const contract = this.workspace.contracts.find((c) => c.name === contractRef.name);
    if (contract && contract.version !== contractRef.version) {
      this.errors.push(
        createError(
          `Contract '${contractRef.name}' version '${contractRef.version}' not found. Available version: ${contract.version}`,
          { file, line },
          'error',
          'UNRESOLVED_CONTRACT_VERSION',
        ),
      );
    }
  }

  private validateDatabaseEntity(entity: any, source: ParsedSource): void {
    const line = entity.line || source.line;

    if (!entity.location) {
      this.errors.push(
        createError(
          `Database entity '${entity.name}' must declare 'location' field`,
          { file: source.file, line },
          'error',
          'MISSING_ENTITY_LOCATION',
        ),
      );
    } else {
      const locationPattern = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
      if (!locationPattern.test(entity.location)) {
        this.errors.push(
          createError(
            `Database location must be a logical identifier (e.g., 'schema.table'), got '${entity.location}'`,
            { file: source.file, line },
            'error',
            'INVALID_LOCATION_FORMAT',
          ),
        );
      }
    }

    if (entity.contract) {
      this.validateContractReference(entity.contract, entity.name, source.file, line);
    }

    const forbiddenFields = ['method', 'format', 'partition_by'];
    for (const field of forbiddenFields) {
      if (entity[field] !== undefined) {
        this.errors.push(
          createError(
            `Database entity cannot have '${field}' field`,
            { file: source.file, line },
            'error',
            'FORBIDDEN_FIELD_ON_ENTITY',
          ),
        );
      }
    }
  }

  private validateApiEntity(entity: any, source: ParsedSource): void {
    const line = entity.line || source.line;

    if (!entity.location) {
      this.errors.push(
        createError(
          `API entity '${entity.name}' must declare 'location' field`,
          { file: source.file, line },
          'error',
          'MISSING_ENTITY_LOCATION',
        ),
      );
    } else if (!entity.location.startsWith('/')) {
      this.errors.push(
        createError(
          `API location must be a URL path starting with '/', got '${entity.location}'`,
          { file: source.file, line },
          'error',
          'INVALID_LOCATION_FORMAT',
        ),
      );
    }

    if (!entity.method) {
      this.errors.push(
        createError(
          `API entity '${entity.name}' must declare 'method' field`,
          { file: source.file, line },
          'error',
          'MISSING_ENTITY_METHOD',
        ),
      );
    } else {
      const protocol = (source as any).protocol;
      if (
        (protocol === 'http' || protocol === 'https') &&
        !HTTP_METHODS.includes(entity.method.toUpperCase())
      ) {
        this.errors.push(
          createError(
            `Invalid HTTP method '${entity.method}'. Must be one of: ${HTTP_METHODS.join(', ')}`,
            { file: source.file, line },
            'error',
            'INVALID_HTTP_METHOD',
          ),
        );
      }
    }

    if (entity.contract) {
      this.validateContractReference(entity.contract, entity.name, source.file, line);
    }

    const forbiddenFields = ['format', 'partition_by'];
    for (const field of forbiddenFields) {
      if (entity[field] !== undefined) {
        this.errors.push(
          createError(
            `API entity cannot have '${field}' field`,
            { file: source.file, line },
            'error',
            'FORBIDDEN_FIELD_ON_ENTITY',
          ),
        );
      }
    }
  }

  private validateFileSystemEntity(entity: any, source: ParsedSource): void {
    const line = entity.line || source.line;

    if (!entity.location) {
      this.errors.push(
        createError(
          `File system entity '${entity.name}' must declare 'location' field`,
          { file: source.file, line },
          'error',
          'MISSING_ENTITY_LOCATION',
        ),
      );
    } else {
      const validPath =
        entity.location.startsWith('/') ||
        entity.location.startsWith('.') ||
        /^[a-z][a-z0-9]*:\/\//.test(entity.location);
      if (!validPath) {
        this.errors.push(
          createError(
            `File system location must be a file path or URI, got '${entity.location}'`,
            { file: source.file, line },
            'error',
            'INVALID_LOCATION_FORMAT',
          ),
        );
      }
    }

    if (!entity.format) {
      this.errors.push(
        createError(
          `File system entity '${entity.name}' must declare 'format' field`,
          { file: source.file, line },
          'error',
          'MISSING_ENTITY_FORMAT',
        ),
      );
    } else if (!FILE_FORMATS.includes(entity.format)) {
      this.errors.push(
        createError(
          `Invalid format '${entity.format}'. Must be one of: ${FILE_FORMATS.join(', ')}`,
          { file: source.file, line },
          'error',
          'INVALID_FORMAT_VALUE',
        ),
      );
    }

    if (entity.contract) {
      this.validateContractReference(entity.contract, entity.name, source.file, line);
    }

    if (entity.partition_by !== undefined && !Array.isArray(entity.partition_by)) {
      this.errors.push(
        createError(
          `File system entity '${entity.name}' partition_by must be an array of strings`,
          { file: source.file, line },
          'error',
          'INVALID_FORMAT_VALUE',
        ),
      );
    }

    const forbiddenFields = ['method'];
    for (const field of forbiddenFields) {
      if (entity[field] !== undefined) {
        this.errors.push(
          createError(
            `File system entity cannot have '${field}' field`,
            { file: source.file, line },
            'error',
            'FORBIDDEN_FIELD_ON_ENTITY',
          ),
        );
      }
    }
  }

  private validateStreamingEntity(entity: any, source: ParsedSource): void {
    const line = entity.line || source.line;

    if (!entity.location) {
      this.errors.push(
        createError(
          `Streaming entity '${entity.name}' must declare 'location' field (topic, queue, or channel address)`,
          { file: source.file, line },
          'error',
          'MISSING_ENTITY_LOCATION',
        ),
      );
    }

    if (entity.contract) {
      this.validateContractReference(entity.contract, entity.name, source.file, line);
    }

    const forbiddenFields = ['method', 'format', 'partition_by'];
    for (const field of forbiddenFields) {
      if (entity[field] !== undefined) {
        this.errors.push(
          createError(
            `Streaming entity cannot have '${field}' field`,
            { file: source.file, line },
            'error',
            'FORBIDDEN_FIELD_ON_ENTITY',
          ),
        );
      }
    }
  }

  private validateSaasEntity(entity: any, source: ParsedSource): void {
    const line = entity.line || source.line;

    if (entity.contract) {
      this.validateContractReference(entity.contract, entity.name, source.file, line);
    }

    const forbiddenFields = ['method', 'format', 'partition_by'];
    for (const field of forbiddenFields) {
      if (entity[field] !== undefined) {
        this.errors.push(
          createError(
            `SaaS entity cannot have '${field}' field`,
            { file: source.file, line },
            'error',
            'FORBIDDEN_FIELD_ON_ENTITY',
          ),
        );
      }
    }
  }

  private getTypeDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      database: 'Database',
      api: 'API',
      file_system: 'File system',
      streaming: 'Streaming',
      saas: 'SaaS',
    };
    return displayNames[type] || type;
  }

  private validateUniqueResourceNames(): void {
    // Validate source name uniqueness
    const seenSources = new Map<string, { file: string; line: number }>();
    for (const source of this.workspace.sources) {
      if (seenSources.has(source.name)) {
        this.errors.push(
          createError(
            `Duplicate source name '${source.name}'`,
            { file: source.file, line: source.line },
            'error',
            ErrorCodes.DUPLICATE_SOURCE_NAME,
          ),
        );
      } else {
        seenSources.set(source.name, { file: source.file, line: source.line });
      }
    }

    // Validate dataset name uniqueness
    const seenDatasets = new Map<string, { file: string; line: number }>();
    for (const dataset of this.workspace.datasets) {
      if (seenDatasets.has(dataset.name)) {
        this.errors.push(
          createError(
            `Duplicate dataset name '${dataset.name}'`,
            { file: dataset.file, line: dataset.line },
            'error',
            ErrorCodes.DUPLICATE_DATASET_NAME,
          ),
        );
      } else {
        seenDatasets.set(dataset.name, { file: dataset.file, line: dataset.line });
      }
    }

    // Validate contract name uniqueness
    const seenContracts = new Map<string, { file: string; line: number }>();
    for (const contract of this.workspace.contracts) {
      if (seenContracts.has(contract.name)) {
        this.errors.push(
          createError(
            `Duplicate contract name '${contract.name}'`,
            { file: contract.file, line: contract.line },
            'error',
            ErrorCodes.DUPLICATE_CONTRACT_NAME,
          ),
        );
      } else {
        seenContracts.set(contract.name, { file: contract.file, line: contract.line });
      }
    }

    // Validate flow name uniqueness
    const seenFlows = new Map<string, { file: string; line: number }>();
    for (const flow of this.workspace.flows) {
      if (seenFlows.has(flow.name)) {
        this.errors.push(
          createError(
            `Duplicate flow name '${flow.name}'`,
            { file: flow.file, line: flow.line },
            'error',
            ErrorCodes.DUPLICATE_FLOW_NAME,
          ),
        );
      } else {
        seenFlows.set(flow.name, { file: flow.file, line: flow.line });
      }
    }
  }

  private validateCrossResourceReferences(): void {
    for (const flow of this.workspace.flows) {
      const priorOutputs = new Set<string>();
      for (const step of flow.steps) {
        if (step.type === 'extract') {
          const sourceExists = this.workspace.sources.some((s) => s.name === step.source);
          if (!sourceExists) {
            this.errors.push(
              createError(
                `Undefined source reference '${step.source}' in flow '${flow.name}'`,
                { file: flow.file, line: flow.line },
                'error',
                'UNRESOLVED_SOURCE',
              ),
            );
          }
          priorOutputs.add(step.output);
        } else if (step.type === 'transform') {
          for (const input of step.inputs) {
            if (!priorOutputs.has(input)) {
              this.errors.push(
                createError(
                  `Unresolved input '${input}' in transform step of flow '${flow.name}': no prior step produces this output`,
                  { file: flow.file, line: flow.line },
                  'error',
                  'UNRESOLVED_STEP_OUTPUT',
                ),
              );
            }
          }
          priorOutputs.add(step.output);
        } else if (step.type === 'load') {
          const datasetExists = this.workspace.datasets.some((d) => d.name === step.target);
          if (!datasetExists) {
            this.errors.push(
              createError(
                `Undefined dataset reference '${step.target}' in flow '${flow.name}'`,
                { file: flow.file, line: flow.line },
                'error',
                'UNRESOLVED_DATASET',
              ),
            );
          }
        }
      }
    }

    for (const dataset of this.workspace.datasets) {
      if (dataset.contract) {
        const contractExists = this.workspace.contracts.some(
          (c) => c.name === dataset.contract?.name,
        );
        if (!contractExists) {
          this.errors.push(
            createError(
              `Undefined contract reference '${dataset.contract.name}' in dataset '${dataset.name}'`,
              { file: dataset.file, line: dataset.line },
              'error',
              'UNRESOLVED_CONTRACT',
            ),
          );
        }
      }

      // Task 5.4: Validate unresolved flow reference in dataset produced_by
      if (dataset.producedBy) {
        const flowExists = this.workspace.flows.some((f) => f.name === dataset.producedBy);
        if (!flowExists) {
          this.errors.push(
            createError(
              `Undefined flow reference '${dataset.producedBy}' in dataset '${dataset.name}' produced_by declaration`,
              { file: dataset.file, line: dataset.line },
              'error',
              'UNRESOLVED_FLOW',
            ),
          );
        } else {
          // Verify the flow actually produces this dataset
          const flow = this.workspace.flows.find((f) => f.name === dataset.producedBy);
          if (flow) {
            const producesDataset = flow.steps.some(
              (s) => s.type === 'load' && s.target === dataset.name,
            );
            if (!producesDataset) {
              this.errors.push(
                createError(
                  `Flow '${dataset.producedBy}' declared in dataset '${dataset.name}' does not produce this dataset`,
                  { file: dataset.file, line: dataset.line },
                  'error',
                  'INVALID_FLOW_REFERENCE',
                ),
              );
            }
          }
        }
      }
    }
  }

  private validateStepTypeCoherence(): void {
    for (const flow of this.workspace.flows) {
      for (const step of flow.steps) {
        if (step.type === 'extract') {
          const sourceExists = this.workspace.sources.some((s) => s.name === step.source);
          if (!sourceExists) {
            continue;
          }

          const source = this.workspace.sources.find((s) => s.name === step.source);
          if (
            source &&
            source.type !== 'database' &&
            source.type !== 'api' &&
            source.type !== 'file_system' &&
            source.type !== 'saas'
          ) {
            this.errors.push(
              createError(
                `Extract step must reference a source, but '${step.source}' is not a valid source type`,
                { file: flow.file, line: flow.line },
                'error',
                'INVALID_STEP_TYPE',
              ),
            );
          }
        }
      }
    }
  }

  private validateGraphIntegrity(): void {
    // Task 4.1: Cycle detection in flow dependencies
    const cycles = detectCycles(this.graph);
    if (cycles.length > 0) {
      for (const cycle of cycles) {
        const cycleNodes = cycle
          .map((id) => {
            const node = this.graph.nodes.get(id);
            return node ? `${node.type}:${node.name}` : id;
          })
          .join(' → ');

        this.errors.push(
          createError(
            `Circular dependency detected: ${cycleNodes}`,
            { file: 'workspace', line: 0 },
            'error',
            'CIRCULAR_DEPENDENCY',
          ),
        );
      }
    }

    const producedDatasets = new Set<string>();

    for (const flow of this.workspace.flows) {
      for (const step of flow.steps) {
        if (step.type === 'load') {
          producedDatasets.add(step.target);
        }
      }
    }

    for (const dataset of this.workspace.datasets) {
      const isProduced = producedDatasets.has(dataset.name);

      if (!isProduced && this.workspace.flows.length > 0) {
        this.warnings.push(
          createError(
            `Orphaned dataset '${dataset.name}' - not produced by any flow`,
            { file: dataset.file, line: dataset.line },
            'warning',
            'ORPHANED_DATASET',
          ),
        );
      }
    }

    // Task 4.3: Incomplete pipeline detection
    for (const flow of this.workspace.flows) {
      const hasExtract = flow.steps.some((s) => s.type === 'extract');
      const hasTransform = flow.steps.some((s) => s.type === 'transform');
      const hasLoad = flow.steps.some((s) => s.type === 'load');

      // A complete ETL pipeline should ideally have all three stages
      // Though we allow flexibility, we warn if stages are missing
      if (!hasExtract && (hasTransform || hasLoad)) {
        this.warnings.push(
          createError(
            `Flow '${flow.name}' is missing extract steps - pipeline may be incomplete`,
            { file: flow.file, line: flow.line },
            'warning',
            'INCOMPLETE_PIPELINE',
          ),
        );
      }

      if (hasExtract && !hasLoad) {
        this.warnings.push(
          createError(
            `Flow '${flow.name}' has extract but no load steps - data may not be persisted`,
            { file: flow.file, line: flow.line },
            'warning',
            'INCOMPLETE_PIPELINE',
          ),
        );
      }

      // Check for orphaned transform steps (transform without preceding extract)
      const extractIndices = flow.steps
        .map((s, i) => (s.type === 'extract' ? i : -1))
        .filter((i) => i !== -1);
      const transformIndices = flow.steps
        .map((s, i) => (s.type === 'transform' ? i : -1))
        .filter((i) => i !== -1);

      for (const transformIdx of transformIndices) {
        const hasPrecedingExtract = extractIndices.some((extractIdx) => extractIdx < transformIdx);
        if (!hasPrecedingExtract) {
          this.warnings.push(
            createError(
              `Transform step in flow '${flow.name}' has no preceding extract step`,
              { file: flow.file, line: flow.line },
              'warning',
              'INCOMPLETE_PIPELINE',
            ),
          );
        }
      }
    }
  }

  private validateContractConsistency(): void {
    const validTypes = [
      'uuid',
      'string',
      'integer',
      'decimal',
      'boolean',
      'timestamp',
      'date',
      'json',
    ];

    for (const contract of this.workspace.contracts) {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      if (!semverRegex.test(contract.version)) {
        this.errors.push(
          createError(
            `Invalid semantic version '${contract.version}' in contract '${contract.name}'. Expected format: X.Y.Z`,
            { file: contract.file, line: contract.line },
            'error',
            'INVALID_VERSION',
          ),
        );
      }

      for (const field of contract.fields) {
        if (!validTypes.includes(field.type)) {
          this.errors.push(
            createError(
              `Invalid field type '${field.type}' in contract '${contract.name}'. Valid types: ${validTypes.join(', ')}`,
              { file: contract.file, line: contract.line },
              'error',
              'INVALID_FIELD_TYPE',
            ),
          );
        }

        if (field.constraints) {
          if (field.type === 'json' && field.constraints.unique) {
            this.errors.push(
              createError(
                `Constraint 'unique' is not valid for JSON fields in contract '${contract.name}'`,
                { file: contract.file, line: contract.line },
                'error',
                'INVALID_CONSTRAINT',
              ),
            );
          }

          // Task 4.4: Validate precision/scale only on decimal type
          if (
            (field.constraints.precision !== undefined || field.constraints.scale !== undefined) &&
            field.type !== 'decimal'
          ) {
            this.errors.push(
              createError(
                `Constraint 'precision/scale' is only valid for decimal fields in contract '${contract.name}'`,
                { file: contract.file, line: contract.line },
                'error',
                'INVALID_CONSTRAINT',
              ),
            );
          }

          // Task 4.5: Validate min/max only on numeric types (integer or decimal)
          if (
            (field.constraints.min !== undefined || field.constraints.max !== undefined) &&
            field.type !== 'integer' &&
            field.type !== 'decimal'
          ) {
            this.errors.push(
              createError(
                `Constraint 'min/max' is only valid for integer or decimal fields in contract '${contract.name}'`,
                { file: contract.file, line: contract.line },
                'error',
                'INVALID_CONSTRAINT',
              ),
            );
          }

          // Validate min_length/max_length only on string type
          if (
            (field.constraints.min_length !== undefined ||
              field.constraints.max_length !== undefined) &&
            field.type !== 'string'
          ) {
            this.errors.push(
              createError(
                `Constraint 'min_length/max_length' is only valid for string fields in contract '${contract.name}'`,
                { file: contract.file, line: contract.line },
                'error',
                'INVALID_CONSTRAINT',
              ),
            );
          }

          // Validate format/pattern only on string type
          if (
            (field.constraints.format !== undefined || field.constraints.pattern !== undefined) &&
            field.type !== 'string'
          ) {
            this.errors.push(
              createError(
                `Constraint 'format/pattern' is only valid for string fields in contract '${contract.name}'`,
                { file: contract.file, line: contract.line },
                'error',
                'INVALID_CONSTRAINT',
              ),
            );
          }
        }
      }
    }
  }

  private validateBreakingChanges(): void {
    const sourceFields = new Map<string, Set<string>>();

    for (const contract of this.workspace.contracts) {
      const fields = new Set(contract.fields.map((f) => f.name));
      sourceFields.set(contract.name, fields);
    }

    const datasetContractMap = new Map<string, string>();
    for (const dataset of this.workspace.datasets) {
      if (dataset.contract) {
        datasetContractMap.set(dataset.name, dataset.contract.name);
      }
    }

    for (const flow of this.workspace.flows) {
      for (const step of flow.steps) {
        if (step.type === 'load') {
          const contractName = datasetContractMap.get(step.target);
          if (contractName) {
            const fields = sourceFields.get(contractName);
            if (fields && fields.size === 0) {
              this.errors.push(
                createError(
                  `Breaking change: Contract '${contractName}' has no fields but is referenced by flow '${flow.name}'`,
                  { file: flow.file, line: flow.line },
                  'error',
                  'BREAKING_CHANGE',
                ),
              );
            }
          }
        }
      }
    }

    // Task 8.3 & 8.4: Type narrowing and constraint tightening detection
    for (const contract of this.workspace.contracts) {
      for (const field of contract.fields) {
        // Task 8.3: Check for type narrowing that could be breaking
        const narrowingIssues = this.detectTypeNarrowing(field);
        // Task 8.4: Check for constraint tightening
        const constraintIssues = this.detectConstraintTightening(field);

        if (narrowingIssues.length > 0 || constraintIssues.length > 0) {
          // Find all datasets and flows that use this contract
          const affectedResources = this.getAffectedResources(contract.name);

          if (affectedResources.length > 0) {
            const allIssues = [...narrowingIssues, ...constraintIssues];
            const downstreamResources = affectedResources.map((r) => `${r.type}:${r.name}`);

            this.warnings.push(
              createError(
                `Potential breaking change in contract '${contract.name}', field '${field.name}': ${allIssues.join('; ')}. Affected: ${downstreamResources.join(', ')}`,
                { file: contract.file, line: (field as any).line ?? contract.line },
                'warning',
                'POTENTIAL_BREAKING_CHANGE',
              ),
            );
          }
        }
      }
    }

    // Task 8.5 & 8.6: Multi-hop breaking change detection with impact chain
    for (const contract of this.workspace.contracts) {
      const contractId = `contract:${contract.name}`;
      const downstream = getDownstream(this.graph, contractId);

      // Task 8.5: Multi-hop detection - traverse full impact chain
      const allAffectedResources = this.collectAllAffectedResources(contractId);

      // Task 8.6: Report all affected resources in breaking change errors
      if (allAffectedResources.length > 0) {
        // Group affected resources by hop distance
        const directAffected = downstream.filter((n) => n.type !== 'contract');
        const indirectAffected = allAffectedResources.filter(
          (r) => !directAffected.some((d) => d.type === r.type && d.name === r.name),
        );

        const affectedNames = allAffectedResources.map((n) => `${n.type}:${n.name}`);

        if (indirectAffected.length > 0) {
          // Multi-hop impact detected
          this.warnings.push(
            createError(
              `Multi-hop impact: Changes to contract '${contract.name}' affect ${allAffectedResources.length} resources through dependency chain. All affected: ${affectedNames.join(', ')}`,
              { file: contract.file, line: contract.line },
              'warning',
              'MULTI_HOP_IMPACT',
            ),
          );
        }
      }
    }
  }

  /**
   * Detect type narrowing issues in a field
   * Task 8.3: Type narrowing breaking change detection
   */
  private detectTypeNarrowing(field: {
    name: string;
    type: string;
    constraints?: Record<string, unknown>;
  }): string[] {
    const issues: string[] = [];

    // String type narrowing
    if (field.type === 'string' && field.constraints) {
      if (field.constraints.max_length && Number(field.constraints.max_length) < 1000) {
        issues.push(`max_length constraint tightens string length`);
      }
      if (field.constraints.pattern) {
        issues.push(`pattern constraint '${field.constraints.pattern}' narrows string type`);
      }
    }

    // Numeric type narrowing
    if (field.type === 'decimal' || field.type === 'integer') {
      if (field.constraints?.precision !== undefined && field.constraints?.scale !== undefined) {
        // Precision constraints narrow the type
        issues.push(`precision/scale constraints narrow numeric type`);
      }
    }

    // Timestamp/date narrowing
    if (field.type === 'timestamp' || field.type === 'date') {
      if (field.constraints?.format) {
        issues.push(`format constraint '${field.constraints.format}' narrows temporal type`);
      }
    }

    return issues;
  }

  /**
   * Detect constraint tightening issues in a field
   * Task 8.4: Constraint tightening breaking change detection
   */
  private detectConstraintTightening(field: {
    name: string;
    type: string;
    constraints?: Record<string, unknown>;
  }): string[] {
    const issues: string[] = [];

    if (!field.constraints) {
      return issues;
    }

    // Not null constraint is a significant tightening
    if (field.constraints.not_null === true) {
      issues.push('not_null constraint makes field required');
    }

    // Unique constraint is a significant tightening
    if (field.constraints.unique === true && field.type !== 'json') {
      issues.push('unique constraint adds uniqueness requirement');
    }

    // Minimum/maximum constraints tighten numeric ranges
    if (field.constraints.minimum !== undefined) {
      issues.push(`minimum constraint tightens lower bound`);
    }
    if (field.constraints.maximum !== undefined) {
      issues.push(`maximum constraint tightens upper bound`);
    }

    // Task 4.2: min/max constraint tightening detection
    if (field.constraints.min !== undefined) {
      issues.push(`min constraint tightens lower bound`);
    }
    if (field.constraints.max !== undefined) {
      issues.push(`max constraint tightens upper bound`);
    }

    // Task 4.3: precision/scale constraint tightening detection
    if (field.constraints.precision !== undefined) {
      issues.push(`precision constraint limits total digits`);
    }
    if (field.constraints.scale !== undefined) {
      issues.push(`scale constraint limits decimal places`);
    }

    // String length constraint tightening
    if (field.constraints.min_length !== undefined) {
      issues.push(`min_length constraint tightens string length`);
    }
    if (field.constraints.max_length !== undefined) {
      issues.push(`max_length constraint tightens string length`);
    }

    // Exclusive minimum/maximum are tighter than inclusive
    if (field.constraints.exclusive_minimum === true) {
      issues.push('exclusive_minimum constraint tightens lower bound');
    }
    if (field.constraints.exclusive_maximum === true) {
      issues.push('exclusive_maximum constraint tightens upper bound');
    }

    // Enum constraint significantly narrows values
    if (field.constraints.enum) {
      issues.push(
        `enum constraint limits to ${(field.constraints.enum as unknown[]).length} allowed values`,
      );
    }

    // Max items/items constraints tighten collections
    if (field.constraints.max_items !== undefined) {
      issues.push('max_items constraint limits collection size');
    }

    return issues;
  }

  /**
   * Get all resources directly affected by a contract
   * Task 8.6: Report all affected resources
   */
  private getAffectedResources(contractName: string): Array<{ type: string; name: string }> {
    const affected: Array<{ type: string; name: string }> = [];

    // Find datasets using this contract
    const affectedDatasets = this.workspace.datasets.filter(
      (d) => d.contract?.name === contractName,
    );
    affected.push(...affectedDatasets.map((d) => ({ type: 'dataset', name: d.name })));

    // Find flows that load to datasets using this contract
    for (const dataset of affectedDatasets) {
      const affectedFlows = this.workspace.flows.filter((f) =>
        f.steps.some((s) => s.type === 'load' && s.target === dataset.name),
      );
      affected.push(...affectedFlows.map((f) => ({ type: 'flow', name: f.name })));
    }

    return affected;
  }

  /**
   * Collect all affected resources through multi-hop dependency chain
   * Task 8.5: Multi-hop breaking change detection
   */
  private collectAllAffectedResources(nodeId: string): Array<{ type: string; name: string }> {
    const visited = new Set<string>();
    const affected: Array<{ type: string; name: string }> = [];

    const traverse = (currentId: string) => {
      const downstream = getDownstream(this.graph, currentId);

      for (const node of downstream) {
        if (!visited.has(node.id)) {
          visited.add(node.id);
          // Skip contracts in the affected list (we care about datasets and flows)
          if (node.type !== 'contract') {
            affected.push({ type: node.type, name: node.name });
          }
          // Continue traversing
          traverse(node.id);
        }
      }
    };

    traverse(nodeId);
    return affected;
  }
}

/**
 * Validates a DataSpec workspace for consistency and integrity.
 * Runs all validation phases:
 * - Cross-resource reference validation
 * - Step type coherence validation
 * - Graph integrity (cycles, orphaned resources)
 * - Contract consistency (field types, constraints)
 * - Breaking change detection
 * @param workspace - The parsed workspace to validate
 * @returns ValidationResult with errors, warnings, and pass status
 */
export function validateWorkspace(workspace: Workspace): ValidationResult {
  const validator = new Validator(workspace);
  return validator.validate();
}
