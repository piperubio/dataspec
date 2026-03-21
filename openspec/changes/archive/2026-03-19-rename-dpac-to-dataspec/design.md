## Context

The project currently uses the internal acronym `dpac` (Declarative Data Platform Architecture) in:

- Package directories: `packages/dpac-core/`, `packages/dpac-cli/`
- Package names: `@dataspec/dpac-core`, `@dataspec/dpac-cli`
- CLI binary: `bin/dpac`
- OpenSpec change directories: `dpac-lsp/`, `dpac-docs/`
- Spec content: All 7 spec files in `openspec/specs/` contain extensive `dpac`/`DPAC` references

The user has decided to standardize on `dataspec` as the naming convention, aligning internal names with the npm scope `@dataspec`.

**Constraints:**

- This is a breaking change for external users of the npm packages
- This is a breaking change for CLI users (command name changes)
- OpenSpec change directories that reference `dpac` in their names should also be renamed

## Goals / Non-Goals

**Goals:**

- Rename all `dpac` references to `dataspec` consistently across the entire codebase
- Update package.json names, directory names, binary names, and all content references
- Update OpenSpec change directories to match the new naming

**Non-Goals:**

- This is not a feature change — no new capabilities are being added
- Not updating archived changes (under `openspec/changes/archive/`) — historical records remain as-is
- Not updating `examples/` directory content unless it contains actual dpac references in source code (not spec content)

## Decisions

### Decision 1: Rename package directories before updating file contents

**Choice:** Rename `packages/dpac-core/` → `packages/dataspec-core/` and `packages/dpac-cli/` → `packages/dataspec-cli/` first, then update all file contents.

**Rationale:** If we update file contents first and then rename directories, we risk git tracking renames as delete+create instead of rename. Doing directory rename first ensures cleaner git history. Also, updating relative imports (like `../../dpac-core`) to absolute paths in `dpac-cli/package.json` dependency is simpler when the target directory name is already correct.

**Alternative considered:** Update all file contents while directories are still named `dpac-*`, then rename. Rejected — relative import paths in `dpac-cli/package.json` (`"@dataspec/dpac-core": "file:../dpac-core"`) would need to reference the old directory name, causing churn.

### Decision 2: Update spec content in-place rather than creating delta specs

**Choice:** Directly edit `openspec/specs/*.md` files to replace `dpac`/`DPAC` references instead of creating delta spec files.

**Rationale:** This is a bulk find-and-replace operation. Creating delta spec files for 7 specs would be overhead since the change is purely textual renaming — no behavioral requirements are being modified. The `proposal.md` already documents that these specs are being modified.

**Alternative considered:** Create delta specs for each modified spec. Rejected — the overhead of creating 7 delta files is not justified for a pure rename operation.

### Decision 3: Keep the CLI binary name `dataspec` (not `dspec` or similar)

**Choice:** The CLI binary should be named `dataspec` to match the package scope and be self-documenting.

**Rationale:** Shorter names like `dspec` save characters but lose clarity. Since this is a breaking change anyway, using the full `dataspec` name is preferable.

### Decision 4: Do not rename archived change directories

**Choice:** Leave `openspec/changes/archive/2026-03-19-dpac-cli/` and `openspec/changes/archive/2026-03-19-dpac-core/` unchanged.

**Rationale:** These are historical artifacts. Renaming them would break historical traceability without benefit.

### Decision 5: Rename non-archived change directories `dpac-lsp` and `dpac-docs`

**Choice:** Rename `openspec/changes/dpac-lsp/` → `dataspec-lsp/` and `openspec/changes/dpac-docs/` → `dataspec-docs/`.

**Rationale:** These are active working changes (not archived), so they should reflect the current naming convention.

## Risks / Trade-offs

- **[Risk] Breaking change for npm consumers** → Mitigation: Document in CHANGELOG and release as major version bump (v1.0.0 or similar)
- **[Risk] Breaking change for CLI users** → Mitigation: Update documentation, provide migration note (e.g., "rename your `dpac` alias to `dataspec`")
- **[Risk] Git history harder to follow after rename** → Mitigation: Perform directory renames in a single commit before content changes, use `git mv` to ensure git detects renames
- **[Risk] Missed `dpac` references in some file** → Mitigation: After manual replacements, run a final grep pass to confirm zero `dpac` occurrences (excluding archive)
