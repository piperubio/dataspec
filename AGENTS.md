# Development Guide

This repository contains the DataSpec (Data Platform Specs) toolset for designing data platform specifications with human and agents in mind. It includes the core logic and the CLI.

## 🛠 Commands

The project is structured as a monorepo using **Bun** as the primary runtime and test runner.

- Use `oxlint --lsp` for linting and `oxfmt --lsp` for formatting to maintain code consistency.
- Run `bun lint` to check for linting errors and `bun format` to auto-format the codebase.

### 📦 Imports

- Use **ESM** (ECMAScript Modules).
- Use `node:` prefix for built-in modules (e.g., `import { join } from 'node:path'`).
- Prefer named imports over default imports.
- Maintain a clean separation between external and internal imports.
- Don't use barrel files; import directly from source files for clarity.

### Git Workflow

- ALWAYS use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`, `style:`
- NEVER push to `main` directly. ALWAYS create a branch and open a PR
- Branch naming: `feat/description`, `fix/description`, `docs/description`, `hotfix/description`, `release/description`, `chore/description`
- When creatinmg PR's, write clear descriptions explaining WHAT and WHY

# File artifacts in project (OpenSpec flow)

artifact_store:
mode: openspec
