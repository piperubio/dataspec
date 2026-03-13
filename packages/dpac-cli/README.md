# @dataspec/dpac-cli

DPAC CLI - Command-line interface for the Declarative Data Platform Architecture

## Installation

```bash
npm install -g @dataspec/dpac-cli
```

Or use with npx:

```bash
npx @dataspec/dpac-cli <command>
```

## Quick Start

```bash
# Create a new DPAC project
dpac init --name my-data-platform

# Validate your workspace
dpac validate

# List resources
dpac list

# Show details of a specific resource
dpac show dataset users_raw
```

## Commands

### `dpac init`

Initialize a new DPAC project with the standard directory structure.

```bash
dpac init [options]
```

Options:
- `-n, --name <name>` - Project name (default: "my-data-platform")
- `-p, --path <dir>` - Path to create the project (default: current directory)
- `-e, --with-examples` - Include example resources
- `-f, --force` - Overwrite existing files

Example:
```bash
dpac init --name ecommerce-platform --with-examples
```

### `dpac validate`

Validate the workspace for errors, checking:
- Graph integrity (cycles, orphaned resources)
- Cross-resource references
- Contract consistency
- Step type coherence
- Breaking changes

```bash
dpac validate [options]
```

Options:
- `-p, --path <dir>` - Path to the workspace directory
- `-f, --format <format>` - Output format: `text` or `json` (default: text)

Exit codes:
- `0` - Validation passed
- `1` - Validation failed (errors found)
- `2` - CLI error

Example:
```bash
dpac validate --path ./my-platform --format json
```

### `dpac list`

List resources in the workspace.

```bash
dpac list [resource] [options]
```

Arguments:
- `resource` - Resource type: `sources`, `datasets`, `contracts`, `flows`

Options:
- `-p, --path <dir>` - Path to the workspace directory
- `-f, --format <format>` - Output format: `text` or `json`
- `-t, --tier <tier>` - Filter datasets by tier (raw, refined, serving)

Examples:
```bash
dpac list                    # Show summary of all resources
dpac list sources           # List all sources
dpac list datasets --tier raw  # List only raw datasets
```

### `dpac show`

Show detailed information about a specific resource.

```bash
dpac show <resource> <name> [options]
```

Arguments:
- `resource` - Resource type: `source`, `dataset`, `contract`, `flow`
- `name` - Resource name

Options:
- `-p, --path <dir>` - Path to the workspace directory
- `-d, --deps` - Show upstream and downstream dependencies
- `-f, --format <format>` - Output format: `text` or `json`

Examples:
```bash
dpac show dataset users_raw
dpac show flow orders_etl_pipeline --deps
dpac show contract user_contract --format json
```

## Workspace Structure

A DPAC workspace follows this structure:

```
my-platform/
├── platform.yaml           # Platform configuration
├── sources/                # Data sources
│   └── production_db.yaml
├── datasets/               # Datasets by layer
│   ├── raw/
│   │   └── users_raw.yaml
│   ├── refined/
│   │   └── users_refined.yaml
│   └── serving/
│       └── users_analytics.yaml
├── contracts/              # Data contracts by layer
│   ├── raw/
│   ├── refined/
│   └── serving/
└── flows/                  # Data pipelines
    └── users_etl.yaml
```

## Validation

The CLI performs comprehensive validation:

### Graph Integrity
- Identifies orphaned datasets (not produced or consumed)

> Note: Cycle detection and incomplete pipeline checks are planned for a future release.

### Cross-Resource References
- Ensures all references resolve to declared resources
- Validates source references in extract steps
- Validates dataset references in transform/load steps
- Validates contract references in datasets

### Contract Consistency
- Validates field types are supported
- Checks constraint compatibility (e.g., unique on JSON)
- Validates semantic versioning

### Step Type Coherence
- Extract steps must reference sources
- Transform steps must reference datasets
- Load steps must reference datasets

### Breaking Changes
Currently performs limited breaking-change checks focused on contract structure:
- Flags referenced contracts that define zero fields (likely indicating removed or incomplete schemas)

More advanced detection for field removal, type narrowing, and constraint tightening is planned but not yet implemented.

## Error Format

Validation errors follow this format:

```
<file-path>:<line>:<severity>: <message>
```

Example:
```
sources/postgres.yaml:12:error: Undefined source reference 'legacy_db' in flow 'extract_users'
contracts/users.yaml:8:warning: Field 'email' is not referenced by any flow
```

## CI/CD Integration

The CLI is designed for CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Validate DPAC workspace
  run: |
    npm install -g @dataspec/dpac-cli
    dpac validate --path ./data-platform
```

Exit codes enable pipeline control:
- Exit code 1 on validation failures
- JSON output for programmatic processing

## License

MIT
