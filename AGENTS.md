# Development Guide

This repository contains the DataSpec (Data Platform Specs) toolset for designing data platform specifications with human and agents in mind. It includes the core logic and the CLI.

## 🛠 Commands

The project is structured as a monorepo using **Bun** as the primary runtime and test runner.

## 🎨 Code Style & Conventions

### 📦 Imports

- Use **ESM** (ECMAScript Modules).
- Use `node:` prefix for built-in modules (e.g., `import { join } from 'node:path'`).
- Prefer named imports over default imports.
- Maintain a clean separation between external and internal imports.
- Don't use barrel files; import directly from source files for clarity.
- Use `oxlint --lsp` for linting and `oxfmt --lsp` for formatting to maintain code consistency.
