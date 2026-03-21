# workspace-boundary-validation Specification

## Purpose

TBD - created by archiving change fix-workspace-validation-scope. Update Purpose after archive.

## Requirements

### Requirement: Validate command respects workspace boundary

The validate command SHALL only scan and validate resources within the dataspec workspace folder (default: `dataspec/` or path specified via `--path`).

#### Scenario: Workspace with sibling folders using default path

- **WHEN** the user runs `dataspec validate` from a project with a `dataspec/` folder
- **AND** there are folders at the same level as the `dataspec/` folder (siblings)
- **THEN** the validate command SHALL NOT scan or report errors for those sibling folders

#### Scenario: Workspace with sibling folders using custom --path

- **WHEN** the user runs `dataspec validate --path custom-dataspec/` from a project
- **AND** there are folders at the same level as the `custom-dataspec/` folder (siblings)
- **THEN** the validate command SHALL NOT scan or report errors for those sibling folders

#### Scenario: Resources within workspace

- **WHEN** the user runs `dataspec validate` from within a dataspec workspace
- **AND** there are resources within the dataspec workspace folder
- **THEN** the validate command SHALL scan and validate those resources

#### Scenario: Validation error for misplaced resources within workspace

- **WHEN** the user runs `dataspec validate` from within a dataspec workspace
- **AND** there are resources within the workspace but outside the expected structure
- **THEN** the validate command SHALL report those resources as misplaced
