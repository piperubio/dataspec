# Workspace Structure

A DataSpec workspace organizes all platform resources in a standard directory structure. The CLI expects all files inside a `dataspec/` folder.

## Directory Layout

```
my-platform/
└── dataspec/                    # All resources go here
    ├── platform.yaml            # Global platform config (exactly one)
    ├── sources/                 # External data producers
    │   ├── production_db.yaml
    │   ├── kafka_stream.yaml
    │   └── salesforce_crm.yaml
    ├── contracts/               # Versioned schema definitions
    │   ├── user_contract.yaml
    │   ├── order_contract.yaml
    │   └── users_raw_schema.yaml
    ├── datasets/                # Logical data units
    │   ├── users_raw.yaml
    │   ├── users_refined.yaml
    │   └── customer_analytics.yaml
    └── flows/                   # ETL pipelines
        ├── user_etl_pipeline.yaml
        └── orders_etl_pipeline.yaml
```

## File Naming Conventions

- **Platform**: Always `platform.yaml` (one per workspace)
- **Sources**: `<source_name>.yaml` — use the source's `name` field value
- **Contracts**: `<contract_name>.yaml` — use the contract's `name` field value
- **Datasets**: `<dataset_name>.yaml` — use the dataset's `name` field value
- **Flows**: `<flow_name>.yaml` — use the flow's `name` field value

Use `snake_case` for file names. The file name should match the resource's `name` field.

## Resource Reference Rules

Resources reference each other by name. All references must resolve to declared resources:

```
Flow extract step ──source──→ Source name
Flow transform step ──engine──→ Platform engine name
Flow load step ──target──→ Dataset name
Source entity ──contract──→ Contract name + version
Dataset ──backend──→ Platform storage name
Dataset ──contract──→ Contract name + version
```

## Naming Conventions

### Resource Names

- Use `snake_case` for all resource names
- Be descriptive: `production_db`, `user_etl_pipeline`, `users_raw_schema`
- Avoid abbreviations unless they're universally understood

### Contract Names

- Raw schemas: `<entity>_raw_schema` (e.g., `users_raw_schema`)
- Refined contracts: `<entity>_contract` (e.g., `user_contract`)
- Analytics contracts: `<dashboard>_contract` (e.g., `sales_dashboard_contract`)

### Dataset Names

- Raw: `<entity>_raw` (e.g., `users_raw`)
- Refined: `<entity>_refined` (e.g., `users_refined`)
- Analytics: `<purpose>_analytics` or `<purpose>_dashboard` (e.g., `customer_analytics`)

### Flow Names

- Use `<entity>_etl_pipeline` or `<purpose>_pipeline` (e.g., `user_etl_pipeline`, `unified_analytics_pipeline`)

## Metadata Conventions

Every resource can include a `metadata` block. Common fields:

```yaml
metadata:
  description: <string> # What this resource is for
  owner: <string> # Team responsible
  tags: [<string>, ...] # For filtering and categorization
  # Type-specific fields:
  pii: <boolean> # Contracts: contains PII
  refresh_frequency: <string> # Datasets: hourly, daily, realtime
  retention_days: <number> # Datasets: data retention period
  sla: <string> # Sources: availability guarantee
  labels: [<string>, ...] # Flows: pipeline categorization
  definedAt: <string> # Flows: source file path
```

## Initialization

Create a new workspace with the CLI:

```bash
# Basic project
dataspec init --name my-platform

# With example resources
dataspec init --name my-platform --with-examples

# At a specific path
dataspec init --name my-platform --path ./projects/
```

This creates the standard directory structure with empty folders and a `platform.yaml` template.

## Validation

Validate the entire workspace:

```bash
dataspec validate                          # Current directory
dataspec validate --path ./my-platform     # Specific path
dataspec validate --format json            # JSON output for CI/CD
```

The validator checks:

- Workspace structure (dataspec/ folder exists)
- All cross-references resolve
- No orphaned resources
- No cycles in flow graphs
- Contract field types are valid
- Step type coherence (extract→source, transform→engine, load→dataset)
