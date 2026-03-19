## Why

dpac-core defines what the data platform IS — the resources (sources, datasets, contracts, flows), their schemas, and their relationships. But without validation, errors go undetected: broken cross-resource references, contract violations that break downstream consumers, graph cycles, orphaned datasets, and incompatible step types. Errors propagate silently until they cause failures in production pipelines. dpac-cli closes this gap by providing a validation engine that ensures model integrity and a CLI that serves as the primary developer interface for the DPaC ecosystem.

## What Changes

- **`validation-engine`**: Multi-layer validation system that checks:
  - **Graph integrity**: Detect cycles in flow dependencies, orphaned datasets with no producers or consumers, and incomplete pipelines
  - **Contract consistency**: Validate field types, constraint compatibility, and semantic versioning
  - **Cross-resource reference resolution**: Ensure all references to sources, datasets, and contracts resolve to declared resources
  - **Step type coherence**: Verify extract steps reference sources, transform steps reference datasets, and load steps reference datasets
  - **Breaking change detection via workspace-wide dependency analysis**: Detect breaking changes by traversing the dependency graph (contracts → datasets → flows), NOT by comparing against Git history

- **`cli-tooling`**: Developer-facing command-line interface providing:
  - `dpac validate`: Run all validations and report errors with file paths and line numbers
  - `dpac init`: Scaffold new DPaC projects with directory structure and optional examples
  - `dpac list [resource]`: List resources in the workspace (sources, datasets, contracts, flows) with optional filtering
  - `dpac show <resource> <name>`: Display detailed information about a specific resource, including `--deps` flag to show upstream/downstream dependencies
  - `dpac --version`: Display CLI version
  - `dpac --help`: Display usage information and available commands
  - Consistent error formatting across all commands

**Out of scope:**
- `dpac inspect` for model introspection (moved to dpac-docs change)
- LSP server functionality (separate dpac-lsp change)
- Documentation generation (separate dpac-docs change)

## Capabilities

### New Capabilities
- `validation-engine`: Validate graph integrity, contract consistency, cross-resource references, step type coherence, and breaking changes via workspace dependency graph analysis
- `cli-tooling`: CLI commands for validation (`dpac validate`), project scaffolding (`dpac init`), resource discovery (`dpac list`), resource inspection (`dpac show`), version display (`--version`), help (`--help`), and consistent error formatting

### Modified Capabilities
<!-- No existing capabilities are being modified — this change introduces tooling on top of dpac-core -->

## Impact

- **For data engineers**: Run `dpac validate` locally during development and in CI pipelines to catch errors before they reach production. Use `dpac list` and `dpac show` to navigate and inspect the workspace without opening YAML files. Breaking changes are detected through workspace dependency analysis, ensuring that contract modifications that would break downstream flows are caught immediately — even in fresh checkouts without Git history.
- **For platform teams**: Establish validation gates in CI/CD pipelines. All cross-resource references, contract compatibilities, and graph constraints are verified automatically.
- **For AI coding agents**: Validation errors provide structured feedback with file paths and line numbers, enabling agents to fix issues programmatically.

## Dependency

This change **requires dpac-core** (the YAML definitions for sources, datasets, contracts, and flows). The validation engine operates on the dpac-core domain model.

## Future Changes

- **`dpac-lsp`**: Language Server Protocol for real-time validation in editors
- **`dpac-docs`**: Documentation generation and `dpac inspect` for model introspection
