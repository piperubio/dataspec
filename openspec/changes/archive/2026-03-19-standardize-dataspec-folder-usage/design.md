# Design: Standardize Dataspec Folder Usage

## Context

### Background

The dataspec CLI currently creates and expects resources at the workspace root:
- `platform.yaml` at root
- `sources/`, `datasets/`, `contracts/`, `flows/` directories at root

This design has several issues:
1. **Cluttered workspace**: Data transformation code, configs, and dataspec definitions mix together
2. **No clear boundaries**: Users cannot easily identify what belongs to dataspec vs other project files
3. **Future limitations**: Multi-project workspaces (multiple dataspec projects in one repo) would be unclear

### Current State

**File**: `packages/dataspec-cli/src/parsing/scanner.ts`
- Hardcoded directory names: "sources", "datasets", "contracts", "flows"
- Scans directly at provided root path
- No container folder concept

**File**: `packages/dataspec-cli/src/commands/init.ts`
- Creates directories directly at project root
- No `dataspec/` container folder

**File**: `packages/dataspec-cli/src/parsing/workspace.ts`
- `rootPath` points to workspace root
- Resources resolved relative to root

### Constraints

1. **Breaking change**: Existing projects will fail validation
2. **No migration command**: Users must manually migrate (per user request)
3. **Backward compatibility not required**: Clean break is acceptable
4. **Simple implementation**: Minimal code changes preferred

### Stakeholders

- CLI users running `dataspec init` or `dataspec validate`
- CI/CD pipelines executing `dataspec validate`
- Developers maintaining dataspec-core and dataspec-cli packages

## Goals / Non-Goals

**Goals:**
- Enforce `dataspec/` as the mandatory container folder for all resources
- Update `init` command to create the new structure
- Update scanner to search in `dataspec/` subfolder
- Add validation errors for misplaced resources
- Provide clear error messages for migration guidance

**Non-Goals:**
- Providing an automated migration command (`dataspec migrate`)
- Supporting both old and new structures simultaneously
- Multi-project workspace support (future consideration)
- Preserving backward compatibility

## Decisions

### Decision 1: Single Container Folder Named `dataspec/`

**Choice**: Use `dataspec/` as the container folder name (kebab-case, lowercase).

**Alternatives Considered:
- `.dataspec/` (hidden folder) - Rejected: Makes debugging harder, not discoverable by users
- `specs/` - Rejected: Too generic, conflicts with common spec folders
- `<project-name>/` - Rejected: Requires project name to be known at scan time

**Rationale**:
- Matches project naming convention (dataspec)
- Clear and discoverable by users
- Simple to implement and document
- No configuration needed

### Decision 2: Scanner Search Path

**Choice**: Modify `scanWorkspace()` to look for `dataspec/` subfolder first, then scan within it.

**Implementation**:
```typescript
// Current: scanWorkspace(dirPath) scans for sources/, datasets/ at root
// New: scanWorkspace(dirPath) scans for dataspec/ first, then scans within
```

**Alternatives Considered**:
- Accept `--path dataspec/` flag - Rejected: Requires user to specify path correctly
- Auto-detect both locations - Rejected: Adds complexity, enables bad patterns

**Rationale**:
- Single source of truth for resource location
- Clear error messages when structure is wrong
- Simple validation logic

### Decision 3: Error Handling for Legacy Structure

**Choice**: Detect legacy structure and emit clear error messages with manual migration steps.

**Error Messages**:
- Missing `dataspec/`: "Workspace must contain a 'dataspec/' folder. Run 'dataspec init' to create a new project."
- Resources at root: "Found resources outside 'dataspec/' folder. Move the following into 'dataspec/': [list]"

**Alternatives Considered**:
- Silent ignore with deprecation warning - Rejected: Delayed pain, not clear enough
- Auto-migrate on first run - Rejected: Risky, could cause unexpected file moves

**Rationale**:
- Clear guidance for users
- No surprise file modifications
- User controls migration timing

### Decision 4: Init Command Structure

**Choice**: `dataspec init` creates `dataspec/` folder with all subdirectories.

**Structure Created**:
```
my-project/
└── dataspec/
    ├── platform.yaml
    ├── sources/
    ├── datasets/
    │   ├── raw/
    │   ├── refined/
    │   └── serving/
    ├── contracts/
    └── flows/
```

**Rationale**:
- Matches spec requirements exactly
- Clear separation from other project files
- Simple to understand and navigate

## Risks / Trade-offs

### Risk 1: Breaking Existing Projects

**Risk**: Users with existing dataspec projects will get validation errors after upgrade.

**Mitigation**:
- Clear error messages with migration steps
- Documentation updates with migration guide
- Release notes highlighting breaking change

### Risk 2: CI/CD Pipeline Failures

**Risk**: Automated pipelines running `dataspec validate` will fail on existing projects.

**Mitigation**:
- Communicate breaking change clearly in release notes
- Provide migration steps in documentation
- Suggest pinning version for critical pipelines during migration

### Risk 3: User Confusion About Structure

**Risk**: Users may not understand why the change was made.

**Mitigation**:
- Document the rationale in README
- Clear error messages that explain the requirement
- Example projects showing the new structure

### Trade-off: No Automated Migration

**Trade-off**: Users must manually migrate files to `dataspec/` folder.

**Acceptance Reason**:
- Simpler implementation (per user request)
- No risk of unexpected file moves
- User has full control over migration process

## Migration Plan

### For New Projects

Users running `dataspec init` will automatically get the new structure. No action needed.

### For Existing Projects

Manual migration steps (to be documented):

1. Create `dataspec/` folder:
   ```bash
   mkdir dataspec
   ```

2. Move platform configuration:
   ```bash
   mv platform.yaml dataspec/
   ```

3. Move resource directories:
   ```bash
   mv sources dataspec/
   mv datasets dataspec/
   mv contracts dataspec/
   mv flows dataspec/
   ```

4. Validate structure:
   ```bash
   dataspec validate
   ```

### Rollback Strategy

For this breaking change, rollback means reverting to previous version:

1. Pin to previous dataspec-cli version in CI/CD
2. Revert file moves manually if needed

There is no in-version rollback as this is a structural change.

## Open Questions

None. All decisions are resolved based on user requirements and constraints.