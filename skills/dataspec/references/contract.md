# Contract Definitions

Contracts define versioned schemas for data entities. They specify field names, data types, and constraints. Contracts follow a contract-first approach — define schemas before referencing them from sources or datasets.

## Structure

```yaml
name: <string> # Contract identifier
version: <semver> # Semantic version (e.g., "1.0.0")
fields: # Array of field definitions (required)
  - name: <string> # Field name (camelCase)
    type: <data-type> # One of the supported types
    constraints: # Optional validation rules
      unique: <boolean>
      not_null: <boolean>
      ref: <string> # Foreign key: "ContractName.fieldName"
      allowed_values: [<string>, ...] # Enum-like restriction (string fields only)
      precision: <number> # Total digits, decimal only
      scale: <number> # Decimal places, decimal only, must be ≤ precision
      min: <number> # Inclusive minimum, integer + decimal
      max: <number> # Inclusive maximum, integer + decimal
    description: <string> # What this field contains
metadata: # Optional metadata
  description: <string>
  owner: <string>
  pii: <boolean> # Whether this contract contains PII
  tags: [<string>, ...]
```

## Supported Data Types

| Type        | Description                   | Example values                         |
| ----------- | ----------------------------- | -------------------------------------- |
| `uuid`      | Universally unique identifier | `550e8400-e29b-41d4-a716-446655440000` |
| `string`    | Text data                     | `"hello"`, `"user@example.com"`        |
| `integer`   | Whole numbers                 | `42`, `-1`, `0`                        |
| `decimal`   | Floating-point numbers        | `19.99`, `3.14159`                     |
| `boolean`   | True/false values             | `true`, `false`                        |
| `timestamp` | ISO 8601 datetime             | `2024-01-15T10:30:00Z`                 |
| `date`      | ISO 8601 date                 | `2024-01-15`                           |
| `json`      | Arbitrary JSON object         | `{"key": "value"}`                     |

## Field Constraints

### unique

The field value must be unique across all records in the dataset.

```yaml
- name: user_id
  type: uuid
  constraints:
    unique: true
```

### not_null

The field value cannot be null. Use for required/mandatory fields.

```yaml
- name: email
  type: string
  constraints:
    not_null: true
```

### ref

Foreign key reference to another contract's field. Format: `"ContractName.fieldName"`.

```yaml
- name: order_id
  type: uuid
  constraints:
    not_null: true
    ref: 'order_contract.order_id'
```

### allowed_values

Restricts a string field to a specific set of permitted values. Only valid for `type: string` fields.

```yaml
- name: status
  type: string
  constraints:
    allowed_values:
      - pending
      - processing
      - shipped
      - delivered
      - cancelled
```

**Notes:**

- Only applicable to `type: string` fields
- Empty array is valid (no values permitted)
- Duplicate values are allowed (no uniqueness enforcement)

### precision

Total number of digits for a decimal field. Only valid for `type: decimal`. Must be a positive integer. Must be specified together with `scale`.

```yaml
- name: price
  type: decimal
  constraints:
    precision: 10
    scale: 2
```

**Notes:**

- Only applicable to `type: decimal` fields
- Must be a positive integer (> 0)
- Must be specified together with `scale`

### scale

Number of decimal places for a decimal field. Only valid for `type: decimal`. Must be a non-negative integer and less than or equal to `precision`.

```yaml
- name: price
  type: decimal
  constraints:
    precision: 10
    scale: 2
```

**Notes:**

- Only applicable to `type: decimal` fields
- Must be a non-negative integer (>= 0)
- Must be ≤ `precision`
- Must be specified together with `precision`

### min

Inclusive minimum value for a numeric field. Valid for `type: integer` and `type: decimal`. Must be a finite number.

```yaml
- name: quantity
  type: integer
  constraints:
    min: 0

- name: price
  type: decimal
  constraints:
    min: 0.01
    max: 999999.99
```

**Notes:**

- Only applicable to `type: integer` and `type: decimal` fields
- Must be a finite number (not NaN or Infinity)
- Inclusive bound (value >= min)
- When both `min` and `max` are specified, `min` must be ≤ `max`

### max

Inclusive maximum value for a numeric field. Valid for `type: integer` and `type: decimal`. Must be a finite number.

```yaml
- name: quantity
  type: integer
  constraints:
    min: 0
    max: 1000
```

**Notes:**

- Only applicable to `type: integer` and `type: decimal` fields
- Must be a finite number (not NaN or Infinity)
- Inclusive bound (value <= max)
- When both `min` and `max` are specified, `min` must be ≤ `max`

## Example

```yaml
name: user_contract
version: '1.0.0'
fields:
  - name: user_id
    type: uuid
    constraints:
      unique: true
      not_null: true
    description: Unique identifier for the user

  - name: email
    type: string
    constraints:
      unique: true
      not_null: true
    description: User email address

  - name: first_name
    type: string
    description: User first name

  - name: created_at
    type: timestamp
    constraints:
      not_null: true
    description: Account creation timestamp

  - name: preferences
    type: json
    description: User preferences stored as JSON

  - name: marketing_consent
    type: boolean
    description: User consent for marketing communications

metadata:
  description: Schema contract for user/customer data - PII sensitive
  owner: data-platform-team
  pii: true
  tags:
    - pii
    - customers
    - core
```

## Versioning Rules

- Use semantic versioning: `major.minor.patch`
- **Patch** (e.g., `1.0.0` → `1.0.1`): Documentation changes, non-breaking metadata updates
- **Minor** (e.g., `1.0.0` → `1.1.0`): Adding new optional fields
- **Major** (e.g., `1.0.0` → `2.0.0`): Removing fields, changing types, adding required constraints
- Breaking changes always require a new major version

## Validation Rules

- `name` and `version` are required
- `fields` array must have at least one entry
- Each field must have a `name` and `type`
- `type` must be one of: `uuid`, `string`, `integer`, `decimal`, `boolean`, `timestamp`, `date`, `json`
- `version` must be valid semver
- `constraints.ref` must reference an existing contract field
- `constraints.unique` on `json` type is not supported (warning)
- `constraints.allowed_values` is only valid for `type: string` fields
- `constraints.precision` and `constraints.scale` are only valid for `type: decimal` fields
- `constraints.precision` and `constraints.scale` must be positive integers
- `constraints.precision` and `constraints.scale` must be specified together (or neither)
- `constraints.scale` must be ≤ `constraints.precision`
- `constraints.min` and `constraints.max` are only valid for `type: integer` and `type: decimal` fields
- `constraints.min` and `constraints.max` must be finite numbers
- When both `constraints.min` and `constraints.max` are specified, min must be ≤ max
