## Context

DataSpec currently enforces a medallion architecture through the `layer` property on datasets (raw, refined, serving). This creates a rigid structure that:

- Forces directory organization into `datasets/{raw,refined,serving}/`
- Requires the `layer` field in every dataset YAML
- Validates layer values against a fixed enum

The medallion pattern is useful but not universal. Teams should be free to organize datasets according to their own conventions using tags or metadata.

## Goals / Non-Goals

**Goals:**

- Remove the `layer` property from dataset definitions entirely
- Flatten directory structure from `datasets/{layer}/` to `datasets/`
- Maintain backward compatibility path through migration tooling
- Preserve all other dataset functionality (contracts, storage, metadata)

**Non-Goals:**

- Adding a replacement tagging system (tags already exist)
- Changing contract definitions (contracts don't have layer)
- Modifying flow definitions or validation logic

## Decisions

### Decision 1: Flat Directory Structure

**Choice:** Flatten `datasets/` and `contracts/` directories, removing layer-based subdirectories.

**Alternatives Considered:**

- Keep subdirectories for organization but remove layer from YAML — rejected because it creates confusion between file location and spec content
- Allow arbitrary subdirectories — rejected because it adds complexity without clear benefit

**Rationale:** A flat structure is simplest. Teams can use naming conventions or future tagging features to organize datasets.

### Decision 2: Remove Layer Without Replacement

**Choice:** Remove `layer` completely without adding an alternative field.

**Alternatives Considered:**

- Replace with `tier` or `stage` field — rejected because it's the same problem with a different name
- Make `layer` optional — rejected because it leaves technical debt and partial complexity

**Rationale:** Tags already exist as a flexibleategorization mechanism. Making layer optional creates confusion about when to use it.

### Decision 3: Clean Break (No Migration Path in Core)

**Choice:** Remove layer in core, let users manually migrate or use future migration tool.

**Alternatives Considered:**

- Support both `layer` (deprecated) and no-layer — rejected as it adds maintenance burden

**Rationale:** The project is early-stage. Breaking changes are acceptable now. A future CLI command can help with migration.

## Risks / Trade-offs

| Risk                                                         | Mitigation                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Breaking change for existing users**                       | Document migration clearly; provide a future migration command                  |
| **Loss of medallion structure for teams that want it**       | Tags can express the same concept flexibly                                      |
| **Directory flattening may create many files in one folder** | Naming conventions (e.g., `users_raw.yaml`, `orders_refined.yaml`) can organize |

## Migration Plan

1. **Core types and parser** — Remove `DatasetLayer` enum, `layer` property, and validation
2. **CLI commands** — Remove `--tier` option, flatten init structure
3. **Tests** — Update all test files to not include layer
4. **Examples** — Flatten directory structure and remove `layer` from YAML files
5. **Documentation** — Update READMEs, remove medallion references

**Rollback:** Git revert of the PR if critical issues are discovered.

## Open Questions

1. Should we provide a `dataspec migrate` command to help users remove `layer` from existing projects?
2. Should we recommend a naming convention (e.g., `_raw`, `_refined` suffixes) in documentation?
