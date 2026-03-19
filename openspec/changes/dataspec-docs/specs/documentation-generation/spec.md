## ADDED Requirements

### Requirement: Generate Markdown documentation
The system SHALL generate Markdown documentation files from the validated platform model, suitable for rendering on GitHub.

#### Scenario: Documentation generation command
- **WHEN** a user runs `dataspec docs generate` with a valid workspace
- **THEN** the system SHALL create a `docs/` directory with Markdown files containing platform documentation

### Requirement: Generate Mermaid lineage graphs
The system SHALL generate Mermaid flowchart diagrams showing data lineage from sources through datasets to serving layer.

#### Scenario: Full lineage diagram
- **WHEN** documentation is generated for a workspace with sources, datasets, and flows
- **THEN** the output SHALL include a Mermaid flowchart showing the complete lineage graph with sources, datasets by layer, and flow connections

#### Scenario: Layer subgraph organization
- **WHEN** the lineage graph contains datasets from multiple layers
- **THEN** the Mermaid diagram SHALL use subgraphs to group datasets by layer (Raw, Refined, Serving)

### Requirement: Generate dataset catalog
The system SHALL generate a dataset catalog table listing all datasets with their layer, storage backend, and associated contract.

#### Scenario: Dataset catalog table
- **WHEN** documentation is generated
- **THEN** the output SHALL include `docs/catalog/datasets.md` with a Markdown table containing columns: Name, Layer, Storage, Format, Contract

### Requirement: Generate source catalog
The system SHALL generate a source catalog listing all sources with their types and available entities.

#### Scenario: Source catalog
- **WHEN** documentation is generated
- **THEN** the output SHALL include `docs/catalog/sources.md` listing each source with its type and entities

### Requirement: Generate contract reference documentation
The system SHALL generate contract reference documentation showing field definitions, types, constraints, and versions.

#### Scenario: Contract reference page
- **WHEN** documentation is generated for a workspace with contracts
- **THEN** the output SHALL include `docs/catalog/contracts.md` with each contract's version, fields, types, and constraints

### Requirement: Support diagram scaling
The system SHALL split large lineage diagrams into multiple focused diagrams when the graph exceeds thresholds.

#### Scenario: Large platform diagram splitting
- **WHEN** a platform has more than 40 nodes or 80 edges
- **THEN** the system SHALL generate multiple diagrams organized by layer and domain tags instead of one large diagram

#### Scenario: Per-layer lineage diagrams
- **WHEN** documentation is generated with the split option
- **THEN** the output SHALL include separate lineage files: `docs/lineage/by-layer/raw.md`, `docs/lineage/by-layer/refined.md`, `docs/lineage/by-layer/serving.md`

### Requirement: Generate overview documentation
The system SHALL generate a platform overview document summarizing the entire platform architecture.

#### Scenario: Platform overview
- **WHEN** documentation is generated
- **THEN** the output SHALL include `docs/overview.md` with platform summary, storage backends, analytics engines, and a high-level lineage subgraph

### Requirement: GitHub-renderable output
The system SHALL ensure all generated Markdown and Mermaid is compatible with GitHub's rendering engine.

#### Scenario: GitHub compatibility
- **WHEN** documentation is generated and pushed to a GitHub repository
- **THEN** all Markdown files SHALL render correctly and all Mermaid diagrams SHALL display without errors
