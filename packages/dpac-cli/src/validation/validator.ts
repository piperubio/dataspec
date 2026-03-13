import { Workspace } from '../parsing/index.js';
import { ValidationError, ValidationResult, createError, createSuccessResult, createFailureResult } from './error.js';

export class Validator {
  private workspace: Workspace;
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  constructor(workspace: Workspace) {
    this.workspace = workspace;
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

    return createSuccessResult();
  }

  private validateCrossResourceReferences(): void {
    for (const flow of this.workspace.flows) {
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
        } else if (step.type === 'transform') {
          for (const input of step.inputs) {
            const datasetExists = this.workspace.datasets.some(d => d.name === input);
            if (!datasetExists) {
              this.errors.push(createError(
                `Undefined dataset reference '${input}' in flow '${flow.name}'`,
                { file: flow.file, line: flow.line },
                'error',
                'UNRESOLVED_DATASET'
              ));
            }
          }
        } else if (step.type === 'load') {
          const datasetExists = this.workspace.datasets.some(d => d.name === step.input);
          if (!datasetExists) {
            this.errors.push(createError(
              `Undefined dataset reference '${step.input}' in flow '${flow.name}'`,
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
        } else if (step.type === 'transform') {
          for (const input of step.inputs) {
            const datasetExists = this.workspace.datasets.some(d => d.name === input);
            if (!datasetExists) continue;
            
            const dataset = this.workspace.datasets.find(d => d.name === input);
            if (dataset && dataset.layer === 'raw') {
              this.warnings.push(createError(
                `Transform step typically references refined/serving datasets, but '${input}' is in raw layer`,
                { file: flow.file, line: flow.line },
                'warning',
                'LAYER_WARNING'
              ));
            }
          }
        }
      }
    }
  }

  private validateGraphIntegrity(): void {
    const datasetNames = new Set(this.workspace.datasets.map(d => d.name));
    const consumedDatasets = new Set<string>();
    const producedDatasets = new Set<string>();

    for (const flow of this.workspace.flows) {
      for (const step of flow.steps) {
        if (step.type === 'transform') {
          for (const input of step.inputs) {
            consumedDatasets.add(input);
          }
        } else if (step.type === 'load') {
          consumedDatasets.add(step.input);
        }
      }

      const lastLoadStep = flow.steps.filter(s => s.type === 'load').pop();
      if (lastLoadStep) {
        const dataset = this.workspace.datasets.find(d => d.name === lastLoadStep.input);
        if (dataset) {
          producedDatasets.add(dataset.name);
        }
      }
    }

    for (const dataset of this.workspace.datasets) {
      const isConsumed = consumedDatasets.has(dataset.name);
      const isProduced = producedDatasets.has(dataset.name);

      if (!isConsumed && !isProduced && this.workspace.flows.length > 0) {
        this.warnings.push(createError(
          `Orphaned dataset '${dataset.name}' - not produced or consumed by any flow`,
          { file: dataset.file, line: dataset.line },
          'warning',
          'ORPHANED_DATASET'
        ));
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
        if (step.type === 'transform') {
          for (const input of step.inputs) {
            const contractName = datasetContractMap.get(input);
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
    }
  }
}

export function validateWorkspace(workspace: Workspace): ValidationResult {
  const validator = new Validator(workspace);
  return validator.validate();
}
