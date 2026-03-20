## Context

The dataspec validation engine currently validates cross-resource references, graph integrity, contract consistency, and breaking changes. However, the specifications explicitly require unique names for each resource type (sources, datasets, contracts, flows), but this constraint is not enforced at the workspace level.

The platform parser (`dataspec-core/src/parsers/platform.ts`) already implements duplicate name detection for storage backends and analytics engines using a Set-based pattern, throwing errors during parsing. This pattern can be adapted for workspace-level validation in the CLI validator.

**Current State:**
- `Validator` class in `validator.ts` has methods for cross-resource refs, graph integrity, contract consistency, and breaking changes
- No validation for unique resource names across files in workspace
- Specs require uniqueness for each resource type

**Stakeholders:**
- Data platform engineers defining dataspec workspaces
- CI/CD pipelines running validation

## Goals / Non-Goals

**Goals:**
- Validate unique names for sources, datasets, contracts, and flows at workspace level
- Report all duplicate names found (not just first) with file paths and line numbers
- Follow existing error code conventions and validation patterns
- Add comprehensive test coverage

**Non-Goals:**
- Cross-resource name conflicts (e.g., a source and dataset with same name) — not required by specs
- Duplicate field names within contracts — existing issue noted in tests, separate change
- Changing the platform parser's handling of storage/engines — already implemented

## Decisions

### 1. Validation Location: `Validator` class (workspace-level)

**Rationale:** 
- The `Validator` class already handles cross-resource checks (unresolved references, orphaned datasets)
- It has access to the complete `Workspace` with all resources
- Follows the established pattern of collecting errors rather than throwing

**Alternative Considered:**
- Add validation in `parseWorkspace()` function
  - But this would exit early on first duplicate, missing other issues
  - Would require structuring error collection differently

### 2. Error Collection: Report all duplicates

**Rationale:**
- Current Validator pattern collects all errors before returning
- Users benefit from seeing all conflicts at once
- Uses `Map<string, { file, line }>` to track first occurrence, then report subsequent duplicates

**Pattern:**
```typescript
const seen = new Map<string, { file: string; line: number }>();
for (const resource of resources) {
  if (seen.has(resource.name)) {
    this.errors.push(createError(
      `Duplicate ${type} name '${resource.name}'`,
      { file: resource.file, line: resource.line },
      'error',
      `DUPLICATE_${TYPE}_NAME`
    ));
  } else {
    seen.set(resource.name, { file: resource.file, line: resource.line });
  }
}
```

### 3. Error Codes: New dedicated codes

**Codes:** `DUPLICATE_SOURCE_NAME`, `DUPLICATE_DATASET_NAME`, `DUPLICATE_CONTRACT_NAME`, `DUPLICATE_FLOW_NAME`

**Rationale:**
- Follows existing convention: `UNRESOLVED_SOURCE`, `ORPHANED_DATASET`, etc.
- Makes errors filterable and programmatically identifiable

### 4. Execution Order: First validation step

**Rationale:**
- Unique names are a prerequisite for valid cross-resource references
- Checking uniqueness first prevents confusing "unresolved reference" errors when duplicates exist

## Risks / Trade-offs

**Risk: Breaking existing workspaces with duplicates**
→ Mitigation: This is intentional — workspaces with duplicates were always invalid per spec. Error messages clearly identify the conflict locations.

**Risk: Performance on large workspaces**
→ Mitigation: `Set` and `Map` lookups are O(1), so validation remains O(n) where n is total resources. Negligible impact.

**Trade-off: Not reporting the first occurrence location**
→ Each duplicate error points to the duplicate location. Users can search for the name to find all occurrences. This is simpler than tracking the first location and reporting it every time.