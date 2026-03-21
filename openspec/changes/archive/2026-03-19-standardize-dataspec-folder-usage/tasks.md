# Implementation Tasks

## 1. Scanner Module Updates

- [x] 1.1 Modify `scanWorkspace()` in `scanner.ts` to detect `dataspec/` folder at workspace root
- [x] 1.2 Update `scanWorkspace()` to search for resources inside `dataspec/` instead of root
- [x] 1.3 Add error detection for legacy structure (resources at root level)
- [x] 1.4 Add validation for missing `dataspec/` folder
- [x] 1.5 Update `WorkspaceResources` interface and related types if needed

## 2. Init Command Updates

- [x] 2.1 Modify `init.ts` to create `dataspec/` container folder
- [x] 2.2 Update `init` command to place `platform.yaml` inside `dataspec/`
- [x] 2.3 Update `init` command to create subdirectories inside `dataspec/` (sources, datasets, contracts, flows)
- [x] 2.4 Update example creation to write files inside `dataspec/`
- [x] 2.5 Update `init` command success messages to reflect new structure

## 3. Workspace Parsing Updates

- [x] 3.1 Update `parseWorkspace()` in `workspace.ts` to handle new `dataspec/` path
- [x] 3.2 Ensure `rootPath` correctly identifies workspace root (parent of `dataspec/`)
- [x] 3.3 Update file path references in parsed objects

## 4. Validation Engine Updates

- [x] 4.1 Add workspace structure validation in `validator.ts`
- [x] 4.2 Implement detection of legacy structure (files at root)
- [x] 4.3 Add error message for missing `dataspec/` folder
- [x] 4.4 Add error message listing misplaced resources
- [x] 4.5 Add warning for legacy structure detection

## 5. Error Messages

- [x] 5.1 Create consistent error message format for structure violations
- [x] 5.2 Add error message: "Workspace must contain a 'dataspec/' folder. Run 'dataspec init' to create a new project."
- [x] 5.3 Add error message: "Found resources outside 'dataspec/' folder. Move the following into 'dataspec/': [list]"
- [x] 5.4 Add warning message: "Legacy workspace structure detected. Please move resources into 'dataspec/' folder."

## 6. CLI Tests Updates

- [x] 6.1 Update `init.test.ts` to expect new folder structure
- [x] 6.2 Add test case for `init` creating `dataspec/` folder
- [x] 6.3 Add test case for `init --with-examples` creating files inside `dataspec/`
- [x] 6.4 Update validation tests for new structure requirements
- [x] 6.5 Add test case for detecting legacy structure
- [x] 6.6 Add test case for missing `dataspec/` folder error

## 7. Integration Tests

- [x] 7.1 Add test case for full workflow: init → validate with new structure
- [x] 7.2 Add test case for error when running validate without `dataspec/` folder
- [x] 7.3 Add test case for error when resources are at root level
- [x] 7.4 Add test case for warning when legacy structure detected

## 8. Documentation Updates

- [x] 8.1 Update README with new folder structure diagram
- [x] 8.2 Add migration guide section for existing projects
- [x] 8.3 Update CLI help text and examples
- [x] 8.4 Update `openspec/specs/cli-tooling/spec.md` to reflect new default structure
