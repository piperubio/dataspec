import { Workspace } from '../parsing/index.js';
import { ValidationResult } from './error.js';
export declare class Validator {
    private workspace;
    private errors;
    private warnings;
    constructor(workspace: Workspace);
    validate(): ValidationResult;
    private validateCrossResourceReferences;
    private validateStepTypeCoherence;
    private validateGraphIntegrity;
    private validateContractConsistency;
    private validateBreakingChanges;
}
export declare function validateWorkspace(workspace: Workspace): ValidationResult;
//# sourceMappingURL=validator.d.ts.map