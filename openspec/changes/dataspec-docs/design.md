## Context

DPaC core provides a YAML-based DSL for defining data platforms with validation. Once validated, the platform model exists in memory but produces no external artifacts for human consumption. This change adds documentation generation and model inspection capabilities that transform the validated model into readable, navigable documentation.

The documentation must be:
- **GitHub-renderable**: No external servers or JavaScript bundles
- **Self-contained**: Generated files work without the CLI
- **Navigable**: Clear structure with links between related resources
- **Scalable**: Handles platforms with hundreds of datasets

## Goals / Non-Goals

**Goals:**
- Generate Markdown documentation with Mermaid diagrams from any valid platform workspace
- Produce lineage visualizations showing data flow from sources to serving layer
- Generate dataset catalog with storage, format, and contract information
- Generate contract reference documentation
- Provide `dataspec inspect` CLI for interactive model exploration
- Ensure all output renders correctly on GitHub

**Non-Goals:**
- Web server or interactive documentation site (static files only)
- Real-time documentation updates (batch generation only)
- PDF or other non-Markdown formats
- Historical versioning of documentation
- Custom themes or styling beyond GitHub's defaults

## Decisions

### Markdown + Mermaid for Documentation Format
**Decision**: Use Markdown with embedded Mermaid diagrams for all generated documentation.

**Rationale**:
- GitHub natively renders both Markdown and Mermaid (since 2022)
- No build step or external hosting required
- Version-controllable alongside source code
- Text-based diffs for code review

**Alternatives considered**:
- *Sphinx/reStructuredText*: Better cross-references but requires build step and hosting
- *Docusaurus/VuePress*: Richer UX but requires Node.js build and deployment
- *PlantUML*: Less widely supported than Mermaid on GitHub

### Mermaid Flowchart LR for Lineage
**Decision**: Use `flowchart LR` (left-to-right) for lineage diagrams.

**Rationale**:
- Data flow naturally reads left-to-right (sources → raw → refined → serving)
- Fits common screen aspect ratios better than top-down
- Mermaid LR flowcharts render reliably on GitHub

**CSS classes for resource types**:
- Sources: green (`classDef source fill:#d4edda`)
- Datasets (Raw): light green (`classDef raw fill:#e8f5e9`)
- Datasets (Refined): blue (`classDef refined fill:#e3f2fd`)
- Datasets (Serving): purple (`classDef serving fill:#f3e5f5`)
- Contracts: orange (`classDef contract fill:#fff3e0`)

### Scaling Strategy for Large Platforms
**Decision**: Split diagrams when exceeding thresholds (40 nodes or 80 edges).

**Rationale**:
- GitHub has rendering limits for large Mermaid diagrams
- Large diagrams become unreadable regardless of technical limits
- Layer-based splitting aligns with mental model

**Implementation**:
- Automatic detection of threshold breach
- Generate separate diagrams by layer: `raw.md`, `refined.md`, `serving.md`
- Full diagram replaced with index linking to split diagrams

### Output Directory Structure
**Decision**: Use hierarchical structure organized by concern.

```
docs/
  overview.md              # Platform summary + high-level diagram
  catalog/
    datasets.md            # All datasets table
    sources.md             # All sources table
    contracts.md           # All contracts reference
  lineage/
    full.md                # Complete lineage (or index if split)
    by-layer/
      raw.md               # Raw layer lineage
      refined.md           # Refined layer lineage
      serving.md           # Serving layer lineage
```

**Rationale**:
- Separates catalog (entity lists) from lineage (relationships)
- Allows deep linking to specific concerns
- Scalable: can add `by-domain/` or `by-team/` without restructuring

### `dataspec inspect` as CLI Command
**Decision**: Implement model inspection as a CLI subcommand with resource-type subcommands.

**Syntax**: `dataspec inspect [resource-type] [resource-name]`

**Modes**:
- `dataspec inspect` — platform overview (resource counts, storage backends)
- `dataspec inspect dataset <name>` — dataset details + lineage
- `dataspec inspect flow <name>` — flow steps and dependencies
- `dataspec inspect lineage <dataset>` — upstream/downstream lineage tree

**Rationale**:
- Consistent with existing `dataspec validate` and `dataspec init` commands
- No additional flags needed for different inspection modes
- Shell-completion friendly

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mermaid rendering fails on complex diagrams | High | Implement automatic splitting at 40 nodes/80 edges; provide textual lineage fallback |
| GitHub Mermaid version lag | Medium | Use basic flowchart syntax only; avoid experimental features |
| Large platform documentation is slow to generate | Medium | Implement incremental generation (only changed resources); cache parsed model |
| Generated docs become stale | Low | Document generation as CI step; fail build if docs not up to date |
| `dataspec inspect` output too verbose | Low | Default to summary view; add `--verbose` flag for full details |

## Migration Plan

**No migration required** — this is a new capability, not a change to existing behavior.

**Adoption path**:
1. Upgrade to DataSpec version with docs support
2. Run `dataspec docs generate` in existing workspace
3. Commit generated `docs/` directory
4. (Optional) Add CI check: `dataspec docs generate --check` fails if docs out of sync

## Open Questions

1. Should `dataspec inspect lineage` support depth limiting (e.g., `--depth 3`)?
2. Should we generate change logs between versions in the docs?
3. Should documentation include data samples or profiling statistics?
