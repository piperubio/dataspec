# @dataspec/dataspec-cli

DataSpec CLI - Command-line interface for the DataSpec project (Declarative Data Platform Architecture)

## Installation

```bash
npm install -g @dataspec/dataspec-cli
```

Or use with npx:

```bash
npx @dataspec/dataspec-cli <command>
```

## Quick Start

```bash
# Create a new DataSpec project
dataspec init --name my-data-platform

# Validate your workspace
dataspec validate

# List resources
dataspec list

# Show details of a specific resource
dataspec show dataset users_raw
```

## Commands

### `dataspec init`

Initialize a new dataspec project with the standard directory structure.

```bash
dataspec init [options]
```

Options:
- `-n, --name <name>` - Project name (default: "my-data-platform")
- `-p, --path <dir>` - Path to create the project (default: current directory)
- `-e, --with-examples` - Include example resources
- `-f, --force` - Overwrite existing files

Example:
```bash
dataspec init --name ecommerce-platform --with-examples
```

### `dataspec validate`

Validate the workspace for errors, checking:
- Graph integrity (cycles, orphaned resources)
- Cross-resource references
- Contract consistency
- Step type coherence
- Breaking changes

```bash
dataspec validate [options]
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
dataspec validate --path ./my-platform --format json
```

### `dataspec list`

List resources in the workspace.

```bash
dataspec list [resource] [options]
```

Arguments:
- `resource` - Resource type: `sources`, `datasets`, `contracts`, `flows`

Options:
- `-p, --path <dir>` - Path to the workspace directory
- `-f, --format <format>` - Output format: `text` or `json`

Examples:
```bash
dataspec list                    # Show summary of all resources
dataspec list sources           # List all sources
dataspec list datasets          # List all datasets
```

### `dataspec show`

Show detailed information about a specific resource.

```bash
dataspec show <resource> <name> [options]
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
dataspec show dataset users_raw
dataspec show flow orders_etl_pipeline --deps
dataspec show contract user_contract --format json
```

## Workspace Structure

A DataSpec workspace follows this structure with all resources inside the `dataspec/` folder:

```
my-platform/
└── dataspec/                # Container folder for all dataspec resources
    ├── platform.yaml        # Platform configuration
    ├── sources/             # Data sources
    │   └── production_db.yaml
    ├── datasets/            # Dataset definitions
    │   ├── users_raw.yaml
    │   ├── users_refined.yaml
    │   └── users_analytics.yaml
    ├── contracts/           # Data contracts
    │   ├── user_contract.yaml
    │   └── order_contract.yaml
    └── flows/               # Data pipelines
        └── users_etl.yaml
```

**Important**: All resources must be inside the `dataspec/` folder. The CLI will report an error if resources are found outside this folder.

## Validation

The CLI performs comprehensive validation:

### Workspace Structure
- Validates that `dataspec/` folder exists
- Detects legacy structure (resources at root level) and reports errors
- Provides clear migration guidance for existing projects

### Graph Integrity
- Identifies orphaned datasets (not produced or consumed)
- Detects cycles in the dataset and flow graph
- Warns about incomplete pipelines (e.g., missing sinks or unreachable outputs)

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
- name: Validate DataSpec workspace
  run: |
    npm install -g @dataspec/dataspec-cli
    dataspec validate --path ./data-platform
```

Exit codes enable pipeline control:
- Exit code 1 on validation failures
- JSON output for programmatic processing

## Migration for Existing Projects

If you have an existing DataSpec project with resources at the root level, migrate to the new structure:

1. Create the `dataspec/` folder:
   ```bash
   mkdir dataspec
   ```

2. Move all resources into `dataspec/`:
   ```bash
   mv platform.yaml dataspec/
   mv sources datasets contracts flows dataspec/
   ```

3. Validate the new structure:
   ```bash
   dataspec validate
   ```

## License

MIT
