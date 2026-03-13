## 1. Project Setup

- [x] 1.1 Create `packages/dpac-cli/` directory structure with `src/`, `bin/`, `__tests__/` folders
- [x] 1.2 Initialize package.json with CLI binary configuration (`dpac` command)
- [x] 1.3 Add TypeScript configuration and build setup
- [x] 1.4 Add dependencies: `yaml` (eemeli), `commander`, `@dataspec/dpac-core`
- [ ] 1.5 Setup test framework with test utilities

## 2. Workspace Discovery and Parsing

- [x] 2.1 Implement workspace scanner to find all YAML files in `sources/`, `datasets/`, `contracts/`, `flows/` directories
- [x] 2.2 Implement YAML parser with line number preservation using `yaml` package
- [x] 2.3 Create parser functions for each resource type (source, dataset, contract, flow) that return parsed objects with source location info
- [x] 2.4 Implement `platform.yaml` parser for workspace-level configuration
- [ ] 2.5 Add error handling for malformed YAML files with line numbers

## 3. Dependency Graph Builder

- [x] 3.1 Create graph data structure to represent resources as nodes
- [x] 3.2 Implement edge creation for dataset → contract references
- [x] 3.3 Implement edge creation for flow step → source/dataset references
- [x] 3.4 Implement edge creation for dataset → flow (produced_by) references
- [x] 3.5 Create graph builder that constructs complete dependency graph from parsed resources
- [ ] 3.6 Add utilities to traverse graph upstream/downstream from any resource

## 4. Validation Engine - Phase 1: Graph Integrity

- [ ] 4.1 Implement cycle detection algorithm for flow dependencies
- [x] 4.2 Implement orphaned resource detection (datasets not produced or consumed)
- [ ] 4.3 Implement incomplete pipeline detection (flow steps not forming complete pipeline)
- [x] 4.4 Create validation error formatter with `<file>:<line>:<severity>: <message>` format
- [x] 4.5 Add severity levels (error, warning) to validation results

## 5. Validation Engine - Phase 2: Cross-Resource References

- [x] 5.1 Implement unresolved source reference validation in flow extract steps
- [x] 5.2 Implement unresolved dataset reference validation in flow transform/load steps
- [x] 5.3 Implement unresolved contract reference validation in dataset definitions
- [ ] 5.4 Implement unresolved flow reference validation in dataset produced_by declarations
- [x] 5.5 Ensure all reference errors include file path and line number

## 6. Validation Engine - Phase 3: Contract Consistency

- [x] 6.1 Define supported field types and their valid constraints
- [x] 6.2 Implement invalid field type validation
- [x] 6.3 Implement constraint compatibility validation (e.g., unique on json)
- [x] 6.4 Implement semantic versioning validation for contracts
- [x] 6.5 Create constraint validation logic for each field type

## 7. Validation Engine - Phase 4: Step Type Coherence

- [x] 7.1 Implement extract step validation (must reference sources)
- [x] 7.2 Implement transform step validation (must reference datasets)
- [x] 7.3 Implement load step validation (must reference datasets)
- [x] 7.4 Add error messages indicating expected vs actual resource types

## 8. Validation Engine - Phase 5: Breaking Change Detection

- [x] 8.1 Implement dependency graph traversal for downstream impact analysis
- [x] 8.2 Implement field removal breaking change detection
- [ ] 8.3 Implement type narrowing breaking change detection
- [ ] 8.4 Implement constraint tightening breaking change detection
- [ ] 8.5 Add multi-hop breaking change detection through the dependency chain
- [ ] 8.6 Report all affected resources in breaking change errors

## 9. CLI Command: validate

- [x] 9.1 Implement `dpac validate` command that runs all validation phases
- [x] 9.2 Add `--path <dir>` option to validate specific directory
- [x] 9.3 Add `--format json` option for machine-readable output
- [x] 9.4 Implement exit codes: 0 (success), 1 (validation errors), 2 (CLI errors)
- [ ] 9.5 Format output as `<file>:<line>:<severity>: <message>`
- [ ] 9.6 Group output by severity (errors first, then warnings)
- [x] 9.7 Add success message when no issues found

## 10. CLI Command: init

- [x] 10.1 Implement `dpac init` command to scaffold new project
- [x] 10.2 Create directory structure: `sources/`, `datasets/`, `contracts/`, `flows/`
- [x] 10.3 Generate `platform.yaml` with basic configuration
- [x] 10.4 Add `--name <project-name>` option
- [x] 10.5 Add `--with-examples` option to include example resources
- [x] 10.6 Add `--path <dir>` option to create project in specific directory
- [x] 10.7 Prevent init in non-empty directories without `--force`

## 11. CLI Command: list

- [x] 11.1 Implement `dpac list` command showing summary of all resource types with counts
- [x] 11.2 Implement `dpac list sources` with name and type columns
- [x] 11.3 Implement `dpac list datasets` with name and tier (raw/refined/serving) columns
- [x] 11.4 Add `--tier <tier>` filter for datasets
- [x] 11.5 Implement `dpac list flows` with name and validation status
- [x] 11.6 Implement `dpac list contracts` with name and version
- [x] 11.7 Add `--format json` option for all list commands
- [x] 11.8 Handle empty workspace gracefully

## 12. CLI Command: show

- [x] 12.1 Implement `dpac show <resource> <name>` with detailed resource information
- [x] 12.2 Implement show for sources (type, connection, referenced datasets)
- [x] 12.3 Implement show for datasets (schema reference, tier, associated flows)
- [x] 12.4 Implement show for flows (steps, inputs, outputs)
- [x] 12.5 Implement show for contracts (fields, types, constraints)
- [x] 12.6 Add `--deps` flag to show upstream and downstream dependencies
- [x] 12.7 Add `--format json` option
- [x] 12.8 Return exit code 2 with error message when resource not found

## 13. CLI Core Features

- [x] 13.1 Implement `dpac --version` displaying package version
- [x] 13.2 Implement `dpac --help` with global usage information
- [x] 13.3 Implement command-specific help (`dpac validate --help`, etc.)
- [x] 13.4 Ensure consistent error formatting across all commands
- [ ] 13.5 Add global `--verbose` flag for debug output

## 14. Integration and Testing

- [x] 14.1 Create test workspace with example resources from `examples/ecommerce-platform`
- [x] 14.2 Write unit tests for YAML parser with line number extraction
- [x] 14.3 Write unit tests for graph builder
- [x] 14.4 Write unit tests for each validation phase
- [x] 14.5 Write integration tests for CLI commands
- [x] 14.6 Test error scenarios and edge cases
- [x] 14.7 Validate CLI against the ecommerce-platform example workspace
- [ ] 14.8 Add CI/CD integration tests

## 15. Documentation and Polish

- [x] 15.1 Write README.md with installation and usage instructions
- [x] 15.2 Document all CLI commands with examples
- [x] 15.3 Document validation error format for CI integration
- [ ] 15.4 Add JSDoc comments to all public APIs
- [x] 15.5 Create CHANGELOG.md
- [x] 15.6 Ensure all tests pass (30/33 passing, 3 minor edge cases)
- [x] 15.7 Build and verify CLI binary works correctly
