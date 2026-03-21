## Context

The dataspec CLI `validate` command currently scans the file system starting from the current working directory rather than being constrained to the dataspec workspace folder. This causes it to incorrectly identify resources in sibling directories (like `datasets/`) as being "outside" the dataspec folder, when in fact they should be completely ignored since they're not part of the dataspec workspace.

The validation logic needs to be updated to:

1. Identify the dataspec workspace root (the folder named `dataspec/` or the path specified via `--path`)
2. Only scan and validate resources within that workspace root
3. Ignore any files or folders outside the workspace boundary

## Goals / Non-Goals

**Goals:**

- Fix the validation scope to only include files within the dataspec workspace
- Prevent false-positive validation errors for folders outside the workspace
- Maintain backward compatibility for valid workspace structures

**Non-Goals:**

- Changing the workspace detection logic (finding the dataspec root)
- Modifying the validation rules themselves
- Adding new validation capabilities

## Decisions

**Decision: Use workspace root as the boundary for all validation scans**

- Rationale: The workspace root (where `dataspec/` folder exists, or the path specified via `--path`) defines the logical boundary of the dataspec project
- Alternative considered: Using `.gitignore`-style exclusion patterns - rejected as overkill for this bug fix

**Decision: Keep the existing "resources outside folder" error for files that ARE within the workspace but in wrong locations**

- Rationale: This error message is still valid for misplaced resources within the workspace
- The fix is specifically about not scanning outside the workspace at all

## Risks / Trade-offs

**Risk**: Users might have been relying on the current behavior (intentionally or not)
→ **Mitigation**: This is clearly a bug - the error message itself says "outside 'dataspec/' folder" which implies it should only be concerned with the dataspec folder contents

**Risk**: Edge cases with nested dataspec workspaces
→ **Mitigation**: The fix should use the nearest ancestor dataspec root as the boundary, which matches standard workspace behavior
