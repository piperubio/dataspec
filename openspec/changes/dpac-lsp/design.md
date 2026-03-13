## Context

DPaC core provides a validation engine that checks YAML DSL files for correctness, including graph integrity, cross-resource references, and breaking change detection via workspace dependency analysis. The CLI exposes this via `dpac validate`, but this requires manual execution and doesn't integrate with the editor experience.

The LSP server bridges this gap by running as a background process that editors communicate with via JSON-RPC. It maintains an in-memory representation of the workspace, enabling real-time feedback without requiring users to switch context.

## Goals / Non-Goals

**Goals:**
- Provide real-time diagnostics that match `dpac validate` output
- Support hover documentation for resource references and DSL constructs
- Enable navigation (go-to-definition) across files in the workspace
- Offer context-aware autocompletion for resource names, fields, and enums
- Detect breaking changes immediately by analyzing the dependency graph
- Maintain sub-500ms response time for all operations
- Support VS Code, Neovim, Cursor, and generic LSP clients

**Non-Goals:**
- Code actions (quick fixes) in V1 — may be added in V2
- Refactoring/rename support — out of scope for initial release
- Formatting/onTypeFormatting — YAML formatting is handled by other extensions
- Git integration or version control features — breaking changes detected via graph analysis only
- Multi-root workspace support in V1 — assume single workspace root

## Decisions

### Architecture: vscode-languageserver with custom WorkspaceIndex

**Decision:** Use `vscode-languageserver@^9.0.0` as the protocol layer with a custom `WorkspaceIndex` for cross-file resource tracking.

**Rationale:**
- `vscode-languageserver` provides a battle-tested, spec-compliant implementation
- Custom WorkspaceIndex allows optimized incremental updates and efficient reverse-lookup for reference tracking
- The core validation engine already builds a dependency graph; WorkspaceIndex mirrors this structure for the LSP

**Alternatives considered:**
- **Alternative: Pure custom implementation** — Rejected: Too much complexity for protocol boilerplate
- **Alternative: pygls (Python)** — Rejected: Core is TypeScript; maintaining two languages adds friction
- **Alternative: tower-lsp (Rust)** — Rejected: Same reason as Python; team expertise is in TypeScript

### Protocol: JSON-RPC over stdio

**Decision:** Use stdio transport for maximum compatibility.

**Rationale:**
- Works with VS Code, Neovim, Emacs, Cursor, and AI agents without additional configuration
- No network port management required
- Simple to spawn from CLI (`dpac lsp`)

**Alternatives considered:**
- **Alternative: TCP socket** — Rejected: Requires port configuration; firewall issues on some systems
- **Alternative: WebSocket** — Rejected: Overkill for local editor communication

### Synchronization: Incremental text document sync

**Decision:** Use incremental synchronization (`TextDocumentSyncKind.Incremental`).

**Rationale:**
- Large YAML files (1000+ lines) would cause performance issues with full sync
- `vscode-languageserver-textdocument` handles the complexity
- Allows partial re-parsing and targeted index updates

**Alternatives considered:**
- **Alternative: Full document sync** — Rejected: Unacceptable performance for large files

### Breaking Change Detection: Workspace dependency graph analysis

**Decision:** Detect breaking changes by analyzing the workspace dependency graph, not Git history.

**Rationale:**
- Works in any environment (even without Git)
- Immediate feedback — no need to compare with previous versions
- Aligns with core validation engine approach
- Can detect cross-resource impacts in real-time (e.g., "this field removal breaks 3 flows")

**Alternatives considered:**
- **Alternative: Git diff-based detection** — Rejected: Requires VCS, slower, doesn't work for new files

### Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `vscode-languageserver` | ^9.0.0 | LSP protocol implementation |
| `vscode-languageserver-textdocument` | ^1.0.0 | Text document management |
| `yaml` (eemeli) | ^2.3.0 | YAML parsing with location info |

**Rationale:**
- `yaml` library provides AST with source positions — critical for mapping diagnostics to line/column
- Standard Microsoft LSP libraries ensure compatibility

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| **LSP protocol complexity** | Medium | Use `vscode-languageserver` to handle protocol boilerplate; focus on DPaC-specific logic |
| **Cross-file reference tracking bugs** | High | Comprehensive test suite with multi-file fixtures; property-based tests for graph integrity |
| **Performance on large workspaces** | Medium | Incremental sync + targeted index updates; benchmark with 1000+ resource files |
| **Memory usage for workspace index** | Medium | Index stores only necessary metadata (not full file contents); text documents managed by library |
| **Version mismatch between LSP and core** | Low | Both in same monorepo; shared version pinning |

**Trade-offs:**
- **Memory vs. Speed:** Workspace index uses more memory but enables O(1) lookups for references
- **Completeness vs. Complexity:** V1 omits code actions to reduce scope; diagnostics and navigation provide core value

## Migration Plan

### Phase 1: Foundation (Week 1)
- Set up `packages/lsp-server/` package structure
- Implement connection layer and document manager
- Integrate with core validation engine for basic diagnostics
- Add `dpac lsp` CLI command

### Phase 2: Workspace Index (Week 2)
- Implement WorkspaceIndex with resource extraction
- Cross-file reference tracking
- Incremental index updates on file changes

### Phase 3: Features (Week 3)
- Hover provider
- Go-to-definition
- Completion provider

### Phase 4: Breaking Changes (Week 4)
- Dependency graph integration
- Real-time breaking change detection
- Multi-file impact analysis

### Phase 5: Polish (Week 5)
- Performance optimization
- Error handling and logging
- Documentation and examples

## Open Questions

1. **Configuration:** Should the LSP server read `.dpacrc` for custom validation rules? (Likely yes — consistency with CLI)
2. **Multi-root workspaces:** Defer to V2 or implement basic support in V1? (Recommend defer)
3. **Custom schemas:** How to handle user-defined extensions to the DSL? (Likely via configuration)
