## Why

The DataSpec core validates data platform configurations but does not generate consumable documentation. Teams need to visualize data lineage, browse dataset catalogs, and understand platform architecture without running external tools or reading YAML files. Generated documentation serves as a living reference for data engineers, analysts, and AI agents that need to understand the platform structure.

## What Changes

- **New Capability**: Documentation generation (`dataspec docs generate`) that produces GitHub-renderable Markdown with Mermaid lineage diagrams, dataset catalog tables, and contract reference docs
- **New Capability**: Model inspection CLI (`dataspec inspect`) for interactive exploration of platform resources including overview, specific datasets, flows, and lineage queries
- No breaking changes to existing validation or DSL

## Capabilities

### New Capabilities

- `documentation-generation`: Generate Markdown documentation with Mermaid lineage graphs, dataset catalog tables, and contract reference docs. GitHub-renderable.
- `cli-tooling` (advanced): `dataspec inspect` — model inspection command (inspect overview, specific dataset, specific flow, lineage)

### Modified Capabilities

- _(none — this is a pure enhancement change)_

## Impact

- **CLI**: New subcommand `dataspec docs` with `generate` subcommand
- **CLI**: New subcommand `dataspec inspect` with overview, dataset, flow, and lineage modes
- **New module**: Documentation generator with Markdown and Mermaid rendering
- **Output**: Generated `docs/` directory with platform documentation
- **Dependencies**: Requires DPaC core (validation engine, domain model) to be available
