## 1. Investigation

- [ ] 1.1 Find the validation logic that scans for "resources outside dataspec folder"
- [ ] 1.2 Identify where the workspace root is determined (default `dataspec/` or via `--path`)
- [ ] 1.3 Locate the file system scanning code that needs to be constrained

## 2. Implementation

- [ ] 2.1 Modify validation scanning to respect workspace boundary
- [ ] 2.2 Ensure sibling folders outside workspace are not scanned
- [ ] 2.3 Maintain existing validation for misplaced resources within workspace

## 3. Verification

- [ ] 3.1 Test validation with sibling folders (should not report errors)
- [ ] 3.2 Test validation with misplaced resources within workspace (should report errors)
- [ ] 3.3 Test edge cases (nested workspaces, various folder structures)
