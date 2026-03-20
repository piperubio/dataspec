## Why

The `layer` property forces all projects into the medallion architecture pattern (raw/refined/serving), but not all data platforms follow this convention. This rigid requirement limits flexibility for teams with different organizational patterns. Layers can be expressed via tags or metadata, making them optional rather than mandatory.

## Requirements

### Requirement: Remove layer property from datasets

The system SHALL remove the mandatory `layer` property from dataset definitions.

#### Scenario: Dataset without layer field
- **WHEN** a dataset YAML file defines a dataset without a `layer` field
- **THEN** the system SHALL accept it as a valid configuration

### Requirement: Remove layer validation

The system SHALL remove validation that enforces layer assignments.

#### Scenario: Validation without layer check
- **WHEN** the system validates a workspace configuration
- **THEN** it SHALL NOT check for the presence of a `layer` field in datasets

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

- `dataset-definition`: Layer assignment validation SHALL be removed. The spec MUST change from mandating layers to making them optional via tags.

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