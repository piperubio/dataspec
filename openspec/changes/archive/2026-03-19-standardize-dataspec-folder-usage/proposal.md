# Proposal: Standardize Dataspec Folder Usage

## Why

Currently, dataspec resources (platform.yaml, sources/, datasets/, contracts/, flows/) are scattered at the workspace root with no container folder, leading to cluttered project structure and making it difficult to distinguish dataspec definitions from other project files (code, configs, documentation). This change establishes a mandatory `dataspec/` container folder to improve project organization and enable future multi-project workspace support.

## What Changes

- **BREAKING**: All dataspec resources must be located inside a `dataspec/` folder at the workspace root
- **BREAKING**: The `platform.yaml` file moves from workspace root to `dataspec/platform.yaml`
- **BREAKING**: All subdirectories (`sources/`, `datasets/`, `contracts/`, `flows/`) must be inside `dataspec/`
- The `dataspec init` command will create the standardized folder structure
- The scanner will search for resources in `dataspec/` instead of workspace root
- Validation will enforce the presence of the `dataspec/` folder structure
- Error messages will guide users to migrate to the new structure

## Capabilities

### New Capabilities

- `workspace-structure`: Defines the mandatory folder structure for dataspec projects, including the `dataspec/` container requirement and resource organization within it.

### Modified Capabilities

- `cli-tooling`: The `init` command will create the new standardized structure (`dataspec/` container with subdirectories). Validation commands will expect resources in the new locations.
- `platform-definition`: Platform configuration (`platform.yaml`) will be expected at `dataspec/platform.yaml` instead of workspace root.
- `source-management`: Source definitions will be expected in `dataspec/sources/` instead of `sources/`.
- `dataset-definition`: Dataset definitions will be expected in `dataspec/datasets/` instead of `datasets/`.
- `data-contracts`: Contract definitions will be expected in `dataspec/contracts/` instead of `contracts/`.
- `flow-definition`: Flow definitions will be expected in `dataspec/flows/` instead of `flows/`.
- `validation-engine`: Validation will enforce the `dataspec/` folder structure and report errors for misplaced resources.

## Impact

### Affected Code

- `packages/dataspec-cli/src/parsing/scanner.ts`: Update `scanWorkspace()` to search in `dataspec/` subfolder
- `packages/dataspec-cli/src/commands/init.ts`: Create `dataspec/` container folder structure
- `packages/dataspec-cli/src/commands/validate.ts`: Add workspace structure validation
- `packages/dataspec-cli/src/parsing/workspace.ts`: Update `rootPath` to include `dataspec/` segment

### Breaking Changes

- Existing projects without `dataspec/` folder will fail validation
- CI/CD pipelines will need workspace structure updates
- Users must migrate existing projects by creating `dataspec/` folder and moving resources

### Migration Path

1. Create `dataspec/` folder in workspace root
2. Move `platform.yaml` → `dataspec/platform.yaml`
3. Move `sources/` → `dataspec/sources/`
4. Move `datasets/` → `dataspec/datasets/`
5. Move `contracts/` → `dataspec/contracts/`
6. Move `flows/` → `dataspec/flows/`
7. Run `dataspec validate` to confirm successful migration