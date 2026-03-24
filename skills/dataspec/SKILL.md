---
name: dataspec-dsl
description: >
  Guide for understanding and using the DataSpec DSL (Declarative Data Platform Architecture) to model data platforms in YAML.
  Use this skill whenever working with DataSpec files, creating or editing dataspec resources (platforms, sources, contracts, datasets, flows),
  validating dataspec workspaces, or when a user mentions data platform specs, data contracts, ETL pipeline definitions, data catalog,
  data governance YAML, or declarative data architecture. Also trigger when the user asks how to define data sources, schemas,
  pipelines, or storage backends in YAML for a data platform project. MUST trigger on any mention of "dataspec", "data spec",
  "platform.yaml", "sources/", "contracts/", "datasets/", "flows/" in the context of a data platform, or when asked to create
  or modify YAML files that define data infrastructure declaratively.
license: MIT
metadata:
  author: dataspec
  version: '1.0'
---

# DataSpec DSL Skill

You are an expert in the DataSpec DSL — a declarative YAML-based language for modeling complete data platforms. Your job is to help users create, edit, validate, and understand DataSpec specifications.

## Important: How to Access Reference Files

Reference files in this skill use **relative paths** from the skill's base directory. When you need to read a reference file, you MUST prepend the skill's base directory to the relative path.

**How to resolve paths:**

1. When the skill loads, note the **base directory** shown in the output
2. Combine the base directory with the relative path from this document
3. Use the resulting absolute path to read reference files

**Example:** To read `references/platform.md`, use:

```
<skill-base-directory>/references/platform.md
```

Replace `<skill-base-directory>` with the actual base directory path provided when the skill was loaded.

## Quick Context

DataSpec models a data platform using five resource types, all defined as YAML files inside a `dataspec/` folder:

| Resource     | Purpose                                   | File location               |
| ------------ | ----------------------------------------- | --------------------------- |
| **Platform** | Global config: storage backends + engines | `dataspec/platform.yaml`    |
| **Source**   | External data producers                   | `dataspec/sources/*.yaml`   |
| **Contract** | Versioned schemas with field constraints  | `dataspec/contracts/*.yaml` |
| **Dataset**  | Logical data units with storage config    | `dataspec/datasets/*.yaml`  |
| **Flow**     | ETL pipelines with typed steps            | `dataspec/flows/*.yaml`     |

## How to Help Users

When a user asks you to work with DataSpec:

1. **Identify the resource type** they need (platform, source, contract, dataset, or flow)
2. **Read the relevant reference file** from `references/` in this skill directory for the exact syntax
3. **Check existing files** in the project's `dataspec/` folder for conventions and naming patterns
4. **Consult the project example** at `examples/ecommerce-platform/dataspec/` for a complete real-world reference
5. **Create or edit YAML** following the syntax and conventions documented in references
6. **Validate** by running `dataspec validate` if the CLI is available

## Reference to Project Example

This skill ships with the DataSpec project. For a complete, working example of a DataSpec workspace, refer to:
`examples/ecommerce-platform/dataspec/`

This example includes:

- `platform.yaml` — 3 storage backends, 3 engines
- `sources/` — 9 sources (database, API, file system, streaming, SaaS)
- `contracts/` — 70+ contract definitions with various field types and constraints
- `datasets/` — 15 datasets across raw, refined, and analytics layers
- `flows/` — 6 ETL/ELT pipelines

Use it as a reference when creating new resources to understand naming patterns, metadata conventions, and cross-referencing.

## Core Workflow

### Creating a new resource

1. Determine the resource type needed
2. Read the corresponding reference: `references/<resource-type>.md`
3. Check what already exists in the project's `dataspec/` folder to follow naming conventions
4. Write the YAML file in the correct directory
5. Ensure all cross-references resolve (source names, contract names, dataset names, engine names)

### Key Relationships to Enforce

- **Sources** reference **Contracts** for entity schemas
- **Datasets** reference **Storage backends** (defined in platform) and **Contracts**
- **Flows** reference **Sources** (in extract steps), **Engines** (in transform steps), and **Datasets** (in load steps)
- All names used in references must be declared somewhere in the workspace

### Contract-First Approach

Always define contracts before referencing them from sources or datasets. Contracts use semantic versioning (`1.0.0`). Breaking changes require a new version.

## Supported Data Types (for Contract fields)

`uuid`, `string`, `integer`, `decimal`, `boolean`, `timestamp`, `date`, `json`

## Field Constraints

- `unique: true` — value must be unique across all records
- `not_null: true` — value cannot be null
- `ref: "ContractName.fieldName"` — foreign key reference

## Source Types

| Type          | Extra fields                                                | Use case                    |
| ------------- | ----------------------------------------------------------- | --------------------------- |
| `database`    | entities with `location`, `contract`                        | PostgreSQL, MySQL, etc.     |
| `api`         | `protocol`, `baseUrl`, entities with `location`, `method`   | REST/gRPC APIs              |
| `file_system` | entities with `location`, `format`, optional `partition_by` | S3, local files             |
| `streaming`   | `protocol`, `baseUrl`, entities with `location`             | Kafka, WebSocket, MQTT      |
| `saas`        | `provider`, entities with optional `location`               | Salesforce, HubSpot, Stripe |

## Flow Step Types

- **extract**: `{ type, source, entity, output }` — reads from a source
- **transform**: `{ type, inputs[], engine, output }` — applies transformations
- **load**: `{ type, input, target }` — writes to a dataset

Steps connect via variable names: the `output` of one step becomes the `input` of another.

## Storage Types (Platform)

`s3`, `postgresql`, `clickhouse`

## Engine Types (Platform)

`spark`, `duckdb`, `dbt`, `python`

## CLI Commands

```bash
dataspec init [--name <name>] [--with-examples]   # Create new project
dataspec validate [--path <dir>] [--format json]   # Validate workspace
dataspec list [sources|datasets|contracts|flows]    # List resources
dataspec show <resource> <name> [--deps]           # Show resource details
```

## Common Mistakes to Avoid

1. Placing resource files outside the `dataspec/` folder — everything must be inside it
2. Referencing a contract/source/dataset/engine name that doesn't exist in the workspace
3. Using invalid data types in contract fields
4. Missing required fields for specific source types (e.g., `protocol` and `baseUrl` for streaming)
5. Flow steps that reference undefined output variable names from previous steps
6. Not versioning contracts properly (must be semver: `major.minor.patch`)

## Detailed References

For complete syntax and examples, read the relevant reference file from the skill's `references/` directory:

- `references/platform.md` — Platform configuration syntax
- `references/source.md` — Source definition syntax (all 5 types)
- `references/contract.md` — Contract and field definition syntax
- `references/dataset.md` — Dataset definition syntax
- `references/flow.md` — Flow and step definition syntax
- `references/workspace.md` — Workspace structure and conventions
