# Development Guide

This repository contains the DPAC (Declarative Data Platform Architecture) toolset, including the core logic and the CLI.

## 🛠 Commands

The project uses **Bun** as the primary runtime and test runner.

## 🎨 Code Style & Conventions

### 📦 Imports
- Use **ESM** (ECMAScript Modules).
- Use `node:` prefix for built-in modules (e.g., `import { join } from 'node:path'`).
- Prefer named imports over default imports.
- Maintain a clean separation between external and internal imports.
- Don't use barrel files; import directly from source files for clarity.




