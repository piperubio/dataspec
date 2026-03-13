## Why

The core DPaC validation engine and CLI are functional, but users must manually run `dpac validate` to see errors. This breaks the development flow — errors are discovered late, context is lost when switching between terminal and editor, and there's no real-time guidance while writing YAML. An LSP server closes this feedback loop by surfacing validation errors, hover documentation, and navigation directly in the editor as users type.

## What Changes

- **`lsp-server`**: Full Language Server Protocol implementation providing real-time diagnostics, hover information, go-to-definition, and autocompletion for DPaC YAML files. Reuses the core validation engine for consistency.

## Capabilities

### New Capabilities
- `lsp-server`: LSP server implementation with diagnostics, hover, go-to-definition, and completion. Maintains an in-memory workspace index for cross-file reference tracking and breaking change detection via dependency graph analysis.

### Modified Capabilities
<!-- No existing specs modified — this is a new standalone capability -->

## Impact

- **New package**: `packages/lsp-server/` with its own dependencies (`vscode-languageserver`, `vscode-languageserver-textdocument`, `yaml`)
- **Core dependency**: Imports validation engine and graph utilities from `packages/core`
- **CLI integration**: Adds `dpac lsp` command to start the server
- **Editor support**: VS Code extension can communicate with the server; protocol-compatible with Neovim, Cursor, and AI agents
- **Performance**: Maintains in-memory workspace index; incremental sync for large workspaces
