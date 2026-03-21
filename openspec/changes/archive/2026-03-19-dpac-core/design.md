## Context

Current data platform teams struggle with a fundamental problem: each tool in the modern data stack (Dagster, Airflow, Airbyte, dbt) defines its own proprietary model of the data platform. Platform knowledge — sources, datasets, schemas, lineage — is encoded implicitly across tool-specific configurations. Teams cannot version their data architecture independently and cannot express cross-tool relationships in a unified way.

DPaC addresses this by creating a **declarative modeling layer** that sits above all tool-specific implementations. It describes _what the data platform is_ without prescribing _how it runs_ or _how it's validated_. This mirrors Infrastructure as Code (IaC) tools like Terraform — but where Terraform models infrastructure, DPaC models data ecosystems.

**dpac-core** is the foundational definitions layer. It specifies the schema and structure of the data platform: sources, datasets, contracts, and flows. Validation, CLI tooling, and editor integration are handled by separate components (dpac-cli, dpac-lsp).

**Current State**: Platform knowledge is scattered across Dagster asset definitions, dbt model configs, Airbyte connection JSONs, and tribal knowledge. No single artifact describes the full data platform.

**Desired State**: Teams define their data platform declaratively in YAML — sources, datasets, contracts, flows — and use this as the shared source of truth for both humans and AI agents. Validation and tooling are provided by separate, composable components.

## Goals / Non-Goals

**Goals:**

- Define a declarative YAML-based DSL for complete data platform specification
- Support typed flow steps (extract, transform, load) with multi-engine transformation metadata
- Enable layered dataset architecture (raw, refined, serving)
- Specify contract schemas with versioning, field definitions, types, and constraints
- Declare sources with their entities (tables, collections, endpoints) WITHOUT connection details
- Provide a foundation that validation tools and CLI can build upon

**Non-Goals:**

- Validation engine or cross-reference checking (dpac-cli)
- Breaking change detection logic (dpac-cli)
- CLI tooling, LSP, or documentation generation (separate changes)
- Code compilation or generation for specific runtimes
- Direct runtime integrations with any data tool
- Execution of pipelines or transformations
- Real-time/streaming data processing (batch-only modeling)
- Data quality monitoring or observability (defines structure, not runtime data)
- GUI/visual editor for specifications (text/YAML only)
- Support for every possible storage backend (start with S3, PostgreSQL, ClickHouse)
- Connection parameters, credentials, or secret management (out of scope for definitions layer)

## Decisions

### Decision: YAML as the primary specification format

**Rationale**: YAML is human-readable, widely adopted in DevOps/IaC workflows, supports comments, and has excellent tooling. It's also directly parseable by AI agents without a custom format — the YAML _is_ the agent interface.

**Alternatives considered**:

- **JSON**: Ubiquitous parsing support and strict syntax, but lacks comments which are essential for documenting data platform architecture decisions.
- **Custom DSL**: A purpose-built language could model data platform concepts natively, but requires building custom parser, lexer, and toolchain — significant ongoing maintenance burden.
- **HCL (Terraform)**: Mature ecosystem with built-in validation, but carries HashiCorp dependency and licensing considerations. HCL's primary use case is infrastructure, not data modeling.
- **TOML**: Excellent for simple configuration, but becomes unwieldy with deeply nested structures like data lineage graphs.
- **CUE**: Purpose-built for configuration with validation and constraint unification. However, adoption in data engineering is minimal compared to YAML, and AI agents have significantly more training on YAML.

### Decision: Layered dataset architecture (raw → refined → serving)

**Rationale**: The medallion architecture (bronze/silver/gold) is widely adopted. Using generic layer names (raw/refined/serving) keeps the specification agnostic to specific organizational terminology while enforcing clear separation of concerns.

**Alternatives considered**:

- No layers: Rejected because complex data platforms need organization
- Bronze/Silver/Gold: Rejected to avoid vendor-specific terminology
- Custom layer names: Rejected to maintain standardization

### Decision: Contract-first schema definitions (structural only)

**Rationale**: Explicit contracts enable documentation generation, schema validation (by downstream tools), and clear data quality expectations. Implicit schemas in transformation code lead to silent assumptions and undocumented requirements. Contracts in dpac-core define the structure (fields, types, constraints) — breaking change detection and validation logic belong in dpac-cli.

**Alternatives considered**:

- Schema inference: Rejected due to lack of explicit guarantees
- Coexisting version blocks in same file: Rejected — adds complexity without clear benefit
- Schema registry integration: Considered as future enhancement but not core

### Decision: Typed flow steps (extract, transform, load)

**Rationale**: Flows describe data movement from sources through transformations to serving. These three operations have fundamentally different interfaces: extract talks to external systems, transform operates on internal datasets, load writes to serving destinations. Making step types explicit enables clearer lineage semantics and type-specific metadata (extract steps reference Sources, transform steps reference Datasets).

**Alternatives considered**:

- Generic steps: Rejected because extract and transform have different properties
- Separate resources (Extractions, Transformations, Loads): Rejected — over-splitting the model; a Flow is the natural unit of a data pipeline
- Extensible step types: Rejected for V1 to keep the type system simple and predictable

### Decision: Multi-engine transformation metadata

**Rationale**: Different workloads need different engines. Spark for big data, DuckDB for analytics, dbt for SQL transforms, Python for custom logic. The DSL declares _which engine_ a transform step uses without specifying _how_ it runs — this is metadata for the implementing tool or validation engine, not execution configuration.

**Alternatives considered**:

- Single engine: Rejected — forces teams into one paradigm
- No engine specification: Rejected — engine choice is critical platform architecture metadata

### Decision: TypeScript + Bun as the technology stack

**Rationale**: The dpac ecosystem (core, cli, lsp, docs) needs strong type modeling for the domain (discriminated unions for flow steps, contract fields, source types), best-in-class YAML parsing, JSON Schema generation, and native LSP support. TypeScript leads in all four:

- **Domain modeling**: TypeScript's discriminated unions (`FlowStep = ExtractStep | TransformStep | LoadStep`) map directly to the DSL's type system. Go lacks union types; Python's typing is runtime-optional.
- **YAML parsing**: `eemeli/yaml` is the most complete YAML 1.2 parser across any language — CST access, comment preservation, source positions. Critical for LSP features (hover, go-to-definition) and error reporting with line numbers.
- **JSON Schema generation**: TypeScript has the richest ecosystem (Zod v4 native schema output, TypeBox bidirectional TS↔JSON Schema, ts-json-schema-generator). dpac-core needs to emit JSON Schema for editor validation.
- **LSP ecosystem**: `vscode-languageserver` is the reference LSP implementation, in TypeScript. Red Hat's yaml-language-server and AWS CloudFormation LSP (both TypeScript) are direct architectural references for dpac-lsp. Building the LSP in a different language would forfeit access to this ecosystem.
- **Unified stack**: One language across all four packages (core, cli, lsp, docs) eliminates cross-language FFI, simplifies the monorepo, and enables shared types between packages.

**Bun** as the runtime and build tool provides:

- `bun build --compile` for standalone binary distribution (~50MB, ~15ms startup) — comparable to Go's startup time without requiring a separate compilation toolchain.
- Built-in TypeScript execution (no separate transpilation step).
- Built-in test runner (`bun test`) replacing the need for Vitest/Jest.
- Built-in workspace support for the monorepo structure.
- Significantly faster package installation and script execution vs Node.js.

**Alternatives considered**:

- **Go**: Superior binary distribution (native ~15MB) and CLI startup (~5ms). However, Go lacks union types for domain modeling, has limited YAML parsing (no comment preservation in yaml.v3), weak JSON Schema generation tooling, and no mature LSP library ecosystem. Building dpac-lsp in Go would mean reimplementing what TypeScript provides out of the box.
- **Rust**: Best performance and smallest binaries. However, development velocity is significantly slower (borrow checker overhead for a project that is I/O-bound string processing, not compute-heavy). `serde_yaml` doesn't preserve comments. `tower-lsp` exists but has a fraction of the ecosystem of `vscode-languageserver`. The performance ceiling Rust provides is unnecessary — dpac parses YAML files, not gigabytes of data.
- **Python**: Dominant in data engineering, which aids adoption. However, Python's type system is runtime-optional (mypy/pyright are linters, not enforcers), binary distribution is fragile (PyInstaller), and the LSP ecosystem (pygls) is less mature. The data engineering community familiarity doesn't outweigh the technical disadvantages for a tooling/DSL project.
- **Hybrid (e.g., Rust core + TypeScript LSP)**: Considered to get best-of-both-worlds (Rust performance for CLI, TypeScript for LSP). Rejected because dpac's workload (parsing small YAML files, validating graphs of hundreds of nodes) doesn't justify the complexity of maintaining two languages, cross-language FFI, and separate build pipelines.

### Decision: No connection details or credentials in source definitions

**Rationale**: dpac-core is the **definitions layer** — it describes WHAT external sources exist and WHAT entities they provide. Connection parameters (host, port, database, credentials) are runtime concerns that belong to the tools that actually connect to these sources. Environment variable references for credentials ($ENV_VAR) are also out of scope. This keeps dpac-core pure: it defines the structure of the data platform, not how to access it.

**Alternatives considered**:

- Include connection parameters: Rejected — mixes definitions with runtime configuration
- Environment variable references: Rejected — credential management is a runtime/tooling concern
- Secret vault integration: Rejected — belongs to tooling layer, not definitions

## Risks / Trade-offs

**[Risk] YAML specification verbosity**
Complex data platforms may require verbose YAML files, reducing readability.
→ **Mitigation**: Support YAML anchors/aliases for reuse, provide JSON Schema for IDE validation.

**[Risk] Limited expressiveness vs. code**
Declarative specifications cannot express arbitrary transformation logic.
→ **Mitigation**: The DSL describes the _graph_ (what connects to what), not the _logic_ (how data transforms). Transformation scripts live outside the spec as referenced files. The spec declares engine + script path, the tool implements.

**[Risk] No built-in validation**
Without a validation engine (dpac-cli), users may create invalid specifications (broken references, invalid types, etc.) without immediate feedback.
→ **Mitigation**: dpac-core provides the schema foundation. Users can use dpac-cli for validation, or implement their own validators. JSON Schema for YAML provides basic structural validation in editors.

**[Risk] Adoption friction**
Teams may resist adopting a new abstraction layer for platform definition.
→ **Mitigation**: Position as a modeling and documentation tool, not a replacement for existing tools. The spec coexists with tool-specific configs — it's the source of truth for architecture, not for execution.

## Migration Plan

**Phase 1: Foundation**

- Define YAML schema for all five resources (Platform, Sources, Datasets, Contracts, Flows)
- Implement domain model with typed flow steps (extract, transform, load)
- Create example platform specifications
- Provide JSON Schema for editor validation

**Phase 2: Tooling Ecosystem**

- dpac-cli: Validation engine and CLI tooling
- dpac-lsp: Editor integration
- dpac-docs: Documentation generation

**Rollback Strategy**:

- Specification files are pure YAML with no runtime dependencies
- Removing dpac-core has zero impact on existing tool configurations
- The YAML files serve as documentation even without any tooling

## Open Questions

1. **How should large multi-team platforms organize files?** One directory per domain? Flat structure? Convention-based discovery? (Start with flat `platform.yaml`, `sources/`, `datasets/`, `contracts/`, `flows/` directories, add namespace support later if needed)

2. **Should we support alternative formats like CUE or JSON?** YAML is primary, but a JSON superset (with comments) could enable programmatic generation. (Likely: YAML primary, JSON accepted as input but not recommended for hand-editing)

3. **How to handle source-specific metadata?** Different source types (PostgreSQL, S3, API) have different entity structures. Should the DSL be extensible per source type?
