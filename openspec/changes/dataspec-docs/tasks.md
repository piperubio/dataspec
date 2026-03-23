## 1. Documentation Generator — Core Types and Interfaces

- [ ] 1.1 Define Markdown renderer types and interfaces (MermaidNode, MermaidEdge, MermaidDiagram, DocPage, DocOutput)
  - Files: `packages/dataspec-cli/src/docs/types.ts`

- [ ] 1.2 Define diagram splitting thresholds and scaling configuration types
  - Files: `packages/dataspec-cli/src/docs/types.ts`

## 2. Documentation Generator — Mermaid Diagram Renderer

- [ ] 2.1 Implement Mermaid diagram builder: convert DependencyGraph to Mermaid flowchart LR syntax with subgraphs per layer (raw, refined, serving)
  - Files: `packages/dataspec-cli/src/docs/mermaid.ts`

- [ ] 2.2 Implement CSS class assignment for resource types (source, raw, refined, serving, contract) in Mermaid output
  - Files: `packages/dataspec-cli/src/docs/mermaid.ts`

- [ ] 2.3 Implement diagram scaling: detect threshold breach (40 nodes / 80 edges) and split into per-layer diagrams
  - Files: `packages/dataspec-cli/src/docs/mermaid.ts`

- [ ] 2.4 Write unit tests for Mermaid diagram builder and splitting logic
  - Files: `packages/dataspec-cli/src/docs/__tests__/mermaid.test.ts`

## 3. Documentation Generator — Markdown Page Renderers

- [ ] 3.1 Implement overview page renderer: platform summary, storage backends, analytics engines, high-level lineage subgraph
  - Files: `packages/dataspec-cli/src/docs/renderers.ts`

- [ ] 3.2 Implement dataset catalog renderer: Markdown table with Name, Layer, Storage, Format, Contract columns
  - Files: `packages/dataspec-cli/src/docs/renderers.ts`

- [ ] 3.3 Implement source catalog renderer: list sources with type and entities
  - Files: `packages/dataspec-cli/src/docs/renderers.ts`

- [ ] 3.4 Implement contract reference renderer: per-contract sections with version, field name, type, and constraints table
  - Files: `packages/dataspec-cli/src/docs/renderers.ts`

- [ ] 3.5 Implement lineage page renderer: full diagram page and per-layer pages (raw.md, refined.md, serving.md) with cross-links
  - Files: `packages/dataspec-cli/src/docs/renderers.ts`

- [ ] 3.6 Write unit tests for all Markdown page renderers
  - Files: `packages/dataspec-cli/src/docs/__tests__/renderers.test.ts`

## 4. Documentation Generator — Orchestrator and File Writer

- [ ] 4.1 Implement doc generation orchestrator: parse workspace, build graph, render all pages, write to output directory
  - Files: `packages/dataspec-cli/src/docs/generator.ts`

- [ ] 4.2 Implement file writer: create `docs/` directory structure (overview.md, catalog/, lineage/) and write generated Markdown files
  - Files: `packages/dataspec-cli/src/docs/generator.ts`

- [ ] 4.3 Implement `--check` mode: generate docs in temp dir and diff against existing docs/ to detect staleness
  - Files: `packages/dataspec-cli/src/docs/generator.ts`

- [ ] 4.4 Write integration tests for full doc generation using the ecommerce example workspace
  - Files: `packages/dataspec-cli/src/docs/__tests__/generator.test.ts`

## 5. CLI — `dataspec docs generate` Command

- [ ] 5.1 Create `dataspec docs` parent command with `generate` subcommand
  - Files: `packages/dataspec-cli/src/commands/docs.ts`

- [ ] 5.2 Wire command options: `--path <dir>`, `--output <dir>`, `--check` flags
  - Files: `packages/dataspec-cli/src/commands/docs.ts`

- [ ] 5.3 Register `docsCommand` in CLI entry point
  - Files: `packages/dataspec-cli/src/cli.ts`, `packages/dataspec-cli/src/commands/index.ts`

## 6. CLI — `dataspec inspect` Command

- [ ] 6.1 Create `dataspec inspect` command with default overview action: display resource counts and storage backends
  - Files: `packages/dataspec-cli/src/commands/inspect.ts`

- [ ] 6.2 Implement `inspect dataset <name>` action: show dataset details, layer, storage, contract, producing/consuming flows
  - Files: `packages/dataspec-cli/src/commands/inspect.ts`

- [ ] 6.3 Implement `inspect flow <name>` action: show flow steps, inputs, and outputs
  - Files: `packages/dataspec-cli/src/commands/inspect.ts`

- [ ] 6.4 Implement `inspect lineage <dataset>` action: show upstream and downstream lineage tree
  - Files: `packages/dataspec-cli/src/commands/inspect.ts`

- [ ] 6.5 Register `inspectCommand` in CLI entry point
  - Files: `packages/dataspec-cli/src/cli.ts`, `packages/dataspec-cli/src/commands/index.ts`

- [ ] 6.6 Write unit tests for inspect command (all four modes)
  - Files: `packages/dataspec-cli/src/commands/__tests__/inspect.test.ts`

## 7. Integration and Validation

- [ ] 7.1 Update ecommerce example workspace with a larger platform that triggers diagram splitting (>40 nodes)
  - Files: `examples/ecommerce-platform/`

- [ ] 7.2 Run `bun run build` in `packages/dataspec-cli` to verify binary compilation
  - Files: `packages/dataspec-cli/`

- [ ] 7.3 Run `bun lint` and `bun format` to ensure code consistency
  - Files: project root

- [ ] 7.4 End-to-end test: run `dataspec docs generate` on ecommerce workspace and verify all output files render correctly
  - Files: `packages/dataspec-cli/src/docs/__tests__/e2e.test.ts`
