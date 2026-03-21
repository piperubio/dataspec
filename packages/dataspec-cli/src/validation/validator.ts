import { buildDependencyGraph } from '../graph/builder.js';
import { detectCycles, getDownstream, DependencyGraph } from '../graph/index.js';
import { Workspace } from '../parsing/index.js';
import {
  ValidationError,
  ValidationResult,
  createError,
  createSuccessResult,
  createFailureResult,
  ErrorCodes,
} from './error.js';

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
    this.validateUniqueResourceNames();
    this.validateCrossResourceReferences();
    this.validateStepTypeCoherence();
    this.validateGraphIntegrity();
    this.validateContractConsistency();
    this.validateBreakingChanges();

    if (this.errors.length > 0) {
      return createFailureResult(this.errors, this.warnings);
    }

    return createSuccessResult(this.warnings);
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
      if (field.constraints.format) {
        // Adding a format constraint narrows the type
        issues.push(`format constraint '${field.constraints.format}' narrows string type`);
      }
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
