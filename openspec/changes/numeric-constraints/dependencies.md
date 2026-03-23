## Dependency Matrix

| Task ID | Depends On | Type | Reason                                                                    |
| ------- | ---------- | ---- | ------------------------------------------------------------------------- |
| 1.1     | —          | —    | Serialization point: defines the FieldConstraints contract                |
| 1.2     | 1.1        | FS   | JSON schema must reflect the same fields as the TypeScript interface      |
| 2.1     | 1.1        | FS   | Parser needs FieldConstraints to have precision/scale defined             |
| 2.2     | 2.1        | FS   | Type validation needs parsing logic first                                 |
| 2.3     | 2.1        | FS   | Co-presence validation needs parsing logic first                          |
| 2.4     | 2.1        | FS   | Value validation needs parsing logic first                                |
| 2.5     | 2.1, 2.4   | FS   | Scale ≤ precision check needs both fields parsed and validated as numbers |
| 3.1     | 1.1        | FS   | Parser needs FieldConstraints to have min/max defined                     |
| 3.2     | 3.1        | FS   | Type validation needs parsing logic first                                 |
| 3.3     | 3.1        | FS   | Finiteness check needs parsing logic first                                |
| 3.4     | 3.1, 3.3   | FS   | Min ≤ max check needs both fields parsed and validated as numbers         |
| 4.1     | 1.1        | FS   | detectTypeNarrowing references precision/scale on FieldConstraints        |
| 4.2     | 1.1        | FS   | detectConstraintTightening references min/max on FieldConstraints         |
| 4.3     | 1.1        | FS   | detectConstraintTightening references precision/scale on FieldConstraints |
| 4.4     | 1.1        | FS   | validateContractConsistency checks precision/scale on FieldConstraints    |
| 4.5     | 1.1        | FS   | validateContractConsistency checks min/max on FieldConstraints            |
| 5.1     | 2.5        | FS   | Test valid precision/scale needs parser implementation complete           |
| 5.2     | 2.2        | FS   | Test precision/scale on wrong type needs type validation                  |
| 5.3     | 2.5        | FS   | Test scale > precision needs semantic validation                          |
| 5.4     | 2.3        | FS   | Test co-presence needs that validation logic                              |
| 5.5     | 2.4        | FS   | Test non-positive values needs value validation                           |
| 5.6     | 3.4        | FS   | Test valid min/max needs parser implementation complete                   |
| 5.7     | 3.2        | FS   | Test min/max on wrong type needs type validation                          |
| 5.8     | 3.4        | FS   | Test min > max needs semantic validation                                  |
| 5.9     | 3.3        | FS   | Test non-finite values needs value validation                             |
| 6.1     | 4.1, 4.3   | FS   | Test tightening detection needs implementation                            |
| 6.2     | 4.2        | FS   | Test tightening detection needs implementation                            |
| 6.3     | 4.4        | FS   | Test consistency check needs implementation                               |
| 7.1     | —          | —    | Documentation is independent, can be done anytime                         |
| 7.2     | —          | —    | Documentation is independent, can be done anytime                         |

## Critical Path

```
1.1 → 2.1 → 2.4 → 2.5 → 5.1
```

Task 1.1 (type definition) gates everything. The longest chain runs through the precision/scale parser: define types → parse fields → validate positive integers → validate scale ≤ precision → test. This determines the minimum sequential duration.

## Parallel Execution Waves

### Wave 1 (no dependencies)

- **1.1** — Add fields to FieldConstraints interface

### Wave 2 (depends on Wave 1)

- **1.2** — Update JSON schema (FS: 1.1)
- **2.1** — Parse precision/scale from YAML (FS: 1.1)
- **3.1** — Parse min/max from YAML (FS: 1.1)
- **4.1** — Activate detectTypeNarrowing (FS: 1.1)
- **4.2** — Add min/max tightening detection (FS: 1.1)
- **4.3** — Add precision/scale tightening detection (FS: 1.1)
- **4.4** — Add precision/scale consistency check (FS: 1.1)
- **4.5** — Add min/max consistency check (FS: 1.1)
- **7.1** — Update contract reference docs (independent)
- **7.2** — Update data-contracts spec (independent)

### Wave 3 (depends on Wave 2 parser tasks)

- **2.2** — Validate precision/scale on decimal only (FS: 2.1)
- **2.3** — Validate co-presence (FS: 2.1)
- **2.4** — Validate positive integers (FS: 2.1)
- **3.2** — Validate min/max on numeric only (FS: 3.1)
- **3.3** — Validate finite numbers (FS: 3.1)

### Wave 4 (depends on Wave 3)

- **2.5** — Validate scale ≤ precision (FS: 2.4)
- **3.4** — Validate min ≤ max (FS: 3.3)
- **5.2** — Test precision/scale type rejection (FS: 2.2)
- **5.4** — Test co-presence rejection (FS: 2.3)
- **5.5** — Test non-positive rejection (FS: 2.4)
- **5.7** — Test min/max type rejection (FS: 3.2)
- **5.9** — Test non-finite rejection (FS: 3.3)
- **6.1** — Test type narrowing (FS: 4.1, 4.3)
- **6.2** — Test constraint tightening (FS: 4.2)
- **6.3** — Test consistency validation (FS: 4.4)

### Wave 5 (depends on Wave 4)

- **5.1** — Test valid precision/scale (FS: 2.5)
- **5.3** — Test scale > precision rejection (FS: 2.5)
- **5.6** — Test valid min/max (FS: 3.4)
- **5.8** — Test min > max rejection (FS: 3.4)

## Float / Slack

| Task ID | Float  | Notes                                                       |
| ------- | ------ | ----------------------------------------------------------- |
| 1.2     | 0      | On critical path (schema must be consistent with types)     |
| 7.1     | High   | Documentation can be done last, no code dependency          |
| 7.2     | High   | Documentation can be done last, no code dependency          |
| 4.1–4.5 | 1 wave | Validator changes can wait until after parser is functional |
| 6.1–6.3 | 1 wave | Validator tests can wait until validator code is done       |

## Text DAG

```
                          ┌─────────┐
                          │   1.1   │  ← Serialization point
                          └────┬────┘
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
          ┌─────────┐    ┌─────────┐     ┌─────────┐
          │   1.2   │    │  2.1    │     │  3.1    │
          │  schema │    │ parse   │     │ parse   │
          └─────────┘    │ p/scale │     │ min/max │
                         └────┬────┘     └────┬────┘
                    ┌─────────┼─────────┐     │
                    │         │         │     │
                    ▼         ▼         ▼     ▼
               ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
               │  2.2   │ │  2.3   │ │  2.4   │ │ 3.2/3.3│
               │ type   │ │ co-pres│ │ posint │ │ type/fin│
               │ check  │ │ check  │ │ check  │ │ checks │
               └────┬───┘ └────┬───┘ └───┬────┘ └───┬────┘
                    │          │         │          │
                    │          │    ┌────▼────┐ ┌────▼────┐
                    │          │    │  2.5    │ │  3.4    │
                    │          │    │ scale≤p │ │ min≤max │
                    │          │    └────┬────┘ └────┬────┘
                    │          │         │          │
                    ▼          ▼         ▼          ▼
               ┌────────────────────────────────────────┐
               │              5.x TESTS                 │
               └────────────────────────────────────────┘


    VALIDATOR (parallel lane):
    ┌─────────┐
    │   1.1   │ ──→ 4.1, 4.2, 4.3, 4.4, 4.5 ──→ 6.x TESTS
    └─────────┘


    DOCS (independent):
    ┌─────────┐    ┌─────────┐
    │   7.1   │    │   7.2   │
    └─────────┘    └─────────┘
```
