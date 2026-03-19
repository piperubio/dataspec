# Proposal: Rename `dpac` to `dataspec`

## Why

The project uses "DPAC" (Declarative Data Platform Architecture) as its internal acronym, but the actual package names and CLI tool are scoped under `@dataspec`. The discrepancy between the internal acronym and the published package names causes confusion. Renaming all internal `dpac` references to `dataspec` aligns the codebase with the established brand identity and improves clarity for contributors and users.

## What Changes

- Rename package directory `packages/dpac-core/` → `packages/dataspec-core/`
- Rename package directory `packages/dpac-cli/` → `packages/dataspec-cli/`
- Update package.json `name` field: `@dataspec/dpac-core` → `@dataspec/dataspec-core`
- Update package.json `name` field: `@dataspec/dpac-cli` → `@dataspec/dataspec-cli`
- Update CLI binary: `bin/dpac` → `bin/dataspec` and its shebang/description references
- Update CLI entry point in `bin/dataspec`: program name, description, and help text from `dpac` → `dataspec`
- Update internal JSDoc comments referencing `dpac-core` import path
- Update CLI source code (init.ts, validate.ts, workspace.ts, etc.) mentioning "DPAC" in user-facing strings
- Rename OpenSpec change directory `openspec/changes/dpac-lsp/` → `openspec/changes/dataspec-lsp/`
- Rename OpenSpec change directory `openspec/changes/dpac-docs/` → `openspec/changes/dataspec-docs/`
- Update all OpenSpec spec content in `openspec/specs/` that references `dpac` or `DPAC` (command names, project references, etc.)

## Capabilities

### New Capabilities

None — this is a rename/refactoring change with no new capabilities.

### Modified Capabilities

The following existing capabilities have their spec-level content updated to reflect the rename:

- `cli-tooling`: All `dpac` command references updated to `dataspec` (e.g., `dpac validate` → `dataspec validate`, `dpac init` → `dataspec init`); project references updated
- `source-management`: Spec content references to "DPAC YAML specifications" updated to "dataspec"
- `platform-definition`: Spec content references updated
- `flow-definition`: Spec content references updated
- `dataset-definition`: Spec content references updated
- `data-contracts`: Spec content references updated
- `validation-engine`: Spec content references updated

## Impact

- **Package names**: `@dataspec/dpac-core` and `@dataspec/dpac-cli` become `@dataspec/dataspec-core` and `@dataspec/dataspec-cli` — this is a **BREAKING CHANGE** for existing users who depend on the old package names
- **CLI binary**: `dpac` command becomes `dataspec` — **BREAKING CHANGE** for existing CLI users and CI/CD pipelines
- **Directory structure**: `packages/dpac-core/` and `packages/dpac-cli/` directories are renamed — contributors will need to update local paths
- **OpenSpec artifacts**: Change directories `dpac-lsp` and `dpac-docs` renamed to `dataspec-lsp` and `dataspec-docs`
- **Internal imports**: The JSDoc import example in `dpac-core/src/index.ts` changes from `'dpac-core'` to `'dataspec-core'`
