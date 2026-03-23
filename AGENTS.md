# Development Guide

This repository contains the DataSpec (Data Platform Specs) toolset for designing data platform specifications with human and agents in mind. It includes the core logic and the CLI.

## Current Version

- dataspec is in current development and not yet released.
- You can introduce braking changes without worry for retrocompatibility.

## Specification-Driven Development

This project follows a specification-driven development approach. Changes are proposed, designed, and implemented through a structured change process using the OpenSpec framework. Each change includes detailed artifacts such as proposals, specifications, design documents, task breakdowns, dependency analysis, and distribution plans for parallel implementation.

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

- ALWAYS create a branch for new specs and open a PR for review.
- ALWAYS use conventional commits (<type>[optional scope]: <description>): `feat:`, `fix(dataspec-cli):`, `docs:`, `chore:`, `refactor:`, `test(dataspec-core):`, `ci:`, `build:`, `perf:`, `style:`
- NEVER push to `main` directly. ALWAYS create a branch and open a PR
- Branch naming: `feat/description`, `fix/description`, `docs/description`, `hotfix/description`, `release/description`, `chore/description`
- When creating PR's, write clear descriptions explaining WHAT and WHY

### Validation

- validate the binary compilation with `bun run build` in `packages/dataspec-cli`
- `examples/ecommerce-platform` contains a sample workspace. Use it for testing and validation. Keep it up to date with the latest features and changes.
