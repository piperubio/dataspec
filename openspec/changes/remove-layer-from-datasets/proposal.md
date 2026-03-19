## Why

The `layer` property forces all projects into the medallion architecture pattern (raw/refined/serving), but not all data platforms follow this convention. This rigid requirement limits flexibility for teams with different organizational patterns. Layers can be expressed via tags or metadata, making them optional rather than mandatory.

## What Changes

- **BREAKING**: Remove `layer` property from dataset definitions
- **BREAKING**: Remove `DatasetLayer` enum (`raw`, `refined`, `serving`) from types
- **BREAKING**: Remove `--tier` CLI option from `list` command
- **BREAKING**: Change directory structure from `datasets/{raw,refined,serving}/` to flat `datasets/`
- **BREAKING**: Change directory structure from `contracts/{raw,refined,serving}/` to flat `contracts/`
- Remove layer validation from dataset parser
- Remove layer display from `show` command output
- Update documentation to remove medallion architecture references

## Capabilities

### New Capabilities

None - this is a removal change.

### Modified Capabilities

- `dataset-definition`: Requirements for layer assignment validation will be removed. The spec will change from mandating layers to making them optional via tags.

## Impact

**Code:**
- `packages/dataspec-core/src/types/dataset.ts` - Remove `DatasetLayer` enum and `layer` property
- `packages/dataspec-core/src/schemas/dataset.schema.json` - Remove `layer` from required fields
- `packages/dataspec-core/src/parsers/dataset.ts` - Remove layer validation
- `packages/dataspec-cli/src/commands/init.ts` - Flatten directory structure
- `packages/dataspec-cli/src/commands/list.ts` - Remove `--tier` option
- `packages/dataspec-cli/src/commands/show.ts` - Remove layer from output
- `packages/dataspec-cli/src/parsing/workspace.ts` - Remove `layer` from `ParsedDataset`

**Tests:**
- 6 test files need updates for layer removal

**Examples:**
- 30 example YAML files need restructuring (flatten directories)

**Documentation:**
- READMEs for dataspec-core and dataspec-cli
- openspec/specs/dataset-definition/spec.md