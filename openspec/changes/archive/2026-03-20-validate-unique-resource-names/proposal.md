# Proposal: Validate Unique Resource Names in Workspace

## Why

The dataspec specifications require that all resources (sources, datasets, contracts, flows) have unique names within their respective categories, but the current validation engine does not enforce this constraint. Users can accidentally create multiple resources with the same name in different files, leading to ambiguous references and confusing errors downstream when cross-resource links fail to resolve correctly.

## What Changes

- Add validation for unique source names across all source files in the workspace
- Add validation for unique dataset names across all dataset files in the workspace
- Add validation for unique contract names across all contract files in the workspace
- Add validation for unique flow names across all flow files in the workspace
- Report errors with file paths and line numbers for both the first occurrence and any duplicates
- Add corresponding test cases to cover duplicate name scenarios

## Capabilities

### New Capabilities

- `resource-name-uniqueness`: Validates that all resource names within each category (sources, datasets, contracts, flows) are unique across the workspace

### Modified Capabilities

- `validation-engine`: Add resource name uniqueness validation to the existing validation pipeline

## Impact

- **Affected Code**:
  - `packages/dataspec-cli/src/validation/validator.ts` — Add `validateUniqueResourceNames()` method
  - `packages/dataspec-cli/src/validation/error.ts` — Potentially add new error codes
  - `packages/dataspec-cli/__tests__/validator.test.ts` — Add test cases for duplicate name detection

- **Error Codes Added**:
  - `DUPLICATE_SOURCE_NAME`
  - `DUPLICATE_DATASET_NAME`
  - `DUPLICATE_CONTRACT_NAME`
  - `DUPLICATE_FLOW_NAME`

- **User Experience**: Users will receive clear error messages indicating exactly which files contain duplicate names, making it easy to locate and fix the conflicts

- **Backward Compatibility**: This change only adds new validation errors. Workspaces that currently have duplicate names (which are invalid per spec) will now be flagged correctly
