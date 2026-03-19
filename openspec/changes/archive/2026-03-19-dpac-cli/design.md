## Context

dpac-core establishes the domain model for the Data Platform as Code ecosystem — sources, datasets, contracts, and flows with their schemas and relationships. However, a declarative model without validation is dangerous: typos in resource names go undetected, contracts can be broken silently, and cyclic dependencies only surface at runtime. Data engineers need confidence that their platform definition is valid before committing changes.

The validation engine serves as the correctness layer that operates on the dpac-core domain model. It builds a dependency graph from all resources in the workspace and validates constraints across that graph. The CLI provides the interface through which developers interact with this validation system.

**Current State**: dpac-core defines the data structures but has no validation logic. Errors in YAML files are only caught when downstream tools fail to process them.

**Desired State**: Running `dpac validate` immediately reports all graph integrity issues, broken references, contract violations, and breaking changes — with precise file paths and line numbers for every error.

## Goals / Non-Goals

**Goals:**
- Build a validation engine that checks graph integrity (cycles, orphans), cross-resource references, contract consistency, and step type coherence
- Detect breaking changes via workspace-wide dependency graph analysis (NOT Git history comparison)
- Provide a CLI with `validate`, `init`, `--version`, and `--help` commands
- Format validation errors consistently with file paths, line numbers, and severity levels
- Design for CI/CD integration (exit codes, machine-readable output)

**Non-Goals:**
- Git-based breaking change detection (using diff against history)
- Real-time validation feedback (LSP server is a separate change)
- Documentation generation or `dpac inspect` (moved to dpac-docs change)
- Automatic fixing of validation errors
- Validation of actual data content (only structural/schema validation)
- Integration with external schema registries

## Decisions

### Decision: Workspace-level breaking change detection via dependency graph analysis
**Rationale**: Breaking changes should be detected by analyzing the current state of the workspace, not by comparing against Git history. The workspace contains all resources (contracts, datasets, flows) and their relationships. If a contract removes a field that a downstream flow consumes, the incompatibility is immediately detectable by traversing the dependency graph — no historical comparison needed.

**Breaking change taxonomy** (following Buf's established model):
- **Breaking**: Field removal when downstream consumers reference it, type narrowing that violates downstream expectations, nullable→non-nullable when consumers don't handle it, constraint tightening that invalidates existing flow assumptions
- **Additive**: New optional fields not yet consumed, type widening, constraint relaxation
- **Compatible**: Documentation, comments, formatting changes

**Detection mechanism**: The validation engine builds a dependency graph where:
- Contracts are nodes with field definitions
- Datasets reference contracts (Dataset → Contract edge)
- Flow steps reference datasets and contracts (Flow → Dataset/Contract edges)

The engine traverses this graph to validate that all references can be satisfied by the current workspace state. If Contract A removes field X, and Flow B references X, the graph traversal detects this as an unsatisfied reference — a breaking change.

**Libraries**: `yaml` (eemeli) for parsing with line number preservation.

**Alternatives considered**:
- **Git-based breaking change detection** (`simple-git` + structural diff against history): **Rejected** — adds runtime dependency on Git, conflates versioning with validation, doesn't work for fresh workspaces or shallow clones. The workspace graph already contains all information needed to detect incompatibilities.
- **Schema registry integration**: **Rejected for V1** — adds external dependency, complicates setup. Considered for future enhancement.

### Decision: CLI architecture with subcommand pattern
**Rationale**: A consistent subcommand pattern (`dpac <command>`) provides clear separation of concerns and extensibility. `validate` and `init` are the core commands for this change.

**Command structure**:
```
dpac validate [options]          # Validate workspace
dpac init [options]              # Scaffold new project
dpac --version                   # Show version
dpac --help                      # Show help
```

**Alternatives considered**:
- **Single-command with flags**: `dpac --validate`, `dpac --init`. **Rejected** — doesn't scale as command set grows, less intuitive
- **Separate binaries**: `dpac-validate`, `dpac-init`. **Rejected** — fragmentation hurts discoverability

### Decision: Validation report format with severity levels
**Rationale**: Validation output needs to be both human-readable and machine-parseable. Severity levels (error, warning) enable CI pipelines to fail on errors while allowing warnings. File paths and line numbers enable editors and agents to locate issues.

**Format**:
```
<file-path>:<line>:<severity>: <message>
```

Example:
```
sources/postgres.yaml:12:error: Undefined source reference 'legacy_db' in flow 'extract_users'
contracts/users.yaml:8:warning: Field 'email' is not referenced by any flow
```

**Exit codes**:
- `0`: Validation passed (no errors, warnings allowed)
- `1`: Validation failed (one or more errors)
- `2`: CLI error (invalid arguments, file not found)

**Alternatives considered**:
- **JSON output only**: **Rejected** — harder to read in terminal, can be added as `--format json` option later
- **JUnit XML**: **Rejected** — adds complexity, can be added as output format later
- **No severity levels**: **Rejected** — all issues would block CI, too rigid

### Decision: Source validation without connection details
**Rationale**: dpac-core defines sources with only name, type, and entities — no connection details (host, port, credentials). The validation engine SHALL validate source references exist and have valid types, but SHALL NOT validate connection parameters or credentials.

**Alternatives considered**:
- **Include connection validation**: **Rejected** — contradicts dpac-core design where connection details are externalized

## Risks / Trade-offs

**[Risk] Breaking change detection complexity**
Building and traversing the complete dependency graph across all resources requires careful implementation to avoid performance issues on large workspaces.
→ **Mitigation**: Start with reference resolution — flag any unresolved reference. Optimize graph building for incremental validation later.

**[Risk] YAML parsing with line number preservation**
Not all YAML parsers preserve line numbers, which are critical for error reporting.
→ **Mitigation**: Use `yaml` package by eemeli which supports line number extraction via custom schema.

**[Risk] Adoption friction**
Teams may resist adding a validation step to their workflow.
→ **Mitigation**: Make validation fast (< 1 second for typical workspaces), provide clear error messages with actionable fixes, and demonstrate CI integration value.

**[Risk] Validation scope creep**
The engine could grow to validate runtime concerns (actual data quality, connection health).
→ **Mitigation**: Strictly limit validation to structural and schema concerns. Document that runtime validation is out of scope.

## Migration Plan

**Phase 1: Graph Integrity & Reference Validation**
- Implement YAML parser with line number extraction
- Build dependency graph from workspace resources
- Implement cycle detection in flow dependencies
- Implement orphaned resource detection
- Implement cross-reference validation (all references resolve)
- CLI: `dpac validate` with basic output

**Phase 2: Contract Validation & Breaking Changes**
- Implement contract schema validation (types, constraints)
- Implement step type coherence validation
- Implement breaking change detection via dependency graph analysis
- CLI: Enhanced error formatting with severity levels

**Phase 3: Polish & CI Integration**
- Performance optimization for large workspaces
- Exit codes for CI/CD integration
- JSON output format option (`--format json`)
- Comprehensive test coverage

**Rollback Strategy**:
- Validation is read-only — no modifications to source files
- Removing dpac-cli has zero impact on existing platform definitions
- Validation can be bypassed if needed by not running `dpac validate`

## Open Questions

1. **Should the validation engine support incremental validation?** For large workspaces, re-validating everything on every change may be slow. Incremental validation (only changed files and their dependents) would improve performance but add complexity.

2. **How should multi-workspace scenarios be handled?** If a workspace references resources defined in another workspace (e.g., shared contracts), should the validation engine resolve external references or treat them as opaque?

3. **Should we support custom validation rules?** Teams may want to enforce organization-specific constraints (naming conventions, required metadata). This would require a plugin system.
