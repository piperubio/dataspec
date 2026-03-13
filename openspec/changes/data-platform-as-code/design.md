## Context

Current data platform teams struggle with a fundamental problem: each tool in the modern data stack (Dagster, Airflow, Airbyte, dbt) defines its own proprietary model of the data platform. Platform knowledge — sources, datasets, schemas, lineage — is encoded implicitly across tool-specific configurations. Teams cannot version their data architecture independently, cannot validate cross-tool consistency, and cannot migrate between tools without reverse-engineering their entire platform definition.

DPaC addresses this by creating a **declarative modeling layer** that sits above all tool-specific implementations. It describes *what the data platform is* without prescribing *how it runs*. This mirrors Infrastructure as Code (IaC) tools like Terraform — but where Terraform models infrastructure, DPaC models data ecosystems.

**Current State**: Platform knowledge is scattered across Dagster asset definitions, dbt model configs, Airbyte connection JSONs, and tribal knowledge. No single artifact describes the full data platform.

**Desired State**: Teams define their data platform declaratively in YAML — sources, datasets, contracts, flows — validate the model in CI, and use it as shared context for both humans and AI agents implementing integrations with any tool.

## Goals / Non-Goals

**Goals:**
- Define a declarative YAML-based DSL for complete data platform specification
- Validate data graph integrity, contract consistency, and cross-resource references before any implementation
- Detect breaking changes in data contracts through workspace-wide cross-resource dependency analysis (LSP and CLI)
- Provide a full LSP server for real-time authoring support in editors and AI agents
- Generate Markdown documentation with Mermaid lineage graphs from the model
- Support typed flow steps (extract, transform, load) with multi-engine transformation metadata
- Provide CLI tooling for validation, scaffolding, and model inspection

**Non-Goals:**
- Code compilation or generation for specific runtimes (Dagster, Airflow, dbt)
- Direct runtime integrations with any data tool
- Execution of pipelines or transformations
- Real-time/streaming data processing (batch-only modeling)
- Data quality monitoring or observability (validates structure, not runtime data)
- GUI/visual editor for specifications (text/YAML only)
- Support for every possible storage backend (start with S3, PostgreSQL, ClickHouse)
- Data governance policies and access control (focus on structure, not policies)

## Decisions

### Decision: YAML as the primary specification format
**Rationale**: YAML is human-readable, widely adopted in DevOps/IaC workflows, supports comments, and has excellent tooling. It's also directly parseable by AI agents without a custom format — the YAML *is* the agent interface.

**Alternatives considered**:
- JSON: Rejected due to lack of comments and readability
- Custom DSL: Rejected due to high implementation cost, learning curve, and need for custom parser tooling
- HCL (Terraform): Rejected to avoid dependency on HashiCorp ecosystem
- TOML: Considered but YAML has broader adoption in data engineering

### Decision: Layered dataset architecture (raw → refined → serving)
**Rationale**: The medallion architecture (bronze/silver/gold) is widely adopted. Using generic layer names (raw/refined/serving) keeps the specification agnostic to specific organizational terminology while enforcing clear separation of concerns.

**Alternatives considered**:
- No layers: Rejected because complex data platforms need organization
- Bronze/Silver/Gold: Rejected to avoid vendor-specific terminology
- Custom layer names: Rejected to maintain standardization

### Decision: Contract-first schema definitions with workspace-level breaking change detection
**Rationale**: Explicit contracts enable validation, breaking change detection, and documentation generation. Implicit schemas in transformation code lead to silent breaking changes. Breaking changes are detected by **cross-resource dependency analysis within the workspace**: the validation engine builds a dependency graph (contracts → datasets → flows) and checks that every resource reference is satisfied. If a contract removes a field consumed by a downstream flow, or tightens a type constraint that a dependent dataset relies on, the engine flags the incompatibility.

This approach treats the workspace as the single source of truth. The LSP detects incompatibilities in real-time as the user edits; the CLI detects them during `dpac validate` (suitable for CI). Git remains the versioning mechanism for the entire specification — as with any codebase — but is not the breaking change detection mechanism.

**Breaking change taxonomy** (following Buf's established model):
- **Breaking**: Field removal when downstream consumers reference it, type narrowing that violates downstream expectations, nullable→non-nullable when consumers don't handle it, constraint tightening that invalidates existing flow assumptions
- **Additive**: New optional fields not yet consumed, type widening, constraint relaxation
- **Compatible**: Documentation, comments, formatting changes

**Detection mechanism**: The validation engine resolves all cross-resource references (contract fields → flow step inputs/outputs, dataset schemas → contract definitions) and flags any reference that cannot be satisfied by the current state of the workspace. No diff against previous versions — incompatibility is determined by the graph, not by history.

**Libraries**: `yaml` (eemeli) for parsing.

**Alternatives considered**:
- Git-based breaking change detection (`simple-git` + `json-diff-ts` for structural diff against history): Rejected — adds a runtime dependency on Git, conflates versioning with validation, and doesn't work for fresh workspaces or branches without history. The workspace graph already contains all information needed to detect incompatibilities
- Schema inference: Rejected due to lack of validation guarantees
- Coexisting version blocks in same file: Rejected — adds complexity without clear benefit
- Schema registry integration: Considered as future enhancement but not core

### Decision: Typed flow steps (extract, transform, load)
**Rationale**: Flows describe data movement from sources through transformations to serving. These three operations have fundamentally different interfaces: extract talks to external systems, transform operates on internal datasets, load writes to serving destinations. Making step types explicit enables type-specific validation (extract steps must reference Sources, transform steps must reference Datasets) and clearer lineage semantics.

**Alternatives considered**:
- Generic steps: Rejected because extract and transform have different properties and validation rules
- Separate resources (Extractions, Transformations, Loads): Rejected — over-splitting the model; a Flow is the natural unit of a data pipeline
- Extensible step types: Rejected for V1 to keep the type system simple and predictable

### Decision: Multi-engine transformation metadata
**Rationale**: Different workloads need different engines. Spark for big data, DuckDB for analytics, dbt for SQL transforms, Python for custom logic. The DSL declares *which engine* a transform step uses without specifying *how* it runs — this is metadata for the implementing tool, not execution configuration.

**Alternatives considered**:
- Single engine: Rejected — forces teams into one paradigm
- No engine specification: Rejected — engine choice is critical platform architecture metadata

### Decision: LSP server architecture — vscode-languageserver with custom workspace index
**Rationale**: The LSP server provides real-time authoring support. Since the DPaC DSL has cross-file resource references (flows reference datasets, contracts reference datasets, etc.), a standard YAML language server is insufficient — it lacks cross-file go-to-definition. The architecture uses `vscode-languageserver` as the LSP protocol layer and a custom `WorkspaceIndex` that tracks all resource definitions and references across files.

**LSP capabilities in V1:**
- **Diagnostics**: Real-time validation errors/warnings (broken references, invalid types, graph issues)
- **Hover**: Resource documentation on hover (dataset layer, contract schema summary, flow step chain)
- **Go-to-definition**: Navigate from a resource reference to its definition across files
- **Completion**: Autocomplete resource names, contract field names, engine identifiers, layer values

**Libraries**: `vscode-languageserver@^9.0.0`, `vscode-languageserver-textdocument`, `yaml` (eemeli) for AST-level YAML parsing.

**Architecture**:
```
Editor (VS Code / Neovim / Cursor / AI Agent)
    │ JSON-RPC over stdio
    ▼
LSP Server Process
    ├── Connection Layer (vscode-languageserver)
    ├── Document Manager (TextDocuments — incremental sync)
    ├── WorkspaceIndex (cross-file resource/reference tracking)
    ├── Validation Engine (graph, contracts, references)
    └── Feature Handlers (diagnostics, hover, definition, completion)
```

**Alternatives considered**:
- @volar/language-server: Rejected — designed for Vue/HTML, not YAML DSLs
- Extending yaml-language-server: Rejected — too coupled to JSON Schema workflow; our DSL needs custom semantic analysis
- No LSP (CLI-only validation): Rejected — real-time feedback is essential for DX and AI agent integration

### Decision: Documentation generation — Markdown with Mermaid
**Rationale**: Generated documentation provides lineage visualization and a browsable dataset catalog without requiring a running service. Markdown + Mermaid is GitHub-renderable, works in any Markdown viewer, and requires no external dependencies.

**Diagram approach**: `flowchart LR` (left-to-right) for lineage — data flows naturally from sources to serving, matching the L→R reading direction. CSS classes differentiate resource types (sources=green, datasets=blue, contracts=purple).

**Scaling strategy** (for platforms with 40+ nodes):
- Subgraphs by layer (Sources, Raw, Refined, Serving)
- Per-domain diagrams when configurable tags exist
- Impact analysis diagrams (ancestors + descendants of a specific dataset)
- Threshold: split into multiple diagrams when >40 nodes or >80 edges

**Output structure**:
```
docs/
  overview.md         # Full platform overview with subgraph lineage
  catalog/
    datasets.md       # Dataset catalog table (name, layer, storage, contract)
    sources.md        # Source catalog (name, type, entities)
    contracts.md      # Contract reference (fields, types, constraints, version)
  lineage/
    full.md           # Complete lineage graph (with subgraphs)
    by-layer/
      raw.md          # Raw layer lineage
      refined.md      # Refined layer lineage
      serving.md      # Serving layer lineage
```

**Alternatives considered**:
- HTML static site: Rejected — adds build complexity, Markdown is simpler and GitHub-native
- D2 diagrams: Considered but Mermaid has broader rendering support (GitHub, GitLab, VS Code)
- No generated docs: Rejected — lineage visualization is core value for understanding platform architecture

## Risks / Trade-offs

**[Risk] YAML specification verbosity**
Complex data platforms may require verbose YAML files, reducing readability.
→ **Mitigation**: Support YAML anchors/aliases for reuse, provide JSON Schema for IDE validation, provide CLI scaffolding (`dpac init`).

**[Risk] Limited expressiveness vs. code**
Declarative specifications cannot express arbitrary transformation logic.
→ **Mitigation**: The DSL describes the *graph* (what connects to what), not the *logic* (how data transforms). Transformation scripts live outside the spec as referenced files. The spec declares engine + script path, the tool implements.

**[Risk] Breaking change detection complexity**
Detecting incompatibilities requires building and traversing a complete dependency graph across all workspace resources.
→ **Mitigation**: Start with reference resolution — flag any contract field referenced by a flow or dataset that doesn't exist. This covers the most critical breaking changes (field removal, type mismatch). Evolve to deeper semantic analysis (constraint compatibility, type widening/narrowing) over time.

**[Risk] LSP server complexity**
Full LSP with cross-file references is significantly more complex than CLI-only validation.
→ **Mitigation**: Build the validation engine first (CLI). The LSP server reuses the same validation engine and workspace index — it's a different interface to the same core logic, not a separate system.

**[Risk] Mermaid diagram scaling**
GitHub Mermaid rendering has practical limits (~280 edges before degradation).
→ **Mitigation**: Generate multiple focused diagrams (by layer, by domain) instead of one massive graph. Include node count in generation and auto-split when threshold exceeded.

**[Risk] Adoption friction**
Teams may resist adopting a new abstraction layer for platform definition.
→ **Mitigation**: Position as a modeling and documentation tool, not a replacement for existing tools. The spec coexists with tool-specific configs — it's the source of truth for architecture, not for execution.

## Migration Plan

**Phase 1: Foundation**
- Define YAML schema for all four resources (Sources, Datasets, Contracts, Flows)
- Implement domain model with typed flow steps (extract, transform, load)
- Build YAML parser with error reporting (file path + line numbers)
- Create basic CLI (`dpac validate`, `dpac init`)

**Phase 2: Validation & Contracts**
- Implement graph integrity validation (cycles, orphans, incomplete pipelines)
- Implement cross-resource reference validation
- Implement contract schema validation (types, constraints)
- Implement cross-resource breaking change detection (dependency graph analysis)
- Add validation report formatter with severity levels

**Phase 3: LSP & Documentation**
- Build LSP server with diagnostics (reuses validation engine)
- Add hover, go-to-definition, and completion
- Implement Markdown + Mermaid documentation generator
- Generate dataset catalog, source catalog, contract reference

**Phase 4: Polish**
- CLI model inspection (`dpac inspect`)
- JSON Schema for YAML validation in editors
- Example platform specifications
- Comprehensive documentation

**Rollback Strategy**: 
- Specification files are pure YAML with no runtime dependencies
- Removing DPaC has zero impact on existing tool configurations
- Generated documentation is static Markdown — continues to work without DPaC installed

## Open Questions

1. **How to handle secrets?** Connection strings and credentials should not be in YAML. Start with environment variable references (`$ENV_VAR`), consider vault integration later.

2. **Should the LSP server bundle with a VS Code extension?** Or ship as a standalone binary that any editor can consume? (Likely: standalone binary + thin VS Code extension for marketplace distribution)

3. **How should large multi-team platforms organize files?** One directory per domain? Flat structure? Convention-based discovery? (Start with flat `sources/`, `datasets/`, `contracts/`, `flows/` directories, add namespace support later if needed)
