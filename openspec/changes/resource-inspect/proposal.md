## Why

The DataSpec CLI currently has two separate commands for viewing resource details:

- `dataspec show` — displays resource details with optional dependency flag
- No dedicated lineage exploration tool

Users need a single, consistent way to explore platform resources interactively. The current `show` command works but doesn't surface platform concepts like data layers (raw/refined/serving) or provide rich lineage exploration. Having one unified command reduces cognitive load and provides a consistent interface for both human exploration and potential scripting.

## What Changes

- **Consolidated Capability**: Replace `show` with an enhanced `inspect` command (or rename `show` → `inspect`)
- **New Features**:
  - Platform overview when called without arguments (`dataspec inspect`)
  - Data layer awareness (raw/refined/serving) for datasets
  - Rich lineage tree exploration (`dataspec inspect lineage <dataset>`)
  - Producing/consuming flow relationships for datasets
- **Preserved Features**:
  - All resource types: source, dataset, contract, flow
  - JSON output format (`-f json`)
  - Dependency graph integration
- **BREAKING**: Remove `show` command in favor of `inspect`

## Capabilities

### New Capabilities

- `resource-inspect`: Unified CLI command for exploring platform resources with layer awareness and lineage trees

### Modified Capabilities

- `cli-tooling`: Replace `show` with `inspect` — unified resource inspection command

## Impact

- **CLI**: Remove `dataspec show`, add `dataspec inspect` with same + enhanced functionality
- **Breaking change**: Scripts using `dataspec show` will need to migrate to `dataspec inspect`
- **User experience**: Single consistent command for resource exploration
- **Documentation**: Update CLI help and examples to use `inspect` instead of `show`

## Migration Guide

| Old Command                               | New Command                                  |
| ----------------------------------------- | -------------------------------------------- |
| `dataspec show source <name>`             | `dataspec inspect source <name>`             |
| `dataspec show dataset <name>`            | `dataspec inspect dataset <name>`            |
| `dataspec show contract <name>`           | `dataspec inspect contract <name>`           |
| `dataspec show flow <name>`               | `dataspec inspect flow <name>`               |
| `dataspec show <resource> <name> --deps`  | `dataspec inspect lineage <name>`            |
| (not available)                           | `dataspec inspect` (platform overview)       |
| `dataspec show <resource> <name> -f json` | `dataspec inspect <resource> <name> -f json` |
