# Dataspec

A single source of truth — declarative, YAML-based — for modeling your entire data platform: sources, contracts, datasets and flows — tool-agnostic, versionable in Git and validable in CI/CD, designed for humans and AI agents alike.

> ⚠️ **DataSpec is in development and has not been released yet.** It may change, including breaking changes, without notice.

## What is DataSpec?

DataSpec (\_Declarative Data Platform Architecture\_ / \_Data Platform Specs\_) is a toolset for designing data platform specifications through a **declarative YAML-based DSL**. It describes _what_ your platform is — not _how it runs_ — separating architectural design from specific tooling (orchestrators, transformation engines, catalogs, etc.).

The project includes the core logic (`@dataspec/dataspec-core`), the CLI (`@dataspec/dataspec-cli`), the DataHub integration (`@dataspec/dataspec-datahub`) and a skill for AI agents. Development follows a **specification-driven** approach through the [OpenSpec](./openspec/) framework.

### The problem it solves

Modern data stacks are fragmented: orchestration frameworks, ingestion tools, transformation engines and governance platforms each define their own proprietary model. DataSpec provides a unified platform-level modeling language covering the whole data lifecycle, from ingestion to serving.

## Capabilities, features and processes

### Resource model (DSL)

DataSpec models 5 resource types inside a `dataspec/` folder:

| Resource | Location                            | Purpose                                                                         |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| Platform | `dataspec/platform.yaml` (only one) | Global configuration: storage backends, engines, defaults                       |
| Source   | `dataspec/sources/*.yaml`           | External data producers (`database`, `api`, `file_system`, `streaming`, `saas`) |
| Contract | `dataspec/contracts/*.yaml`         | Versioned (semver) schemas with 8 data types and constraints                    |
| Dataset  | `dataspec/datasets/*.yaml`          | Logical data units with storage backend, format and location                    |
| Flow     | `dataspec/flows/*.yaml`             | ETL/ELT pipelines with `extract` → `transform` → `load` steps                   |

Key points of the model:

- **Contract-first**: contracts are defined first; every source/dataset references them.
- **Storage**: `s3`, `postgresql`, `clickhouse`. **Engines**: `spark`, `duckdb`, `dbt`, `python`.
- Mandatory **name uniqueness** across all resources.
- **Definitions-only**: no real connection strings or credentials (handled at deployment time).

### Validation engine

Two-phase validation — JSON Schema (AJV), then semantic validation:

1. Graph integrity: cycles, orphan datasets, incomplete pipelines.
2. Cross-references: every reference (source, dataset, contract, engine, flow) must resolve.
3. Contract consistency: types, constraints and semver evolution.
4. Step coherence: `extract`→source, `transform`→dataset/engine, `load`→dataset.
5. Breaking-change detection via the dependency graph (works in clean CI checkouts).
6. Structured reports with severity, file path and line: `<file>:<line>:<severity>: <message>` — designed so AI agents can fix errors programmatically.

### CLI

```bash
dataspec init      # scaffold a workspace (with --with-examples)
dataspec validate  # full validation (exit 0/1/2, format text|json)
dataspec list      # summary or per-resource listing
dataspec show      # resource details, with --deps for dependencies
dataspec datahub   # connect and sync datasets, sources and lineage to DataHub
```

### DataHub integration

Synchronizes the DataSpec model into a DataHub catalog: datasets, sources and lineage (dataset→dataset edges derived from flows), with health check, `--dry-run` mode and incremental sync.

### Defined processes

- **Specification-Driven Development** with OpenSpec: every change goes through proposal → specs delta → design → tasks → dependencies → distribution (executable with multiple agents in parallel).
- **18 specified capabilities** in [`openspec/specs/`](./openspec/specs/), including `validation-engine`, `data-contracts`, `source-management`, `flow-definition`, `workspace-structure` and the DataHub capabilities.
- **Agent skill** in [`skills/dataspec/`](./skills/dataspec/) so AI agents can create, edit and validate DataSpec resources.

### In development

- **`dataspec docs generate`**: Markdown + Mermaid documentation generation (catalogs and lineage diagrams).
- **`dataspec lsp`**: LSP server with diagnostics, hover, go-to-definition and completion.
- **`dataspec inspect`**: new resource view with layer and lineage awareness.

## Installation and usage

> DataSpec is not published to any registry yet. For now, build from source.

### Requirements

- [Bun](https://bun.sh) (primary runtime)

### Building from the repo

```bash
git clone https://github.com/piperubio/dataspec.git
cd dataspec
bun install
bun run build          # builds the CLI binary at packages/dataspec-cli/bin/dataspec
```

### Quick start

```bash
# Create an example workspace
./packages/dataspec-cli/bin/dataspec init --name my-data-platform --with-examples

# Validate
./packages/dataspec-cli/bin/dataspec validate
./packages/dataspec-cli/bin/dataspec validate --format json

# Explore resources
./packages/dataspec-cli/bin/dataspec list
./packages/dataspec-cli/bin/dataspec list datasets
./packages/dataspec-cli/bin/dataspec show dataset users_raw --deps

# DataHub (requires config in platform.yaml)
./packages/dataspec-cli/bin/dataspec datahub connect
./packages/dataspec-cli/bin/dataspec datahub sync datasets --incremental
```

After building, you can add `packages/dataspec-cli/bin` to your `PATH` to use `dataspec` directly.

### Full example

[`examples/ecommerce-platform`](./examples/ecommerce-platform/) contains a real workspace with 9 sources, 64 contracts, 16 datasets and 6 flows (ETL and ELT) over S3/PostgreSQL/ClickHouse storage:

```bash
./packages/dataspec-cli/bin/dataspec validate --path examples/ecommerce-platform
./packages/dataspec-cli/bin/dataspec list --path examples/ecommerce-platform
```

### As a library

```bash
bun add @dataspec/dataspec-core
```

Exposes the parsers `parsePlatformYaml`, `parseSourceYaml`, `parseContractYaml`, `parseDatasetYaml` and `parseFlowYaml`. See [`packages/dataspec-core/README.md`](./packages/dataspec-core/README.md).

## Development

### Development environment

```bash
git clone https://github.com/piperubio/dataspec.git
cd dataspec
bun install
```

Monorepo with workspaces in `packages/`:

| Package                      | Description                                  |
| ---------------------------- | -------------------------------------------- |
| `@dataspec/dataspec-core`    | Parsing, types and JSON schemas of the DSL   |
| `@dataspec/dataspec-cli`     | CLI, graph, semantic validation and commands |
| `@dataspec/dataspec-datahub` | Client and syncs towards DataHub             |

Main commands:

```bash
bun test                 # tests (also: bun run test:core / test:cli)
bun run typecheck        # tsc --noEmit on all packages
bun run lint             # oxlint
bun run lint:fix         # oxlint --fix
bun run fmt              # oxfmt (formatting)
bun run fmt:check        # oxfmt --check
bun run build            # builds the CLI binary
```

Notes:

- Use `oxlint --lsp` and `oxfmt --lsp` in your editor for live linting and formatting.
- A pre-commit hook (Husky) runs `lint:fix` and `fmt` automatically.
- CI runs typecheck → lint → fmt:check → build → tests and binary smoke-tests against `examples/ecommerce-platform`. Keep that example up to date with the latest changes.

### Contributing

1. **Never push directly to `main`.** Always create a branch and open a PR:
   - Branches: `feat/description`, `fix/description`, `docs/description`, `chore/description`, `hotfix/description`, `release/description`.
2. **Conventional commits**: `<type>[optional scope]: <description>` — `feat:`, `fix(dataspec-cli):`, `docs:`, `chore:`, `refactor:`, `test(dataspec-core):`, `ci:`, `build:`, `perf:`, `style:`.
3. In the PR, describe **what** changes and **why**.
4. Before opening the PR, validate:
   ```bash
   bun run typecheck && bun run lint && bun run fmt:check && bun test
   bun run build
   ./packages/dataspec-cli/bin/dataspec validate --path examples/ecommerce-platform
   ```
5. **Code conventions**:
   - ESM; `node:` prefix for builtins; named imports over default imports.
   - No barrel files: import directly from source files.
   - The project is _specification-driven_: functional changes are proposed first via OpenSpec (see [`AGENTS.md`](./AGENTS.md) and [`openspec/`](./openspec/)).

More details in [`AGENTS.md`](./AGENTS.md).
