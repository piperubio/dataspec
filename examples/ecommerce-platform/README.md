# E-commerce Data Platform Example

A comprehensive example demonstrating the DataSpec (Declarative Platform Architecture Components) specification for a modern e-commerce data platform.

## Overview

This example showcases a complete data platform architecture for a global e-commerce company, demonstrating best practices for:

- **Data Contracts**: Schema validation and data quality enforcement
- **ETL Pipelines**: Extract, Transform, Load workflows
- **Multi-source Integration**: Production DB, APIs, Analytics DB, External services

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SOURCES (Data Origins)                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  production_db  │  payment_api  │  analytics_db │ external    │ external     │
│  (PostgreSQL)   │  (REST API)   │ (ClickHouse)  │  APIs       │ S3 Bucket    │
│                 │               │               │             │(CSV, JSON,   │
│                 │               │               │             │ Parquet)     │
└────────┬────────┴───────┬───────┴───────┬───────┴─────┬───────┴──────────────┘
         │                │               │             │
         ▼                ▼               ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATASETS                               │
├─────────────────────────────────────────────────────────────┤
│  users_raw │ orders_raw │ products_raw │ events_raw │ etc.  │
│  (Parquet) │ (Parquet)  │  (Parquet)   │ (Parquet)  │       │
│            │            │              │            │       │
│  users_refined  │ orders_refined  │ products_refined       │
│    (Delta)      │    (Delta)      │     (Delta)            │
│                 │                 │                        │
│  customer_analytics  │ sales_dashboard  │ product_analytics │
│    (ClickHouse)      │  (ClickHouse)    │   (ClickHouse)    │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
examples/ecommerce-platform/
└── dataspec/                   # Container folder for all dataspec resources
    ├── platform.yaml           # Platform configuration (storage, engines)
    ├── sources/                # Data source definitions
    │   ├── production_db.yaml  # PostgreSQL production database
    │   ├── payment_api.yaml    # Payment processor API
    │   ├── analytics_db.yaml   # ClickHouse analytics database
    │   ├── external_apis.yaml # Third-party integrations
    │   └── external_s3_bucket.yaml # External S3 bucket (file-based source)
    ├── contracts/              # Data contracts
    │   ├── users_raw_schema.yaml
    │   ├── orders_raw_schema.yaml
    │   ├── products_raw_schema.yaml
    │   ├── order_items_raw_schema.yaml
    │   ├── payments_raw_schema.yaml
    │   ├── events_raw_schema.yaml
    │   ├── user_contract.yaml
    │   ├── order_contract.yaml
    │   ├── product_contract.yaml
    │   ├── order_item_contract.yaml
    │   ├── analytics_events_contract.yaml
    │   ├── customer_analytics_contract.yaml
    │   ├── sales_dashboard_contract.yaml
    │   └── product_analytics_contract.yaml
    ├── datasets/               # Dataset definitions
    │   ├── users_raw.yaml
    │   ├── orders_raw.yaml
    │   ├── products_raw.yaml
    │   ├── events_raw.yaml
    │   ├── payments_raw.yaml
    │   ├── marketing_campaigns_raw.yaml
    │   ├── order_items_raw.yaml
    │   ├── users_refined.yaml
    │   ├── orders_refined.yaml
    │   ├── products_refined.yaml
    │   ├── order_items_refined.yaml
    │   ├── events_refined.yaml
    │   ├── customer_analytics.yaml
    │   ├── sales_dashboard.yaml
    │   └── product_analytics.yaml
    └── flows/                  # ETL/ELT pipeline definitions
        ├── user_etl_pipeline.yaml          # Traditional ETL
        ├── marketing_elt_pipeline.yaml     # ELT pattern (Extract-Load-Transform)
        ├── marketing_s3_ingestion.yaml     # S3 ingestion pipeline
        ├── orders_etl_pipeline.yaml
        ├── products_etl_pipeline.yaml
        └── unified_analytics_pipeline.yaml
```

## Platform Configuration

### Storage Backends

| Name | Type | Purpose |
|------|------|---------|
| `s3-data-lake` | S3 | Data lake storage |
| `postgresql-warehouse` | PostgreSQL | Traditional warehouse storage |
| `clickhouse-analytics` | ClickHouse | High-performance analytics queries |

### Analytics Engines

| Name | Type | Purpose |
|------|------|---------|
| `dbt-transforms` | dbt | SQL-based transformations |
| `duckdb-local` | DuckDB | Local analytics and testing |
| `spark-cluster` | Spark | Large-scale distributed processing |

## Data Sources

### Production Database
- **Type**: PostgreSQL
- **Entities**: users, orders, order_items, products, categories, inventory, reviews
- **Purpose**: Primary transactional data store
- **Refresh**: Real-time / Hourly

### Payment API
- **Type**: REST API
- **Entities**: transactions, refunds, payment_methods, chargebacks, settlements
- **Purpose**: External payment processor integration
- **Refresh**: Hourly

### Analytics Database
- **Type**: ClickHouse
- **Entities**: events, sessions, experiments, attribution, cohorts
- **Purpose**: High-volume event and behavioral data
- **Refresh**: Real-time streaming

### External APIs
- **Type**: Multiple REST APIs
- **Entities**: shipments, shipping_rates, campaigns, ad_spend, support_tickets
- **Purpose**: Third-party integrations (shipping, marketing, support)
- **Refresh**: Varies by source

## Data Contracts

Contracts define the expected schema and enforce data quality:

| Contract | Fields | Purpose |
|----------|--------|---------|
| `user_contract` | 14 fields | Customer profile data with PII |
| `order_contract` | 16 fields | Order transactions with financial data |
| `product_contract` | 15 fields | Product catalog with pricing |
| `order_item_contract` | 12 fields | Order line items |
| `analytics_events_contract` | 17 fields | Clickstream events |

### Contract Features
- **Type System**: uuid, string, integer, decimal, boolean, timestamp, date, json
- **Constraints**: unique, not_null, foreign key references
- **PII Tagging**: Sensitive data identification

## Datasets

Datasets represent data at various stages of the pipeline:

**Ingested Data**
- **Format**: Parquet, JSON
- **Storage**: S3 Data Lake
- **Purpose**: Exact copy of source data
- **Retention**: 30-90 days
- **Datasets**: users_raw, orders_raw, products_raw, events_raw, payments_raw, marketing_campaigns_raw, order_items_raw

**Processed Data**
- **Format**: Delta Lake
- **Storage**: S3 Data Lake
- **Purpose**: Cleaned, validated, deduplicated data
- **Contracts**: Enforced schema validation
- **Datasets**: users_refined, orders_refined, products_refined, order_items_refined, events_refined

**Analytics Data**
- **Format**: Native (ClickHouse)
- **Storage**: ClickHouse Analytics
- **Purpose**: Aggregated, business-ready data
- **Use Cases**: Dashboards, ML features, reporting
- **Datasets**: customer_analytics, sales_dashboard, product_analytics

## ETL Pipelines

### User ETL Pipeline
```
production_db.users → users_raw → users_refined → customer_analytics
```
- Extracts user data from production
- Applies PII handling and deduplication
- Creates customer metrics for analytics

### Orders ETL Pipeline
```
production_db.orders + order_items + users → orders_raw + order_items_raw → 
orders_refined + order_items_refined → sales_dashboard
```
- Extracts orders and items
- Validates referential integrity
- Aggregates sales metrics

### Products ETL Pipeline
```
production_db.products + categories + inventory → products_raw → 
products_refined → product_analytics
```
- Extracts product catalog
- Enriches with categories and inventory
- Creates product performance metrics

### Unified Analytics Pipeline
```
[production_db + payment_api + analytics_db + external_apis] → 
[Multiple extracts] → [Joins & transformations] → 
[All analytics datasets]
```
- Comprehensive pipeline joining all sources
- Creates unified customer, order, and product views
- Demonstrates complex multi-source ETL

## Step Types

All pipelines use three step types:

### Extract Step
```yaml
type: extract
source: production_db
entity: users
output: raw_users
```

### Transform Step
```yaml
type: transform
inputs:
  - raw_users
engine: dbt-transforms
output: refined_users
```

### Load Step
```yaml
type: load
input: refined_users
target: users_refined
```

## ETL vs ELT Patterns

This example demonstrates both traditional ETL and modern ELT patterns:

### ETL (Extract-Transform-Load)
Transform data **before** loading to the data warehouse.

```
Source → Extract → Transform → Load → Refined Dataset
```

**Use when:**
- Data quality is critical and bad data should not be stored
- Transformations are simple and fast
- Storage is expensive
- Compliance requires filtering PII before storage

**Example:** `user_etl_pipeline.yaml`

### ELT (Extract-Load-Transform)
Load data **as-is**, then transform.

```
Source → Extract → Load → Transform → Load (Refined)
```

**Use when:**
- Data scientists need access to raw data
- Complex transformations that might fail
- Need to preserve original data for debugging
- Storage is cheap and compute is elastic
- Want to reprocess data with new logic

**Example:** `marketing_elt_pipeline.yaml`

### Comparison

| Aspect | ETL | ELT |
|--------|-----|-----|
| Raw Data Available | ❌ No | ✅ Yes |
| Debugging Failed Transforms | Hard | Easy |
| Reprocessing Capability | Limited | Full |
| Storage Cost | Lower | Higher |
| Data Freshness | Delayed | Immediate |
| Schema Evolution | Rigid | Flexible |

## Best Practices Demonstrated

1. **Data Contracts**: Schema enforcement through contracts
2. **Incremental Processing**: Hourly refresh cycles for most datasets
3. **PII Handling**: Proper tagging and handling of sensitive data
4. **High-Volume Handling**: Separate handling for event streams
5. **Multi-Engine Support**: dbt for SQL, Spark for large-scale joins
6. **External Integration**: Clean separation of external APIs
7. **Metadata Richness**: Comprehensive ownership, tags, and descriptions

## Usage

This example can be used to:

1. **Understand DataSpec**: Learn the structure and concepts
2. **Validate Parsers**: Test YAML parsing implementations
3. **Create Templates**: Use as a starting point for new platforms
4. **Document Architecture**: Reference for data platform design

## Notes

- **No Connection Strings**: This is a definitions-only specification
- **No Credentials**: Security handled at deployment time
- **Placeholders**: Connection strings use placeholder values
- **Extensible**: Easy to add new sources, contracts, datasets, or flows
