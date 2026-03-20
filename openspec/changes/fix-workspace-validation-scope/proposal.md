## Why

The dataspec CLI `validate` command is incorrectly scanning and validating resources that exist outside the dataspec workspace folder. When running `dataspec validate` from within a dataspec workspace, it should only validate resources within that workspace's directory structure, not sibling folders.

## What Changes

- Fix the workspace boundary detection in the validation logic
- Ensure `dataspec validate` only scans files within the dataspec workspace folder
- Prevent false-positive errors for folders like `datasets/` that exist outside the workspace

## Capabilities

### New Capabilities
- `workspace-boundary-validation`: Properly constrain validation scope to the dataspec workspace folder only

### Modified Capabilities
<!-- No existing spec-level requirement changes - this is a bug fix in implementation -->

## Impact

- CLI validation command behavior
- File system scanning logic in the dataspec core
- No breaking changes to APIs or external interfaces
