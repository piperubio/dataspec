## 1. Investigation

- [x] 1.1 Find the validation logic that scans for "resources outside dataspec folder"
- [x] 1.2 Identify where the workspace root is determined (default `dataspec/` or via `--path`)
- [x] 1.3 Locate the file system scanning code that needs to be constrained

## 2. Implementation

- [x] 2.1 Modify validation scanning to respect workspace boundary
- [x] 2.2 Ensure sibling folders outside workspace are not scanned
- [x] 2.3 Simplify code by removing legacy resource detection

## 3. Verification

- [x] 3.1 Test validation with sibling folders (should not report errors)
- [x] 3.2 Test validation with workspace folder (should work correctly)
- [x] 3.3 Test edge cases (nested workspaces, various folder structures)

## Summary

**Problem:** The validate command was scanning sibling folders outside the dataspec workspace and reporting them as "resources outside dataspec folder" errors, even when those folders contained no dataspec YAML files.

**Solution:** Simplified the scanning logic in `packages/dataspec-cli/src/parsing/scanner.ts`:

1. **When `dataspec/` folder exists:** Only scan within the `dataspec/` folder for resources. Sibling folders at the parent level are completely ignored.

2. **When no `dataspec/` folder exists:** Scan from the specified path directly.

**Key changes:**
- Resources are now only loaded from within the `dataspec/` folder when it exists
- Removed all legacy resource detection code (119 lines deleted)
- Sibling folders like `datasets/` are now completely ignored
- All 88 tests pass

**Files modified:**
- `packages/dataspec-cli/src/parsing/scanner.ts` - Simplified scanning logic
- `packages/dataspec-cli/src/parsing/workspace.ts` - Removed legacyResources from interface
- `packages/dataspec-cli/src/validation/structure.ts` - Removed legacy resource validation

**Tests:**
- All 88 tests pass
- Manual testing confirms sibling folders are ignored
- Manual testing confirms proper dataspec workspaces validate successfully
