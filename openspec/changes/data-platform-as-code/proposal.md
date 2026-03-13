## Why

Modern data stacks have created a fragmentation problem: orchestration frameworks (Dagster, Apache Airflow), data loading tools (Airbyte, dlt), transformation engines (dbt, custom pipelines), and governance platforms (DataHub) each define their own proprietary models of the data platform. None provide a unified, platform-level modeling language that spans the entire data lifecycle from ingestion to serving.

This fragmentation creates critical gaps:
- **No single source of truth**: Source definitions live in Airbyte, transformations in dbt, orchestration in Dagster—each with different, incompatible models that cannot reference each other
- **No cross-tool validation**: Breaking changes in dbt models aren't visible to Airbyte syncs; contract violations in sources propagate undetected through transformations
- **No unified versioning**: Platform architecture cannot be versioned in Git because it's scattered across multiple tool-specific configurations
- **Proprietary model lock-in**: Each tool encodes platform knowledge in its own format (Dagster assets, Airflow DAGs, dbt models). Teams cannot migrate between tools without reverse-engineering their entire platform definition from tool-specific code back into architecture decisions

This change introduces a **Data Platform as Code (DPaC)** specification—a declarative DSL that unifies the model across all data tools. It separates data architecture design from tool-specific execution, enabling teams to describe complete data ecosystems (sources, datasets, contracts, flows) once, validate them, and use them as the foundation for agents and humans to implement on any combination of tools.

## What Changes

- **New declarative YAML DSL** for modeling data platforms with four core resources: Sources, Datasets, Contracts, and Flows
- **Validation engine** that checks model consistency before any implementation: graph integrity, contract consistency, cross-resource references, and breaking change detection through workspace-wide dependency analysis
- **Language Server Protocol (LSP) server** providing full editor integration: real-time diagnostics (errors/warnings), hover documentation for resources, go-to-definition across resource references, and autocompletion of resource names, contract fields, and engine identifiers
- **Agent-ready by design** — the YAML DSL is structured so that AI agents can parse the validated model directly as platform context, without needing a separate export format. The YAML *is* the agent interface
- **Generated documentation** — Markdown files with Mermaid diagrams for lineage graphs, dataset catalog tables, and contract documentation, derived automatically from the model. Compatible with GitHub rendering
- **Developer experience (DX)** as a first-class concern: clear error messages with file/line references, project scaffolding, and model inspection tooling via CLI

**Out of scope for this proposal:**
- Automatic code compilation or generation for specific tools (Dagster, Airflow, dbt)
- Direct runtime integrations with data tools
- Execution of pipelines or transformations
- Data quality monitoring or observability (DPaC validates structure and schema, not runtime data)

## Ecosystem Model: The Four Core Resources

DPaC describes complete data ecosystems through four interconnected resources that work together to define the data platform architecture:

### Sources — External Data Producers
**Sources** represent external systems that produce data (databases, APIs, file systems, SaaS applications). They define:
- Connection parameters (host, port, credentials via environment variables)
- Available entities (tables, collections, endpoints) that can be ingested

Sources are the **entry points** to the data platform. They are purely descriptive — they declare what external systems exist and what data they offer, without specifying how to connect at runtime. Data loading tools (Airbyte, dlt) consume this metadata to bring data into the platform's raw layer.

### Datasets — Logical Data Units
**Datasets** represent logical units of data within the platform. Each dataset has:
- A layer assignment (raw, refined, serving) indicating its maturity level
- Storage backend configuration (S3, PostgreSQL, ClickHouse)
- Format specification (Parquet, Delta Lake, CSV)
- A unique name that serves as its identity in the data graph

Datasets are the **nodes** of the data graph. They exist independently of how they are produced or consumed, enabling clear lineage tracking.

### Contracts — Data Quality Guarantees
**Contracts** define formal schemas and quality rules for datasets. Each contract specifies:
- Version number for tracking schema evolution
- Field definitions with data types (uuid, string, timestamp, etc.)
- Constraints (unique, not_null, referential integrity)

Contracts are the **quality gates** of the platform. Breaking change detection works through **workspace-wide cross-resource validation**: the LSP and CLI analyze the dependency graph between contracts, datasets, and flows to detect incompatibilities. If a contract removes a field that a downstream flow consumes, or tightens a constraint that a dependent dataset relies on, the validation engine flags it as a breaking change in real-time. No Git history comparison is needed — the current state of the workspace contains all the information required to detect inconsistencies.

### Flows — Data Movement & Transformation
**Flows** define how datasets are produced from sources through a series of typed steps. Each flow describes:
- Source or upstream dataset inputs
- A sequence of **typed steps**: `extract` (from source to raw), `transform` (between datasets), and `load` (to serving layer)
- Output dataset targets
- Dependencies between steps

Each step type has distinct properties:
- **Extract** steps reference a Source and produce a raw-layer Dataset. They describe *what* to ingest, not *how*.
- **Transform** steps reference input Datasets, specify an engine (Spark, dbt, SQL, Python), and produce output Datasets.
- **Load** steps reference input Datasets and target a serving-layer Dataset with its storage backend.

Flows are the **edges** of the data graph. They define the lineage relationships and the logical execution order.

### How They Work Together

```
Source (postgres.users)
         │
         │ Flow: users_pipeline
         │   step: extract (type: extract)
         ▼
Dataset: users_raw (raw layer)
         │
         │   step: normalize (type: transform, engine: dbt)
         ▼
Dataset: users_normalized (refined layer) ← Contract v1.2
         │
         │   step: publish (type: load)
         ▼
Dataset: users_analytics (serving layer) ← Contract v2.0
```

**The complete ecosystem description enables:**
- **Lineage tracking**: Typed steps make the provenance chain explicit — extract from source, transform through engines, load to serving
- **Impact analysis**: Changing a Contract surfaces which Flows and downstream Datasets are affected. The validation engine traverses the dependency graph to detect incompatibilities across the entire workspace
- **Agent context**: AI agents parse the YAML directly to get full platform context — all resources, their relationships, contracts, and the complete data graph — enabling correct implementation of integrations with any tool
- **Validation**: The validation engine checks graph integrity (no cycles, no orphans), contract consistency (types, constraints), cross-resource references (all names resolve), and step type coherence (extract steps reference sources, transform steps reference datasets)

## Capabilities

### New Capabilities
- `platform-definition`: Define global platform architecture including storage backends and analytics engines
- `source-management`: Declare external data producers with connection details and entity mappings
- `dataset-definition`: Create logical data units organized in layers (raw, refined, serving) with storage configurations
- `data-contracts`: Specify versioned schemas with type constraints, uniqueness rules, and nullability checks. Breaking changes detected via cross-resource dependency analysis within the workspace
- `flow-definition`: Define data flows with typed steps (extract, transform, load) describing how datasets are produced from sources
- `validation-engine`: Validate graph integrity, contract consistency, cross-resource references, and step type coherence
- `lsp-server`: Full LSP implementation — diagnostics (real-time error/warning reporting), hover (resource documentation), go-to-definition (navigate between referenced resources), and completion (resource names, contract fields, engine identifiers)
- `documentation-generation`: Generate Markdown documentation with Mermaid lineage graphs, dataset catalog tables, and contract reference docs. Output is GitHub-renderable
- `cli-tooling`: Developer-facing CLI for validation (`dpac validate`), scaffolding (`dpac init`), and model inspection (`dpac inspect`)

### Modified Capabilities
<!-- No existing capabilities are being modified - this is a new framework -->

## Impact

- **For data engineers**: Define an entire data platform in a single Git repository. Run `dpac validate` in CI to catch broken references, contract violations, and graph inconsistencies before merge. Migrate between tools (e.g., Airflow → Dagster) without losing the platform definition — only the implementation changes, the model stays
- **For AI coding agents**: Parse the YAML model directly as structured context for implementing integrations. Instead of reverse-engineering platform knowledge from Dagster assets + dbt models + Airbyte configs, agents receive a validated, complete graph of sources, datasets, contracts, and flows with all relationships resolved
- **For editors and agent tooling**: The LSP server provides real-time validation feedback (diagnostics), contextual documentation (hover), cross-resource navigation (go-to-definition), and intelligent suggestions (completion) in any LSP-compatible client — VS Code, Neovim, Cursor, or AI coding agents
