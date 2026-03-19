# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-13

### Added
- Initial release of DataSpec CLI
- `dataspec init` command for scaffolding new projects
- `dataspec validate` command for workspace validation
- `dataspec list` command for listing resources
- `dataspec show` command for inspecting resources
- Validation engine with support for:
  - Cross-resource reference validation
  - Contract consistency validation
  - Step type coherence validation
  - Graph integrity validation (orphaned resources)
  - Breaking change detection
- Dependency graph builder for workspace analysis
- Support for JSON output format
- CI/CD integration with exit codes
