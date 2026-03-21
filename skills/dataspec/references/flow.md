# Flow Definitions

Flows define data pipelines — ordered sequences of steps that extract data from sources, transform it, and load it into datasets. Each step produces named outputs that subsequent steps consume as inputs.

## Structure

```yaml
name: <string>              # Flow identifier
steps:                      # Ordered array of pipeline steps (required)
  - type: <step-type>       # extract | transform | load
    # ... step-specific fields (see below)
metadata:                   # Optional metadata
  description: <string>
  version: <semver>
  labels: [<string>, ...]
  definedAt: <string>       # File path where this flow is defined
```

## Step Types

### extract

Reads data from a source entity. This is typically the first step in a pipeline.

```yaml
- type: extract
  source: <string>          # Source name (must exist in sources/)
  entity: <string>          # Entity name within the source
  output: <string>          # Variable name for downstream steps
```

**Example:**
```yaml
- type: extract
  source: production_db
  entity: users
  output: raw_users
```

### transform

Applies transformations to data using an analytics engine. Can consume multiple inputs.

```yaml
- type: transform
  inputs:                   # Array of variable names from previous steps
    - <string>
  engine: <string>          # Engine name (must exist in platform engines)
  output: <string>          # Variable name for downstream steps
```

**Example:**
```yaml
- type: transform
  inputs:
    - raw_users
  engine: dbt-transforms
  output: refined_users
```

### load

Writes data to a target dataset. This is typically the final step in a sub-pipeline.

```yaml
- type: load
  input: <string>           # Variable name from a previous step
  target: <string>          # Dataset name (must exist in datasets/)
```

**Example:**
```yaml
- type: load
  input: refined_users
  target: users_refined
```

## How Steps Connect

Steps communicate through named variables:

1. An `extract` or `transform` step defines an `output` variable name
2. A subsequent `transform` or `load` step references that name in `inputs` or `input`
3. The variable names are logical — they don't need to match file or table names

```
extract → output: "raw_users"
              ↓
transform → inputs: ["raw_users"] → output: "refined_users"
              ↓
load → input: "refined_users" → target: "users_refined"
```

## Complete Example

A typical ETL pipeline extracts from a source, loads to raw, transforms to refined, and loads to analytics:

```yaml
name: user_etl_pipeline
steps:
  # Extract from source
  - type: extract
    source: production_db
    entity: users
    output: raw_users

  # Load to raw layer (as-is)
  - type: load
    input: raw_users
    target: users_raw

  # Transform for refined layer
  - type: transform
    inputs:
      - raw_users
    engine: dbt-transforms
    output: refined_users

  # Load to refined layer
  - type: load
    input: refined_users
    target: users_refined

  # Transform for analytics
  - type: transform
    inputs:
      - refined_users
    engine: dbt-transforms
    output: customer_metrics

  # Load to serving layer
  - type: load
    input: customer_metrics
    target: customer_analytics

metadata:
  description: Complete ETL pipeline for user data
  version: '1.0.0'
  labels:
    - etl
    - users
```

## Multi-Source Example

Flows can extract from multiple sources and join them in transforms:

```yaml
name: orders_etl_pipeline
steps:
  - type: extract
    source: production_db
    entity: orders
    output: raw_orders

  - type: extract
    source: production_db
    entity: order_items
    output: raw_order_items

  - type: extract
    source: production_db
    entity: users
    output: raw_users_for_orders

  # Join multiple inputs in transform
  - type: transform
    inputs:
      - raw_orders
      - raw_users_for_orders
    engine: dbt-transforms
    output: refined_orders

  - type: load
    input: refined_orders
    target: orders_refined
```

## Naming Conventions

| Step type | Output variable pattern | Example |
|-----------|------------------------|---------|
| extract | `raw_<entity>` | `raw_users`, `raw_orders` |
| transform (raw→refined) | `refined_<entity>` | `refined_users` |
| transform (→analytics) | `<entity>_metrics`, `<entity>_analytics` | `customer_metrics` |

## Validation Rules

- `name` and `steps` are required
- `steps` must have at least one entry
- Each step must have a `type` (extract, transform, or load)
- **extract**: `source`, `entity`, and `output` are required. `source` must reference an existing source. `entity` must exist in that source.
- **transform**: `inputs`, `engine`, and `output` are required. `engine` must reference an existing platform engine. All `inputs` must be defined as outputs of previous steps.
- **load**: `input` and `target` are required. `input` must be defined by a previous step. `target` must reference an existing dataset.
- No cycles allowed in the step dependency graph
- All output variable names within a flow must be unique
