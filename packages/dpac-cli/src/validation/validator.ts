import { Workspace } from '../parsing/index.js';
import { detectCycles, getDownstream, getImpactChain,  DependencyGraph } from '../graph/index.js';
import { buildDependencyGraph } from '../graph/builder.js';
import { ValidationError, ValidationResult, createError, createSuccessResult, createFailureResult } from './error.js';

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

  private validateCrossResourceReferences(): void {
    for (const flow of this.workspace.flows) {
      const priorOutputs = new Set<string>();
      for (const step of flow.steps) {
        if (step.type === 'extract') {
          const sourceExists = this.workspace.sources.some(s => s.name === step.source);
          if (!sourceExists) {
            this.errors.push(createError(
              `Undefined source reference '${step.source}' in flow '${flow.name}'`,
              { file: flow.file, line: flow.line },
              'error',
              'UNRESOLVED_SOURCE'
            ));
          }
          priorOutputs.add(step.output);
        } else if (step.type === 'transform') {
          for (const input of step.inputs) {
            if (!priorOutputs.has(input)) {
              this.errors.push(createError(
                `Unresolved input '${input}' in transform step of flow '${flow.name}': no prior step produces this output`,
                { file: flow.file, line: flow.line },
                'error',
                'UNRESOLVED_STEP_OUTPUT'
              ));
            }
          }
          priorOutputs.add(step.output);
        } else if (step.type === 'load') {
          const datasetExists = this.workspace.datasets.some(d => d.name === step.target);
          if (!datasetExists) {
            this.errors.push(createError(
              `Undefined dataset reference '${step.target}' in flow '${flow.name}'`,
              { file: flow.file, line: flow.line },
              'error',
              'UNRESOLVED_DATASET'
            ));
          }
        }
      }
    }

    for (const dataset of this.workspace.datasets) {
      if (dataset.contract) {
        const contractExists = this.workspace.contracts.some(c => c.name === dataset.contract?.name);
        if (!contractExists) {
          this.errors.push(createError(
            `Undefined contract reference '${dataset.contract.name}' in dataset '${dataset.name}'`,
            { file: dataset.file, line: dataset.line },
            'error',
            'UNRESOLVED_CONTRACT'
          ));
        }
      }

      // Task 5.4: Validate unresolved flow reference in dataset produced_by
      if (dataset.producedBy) {
        const flowExists = this.workspace.flows.some(f => f.name === dataset.producedBy);
        if (!flowExists) {
          this.errors.push(createError(
            `Undefined flow reference '${dataset.producedBy}' in dataset '${dataset.name}' produced_by declaration`,
            { file: dataset.file, line: dataset.line },
            'error',
            'UNRESOLVED_FLOW'
          ));
        } else {
          // Verify the flow actually produces this dataset
          const flow = this.workspace.flows.find(f => f.name === dataset.producedBy);
          if (flow) {
            const producesDataset = flow.steps.some(s => s.type === 'load' && s.target === dataset.name);
            if (!producesDataset) {
              this.errors.push(createError(
                `Flow '${dataset.producedBy}' declared in dataset '${dataset.name}' does not produce this dataset`,
                { file: dataset.file, line: dataset.line },
                'error',
                'INVALID_FLOW_REFERENCE'
              ));
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
          const sourceExists = this.workspace.sources.some(s => s.name === step.source);
          if (!sourceExists) continue;
          
          const source = this.workspace.sources.find(s => s.name === step.source);
          if (source && source.type !== 'database' && source.type !== 'api' && source.type !== 'file_system' && source.type !== 'saas') {
            this.errors.push(createError(
              `Extract step must reference a source, but '${step.source}' is not a valid source type`,
              { file: flow.file, line: flow.line },
              'error',
              'INVALID_STEP_TYPE'
            ));
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
        const cycleNodes = cycle.map(id => {
          const node = this.graph.nodes.get(id);
          return node ? `${node.type}:${node.name}` : id;
        }).join(' → ');
        
        this.errors.push(createError(
          `Circular dependency detected: ${cycleNodes}`,
          { file: 'workspace', line: 0 },
          'error',
          'CIRCULAR_DEPENDENCY'
        ));
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
        this.warnings.push(createError(
          `Orphaned dataset '${dataset.name}' - not produced by any flow`,
          { file: dataset.file, line: dataset.line },
          'warning',
          'ORPHANED_DATASET'
        ));
      }
    }

    // Task 4.3: Incomplete pipeline detection
    for (const flow of this.workspace.flows) {
      const hasExtract = flow.steps.some(s => s.type === 'extract');
      const hasTransform = flow.steps.some(s => s.type === 'transform');
      const hasLoad = flow.steps.some(s => s.type === 'load');
      
      // A complete ETL pipeline should ideally have all three stages
      // Though we allow flexibility, we warn if stages are missing
      if (!hasExtract && (hasTransform || hasLoad)) {
        this.warnings.push(createError(
          `Flow '${flow.name}' is missing extract steps - pipeline may be incomplete`,
          { file: flow.file, line: flow.line },
          'warning',
          'INCOMPLETE_PIPELINE'
        ));
      }
      
      if (hasExtract && !hasLoad) {
        this.warnings.push(createError(
          `Flow '${flow.name}' has extract but no load steps - data may not be persisted`,
          { file: flow.file, line: flow.line },
          'warning',
          'INCOMPLETE_PIPELINE'
        ));
      }
      
      // Check for orphaned transform steps (transform without preceding extract)
      const extractIndices = flow.steps
        .map((s, i) => s.type === 'extract' ? i : -1)
        .filter(i => i !== -1);
      const transformIndices = flow.steps
        .map((s, i) => s.type === 'transform' ? i : -1)
        .filter(i => i !== -1);
      
      for (const transformIdx of transformIndices) {
        const hasPrecedingExtract = extractIndices.some(extractIdx => extractIdx < transformIdx);
        if (!hasPrecedingExtract) {
          this.warnings.push(createError(
            `Transform step in flow '${flow.name}' has no preceding extract step`,
            { file: flow.file, line: flow.line },
            'warning',
            'INCOMPLETE_PIPELINE'
          ));
        }
      }
    }
  }

  private validateContractConsistency(): void {
    const validTypes = ['uuid', 'string', 'integer', 'decimal', 'boolean', 'timestamp', 'date', 'json'];

    for (const contract of this.workspace.contracts) {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      if (!semverRegex.test(contract.version)) {
        this.errors.push(createError(
          `Invalid semantic version '${contract.version}' in contract '${contract.name}'. Expected format: X.Y.Z`,
          { file: contract.file, line: contract.line },
          'error',
          'INVALID_VERSION'
        ));
      }

      for (const field of contract.fields) {
        if (!validTypes.includes(field.type)) {
          this.errors.push(createError(
            `Invalid field type '${field.type}' in contract '${contract.name}'. Valid types: ${validTypes.join(', ')}`,
            { file: contract.file, line: contract.line },
            'error',
            'INVALID_FIELD_TYPE'
          ));
        }

        if (field.constraints) {
          if (field.type === 'json' && field.constraints.unique) {
            this.errors.push(createError(
              `Constraint 'unique' is not valid for JSON fields in contract '${contract.name}'`,
              { file: contract.file, line: contract.line },
              'error',
              'INVALID_CONSTRAINT'
            ));
          }
        }
      }
    }
  }

  private validateBreakingChanges(): void {
    const sourceFields = new Map<string, Set<string>>();

    for (const contract of this.workspace.contracts) {
      const fields = new Set(contract.fields.map(f => f.name));
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
              this.errors.push(createError(
                `Breaking change: Contract '${contractName}' has no fields but is referenced by flow '${flow.name}'`,
                { file: flow.file, line: flow.line },
                'error',
                'BREAKING_CHANGE'
              ));
            }
          }
        }
      }
    }

    // Task 8.3 & 8.4: Type narrowing and constraint tightening detection
    for (const contract of this.workspace.contracts) {
      for (const field of contract.fields) {
        // Check for type narrowing that could be breaking
        if (this.isTypeNarrowing(field.type, field.constraints)) {
          // Find all datasets and flows that use this contract
          const affectedDatasets = this.workspace.datasets.filter(d => d.contract?.name === contract.name);
          const affectedFlows = this.workspace.flows.filter(f => 
            f.steps.some(s => {
              if (s.type === 'load') {
                return this.workspace.datasets.find(d => d.name === s.target)?.contract?.name === contract.name;
              }
              return false;
            })
          );

          if (affectedDatasets.length > 0 || affectedFlows.length > 0) {
            const downstreamResources = affectedDatasets.map(d => `dataset:${d.name}`)
              .concat(affectedFlows.map(f => `flow:${f.name}`));
            
            this.warnings.push(createError(
              `Potential breaking change: Field '${field.name}' in contract '${contract.name}' has restrictive type/constraints. Affected: ${downstreamResources.join(', ')}`,
              { file: contract.file, line: contract.line },
              'warning',
              'POTENTIAL_BREAKING_CHANGE'
            ));
          }
        }
      }
    }

    // Task 8.5 & 8.6: Multi-hop breaking change detection with impact chain
    for (const contract of this.workspace.contracts) {
      const contractId = `contract:${contract.name}`;
      const impactChain = getImpactChain(this.graph, contractId);
      
      if (impactChain && impactChain.dependents.length > 0) {
        
        // Check if any fields were removed (simulated by checking if the contract has changes)
        // In a real scenario, we'd compare with a previous version
        for (const field of contract.fields) {
          const downstream = getDownstream(this.graph, contractId);
          const downstreamNames = downstream.map(n => `${n.type}:${n.name}`).join(', ');
          
          if (downstream.length > 1) {
            this.warnings.push(createError(
              `Multi-hop impact: Changes to '${field.name}' in contract '${contract.name}' affect: ${downstreamNames}`,
              { file: contract.file, line: contract.line },
              'warning',
              'MULTI_HOP_IMPACT'
            ));
          }
        }
      }
    }
  }

  private isTypeNarrowing(type: string, constraints?: Record<string, unknown>): boolean {
    // Check if constraints make the type more restrictive
    if (!constraints) return false;
    
    // strict constraints indicate narrowing
    if (constraints.not_null) return true;
    if (constraints.unique && (type === 'string' || type === 'integer')) return true;
    
    return false;
  }
}

export function validateWorkspace(workspace: Workspace): ValidationResult {
  const validator = new Validator(workspace);
  return validator.validate();
}
