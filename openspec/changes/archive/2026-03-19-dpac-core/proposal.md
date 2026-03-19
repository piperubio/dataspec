## Why

Modern data stacks have created a fragmentation problem: orchestration frameworks, data loading tools, transformation engines, and governance platforms each define their own proprietary models of the data platform. None provide a unified, platform-level modeling language that spans the entire data lifecycle from ingestion to serving. Teams cannot version their data architecture independently, cannot express cross-tool relationships, and cannot migrate between tools without reverse-engineering their entire platform definition from tool-specific code.

This change introduces **dpac-core** — a declarative DSL that defines what a data platform IS. It separates data architecture design from tool-specific execution, enabling teams to describe complete data ecosystems (sources, datasets, contracts, flows) once, and use this definition as the foundation for any combination of tools. This is the **pure definitions layer** — no validation engine, no CLI, just the schema and structure of the data platform.

## What Changes

- **Declarative YAML DSL** for modeling data platforms with five core definition resources: Sources, Datasets, Contracts, and Flows
- **Platform architecture definitions** — storage backends, analytics engines, and platform-wide defaults
- **Source declarations** — external data producers (databases, APIs, file systems, SaaS) with their entities, WITHOUT connection details or credentials
- **Dataset layer model** — raw, refined, serving layers with storage configurations
- **Contract schemas** — versioned field definitions, data types, and constraints (structural definitions only, no breaking change detection logic)
- **Flow definitions** — typed steps (extract, transform, load) describing how datasets are produced

**Out of scope for dpac-core:**
- Validation engine or cross-reference checking (dpac-cli)
- Breaking change detection (dpac-cli)
- CLI tooling, LSP, or documentation generation (separate changes)
- Code compilation or generation for specific tools
- Runtime integrations or pipeline execution

## Capabilities

### New Capabilities
- `platform-definition`: Define global platform architecture including storage backends and analytics engines
- `source-management`: Declare external data producers (databases, APIs, file systems, SaaS) — name, type, and available entities. SIN connection details (host, port, credentials) because dpac-core is definitions-only
- `dataset-definition`: Create logical data units organized in layers (raw, refined, serving) with storage configurations
- `data-contracts`: Specify versioned schemas with field definitions, data types, and constraints. Structural definitions only — breaking change detection logic belongs in dpac-cli
- `flow-definition`: Define data flows with typed steps (extract, transform, load) describing how datasets are produced from sources

### Modified Capabilities
<!-- No existing capabilities are being modified - this is a new framework -->

## Impact

- **For data engineers**: Define an entire data platform in a single Git repository. The YAML serves as the single source of truth for data architecture, independent of any specific tool implementation.
- **For downstream tools**: Any validation engine, CLI, or agent can parse the YAML model directly as structured context. The spec defines WHAT the platform is — separate tools define HOW it's validated and implemented.
- **For the ecosystem**: Clean separation of concerns: dpac-core (definitions), dpac-cli (validation + CLI), dpac-lsp (editor integration), dpac-docs (documentation generation).

## Future Changes

The following capabilities are planned as separate changes:

- **`dpac-cli`**: CLI tooling (`dpac validate`, `dpac init`) with validation engine for cross-reference checking and graph integrity
- **`dpac-lsp`**: Language Server Protocol server providing real-time feedback, hover documentation, and completion
- **`dpac-docs`**: Documentation generation with lineage diagrams and dataset catalogs

