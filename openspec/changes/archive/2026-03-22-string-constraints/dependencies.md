## Dependency Matrix

| Task ID | Depends On         | Type | Reason                                                                      |
| ------- | ------------------ | ---- | --------------------------------------------------------------------------- |
| 1.1     | —                  | —    | Foundation — type interface must exist before parser/validation             |
| 2.1     | 1.1                | FS   | Parser needs FieldConstraints type with new properties                      |
| 2.2     | 1.1                | FS   | Parser needs FieldConstraints type with new properties                      |
| 2.3     | 2.1, 2.2           | FS   | Cross-constraint validation requires both min_length and max_length parsing |
| 2.4     | 1.1                | FS   | Parser needs FieldConstraints type with new properties                      |
| 2.5     | 1.1                | FS   | Parser needs FieldConstraints type with new properties                      |
| 3.1     | 1.1                | FS   | Schema must align with type definition                                      |
| 3.2     | 1.1                | FS   | Schema must align with type definition                                      |
| 3.3     | 1.1                | FS   | Schema must align with type definition                                      |
| 3.4     | 1.1                | FS   | Schema must align with type definition                                      |
| 4.1     | —                  | —    | Independent — touches different file section                                |
| 4.2     | 1.1                | FS   | Needs constraints to exist for detection logic                              |
| 4.3     | 1.1                | FS   | Needs constraints to exist for detection logic                              |
| 4.4     | 1.1                | FS   | Needs constraints to exist for detection logic                              |
| 4.5     | 1.1                | FS   | Needs constraints to exist for detection logic                              |
| 5.1     | 2.1                | FS   | Tests require parser implementation                                         |
| 5.2     | 2.1                | FS   | Tests require parser implementation                                         |
| 5.3     | 2.1                | FS   | Tests require parser implementation                                         |
| 5.4     | 2.2                | FS   | Tests require parser implementation                                         |
| 5.5     | 2.2                | FS   | Tests require parser implementation                                         |
| 5.6     | 2.3                | FS   | Tests require cross-constraint validation                                   |
| 5.7     | 2.4                | FS   | Tests require parser implementation                                         |
| 5.8     | 2.4                | FS   | Tests require parser implementation                                         |
| 5.9     | 2.5                | FS   | Tests require parser implementation                                         |
| 5.10    | 2.5                | FS   | Tests require parser implementation                                         |
| 5.11    | 2.5                | FS   | Tests require parser implementation                                         |
| 5.12    | 2.1, 2.2, 2.4, 2.5 | FS   | Integration test requires all constraints                                   |
| 6.1     | 1.1, 2.1–2.5       | FS   | Lint/format after all code changes                                          |
| 6.2     | 1.1, 2.1–2.5       | FS   | Build verification after all code changes                                   |
| 6.3     | 2.1–2.5, 5.1–5.12  | FS   | End-to-end validation after implementation and tests                        |

## Critical Path

```
1.1 → 2.1 → 5.1 → 6.3
```

The critical path is the longest dependency chain: type definition → min_length parser → tests → validation. However, since 2.1–2.5 and 5.1–5.12 can partially parallelize, the effective critical path is:

```
1.1 → 2.3 (cross-constraint, depends on 2.1+2.2) → 5.6 → 6.3
```

## Parallel Execution Waves

### Wave 1 (no dependencies)

- **1.1** — Add properties to FieldConstraints interface

### Wave 2 (depends only on Wave 1)

- **2.1** — min_length parsing
- **2.2** — max_length parsing
- **2.4** — format parsing
- **2.5** — pattern parsing
- **3.1** — min_length schema
- **3.2** — max_length schema
- **3.3** — format schema
- **3.4** — pattern schema
- **4.1** — Remove format dead code in detectTypeNarrowing
- **4.2** — Activate max_length in detectTypeNarrowing
- **4.3** — Activate pattern in detectTypeNarrowing
- **4.4** — Add min_length tightening detection
- **4.5** — Add max_length tightening detection

### Wave 3 (depends on Wave 2)

- **2.3** — Cross-constraint min_length <= max_length validation
- **5.1** — min_length valid tests
- **5.2** — min_length type rejection tests
- **5.3** — min_length value validation tests
- **5.4** — max_length valid tests
- **5.5** — max_length type/value rejection tests
- **5.7** — format valid tests
- **5.8** — format type rejection tests
- **5.9** — pattern valid tests
- **5.10** — pattern type rejection tests
- **5.11** — pattern invalid regex tests

### Wave 4 (depends on Wave 3)

- **5.6** — min_length > max_length rejection test
- **5.12** — All constraints combined test
- **6.1** — Lint and format
- **6.2** — Build verification

### Wave 5 (depends on Wave 4)

- **6.3** — Update ecommerce example

## Float / Slack

| Task ID | Float | Notes                                                                 |
| ------- | ----- | --------------------------------------------------------------------- |
| 3.1–3.4 | High  | JSON schema updates are independent and non-blocking for parser tests |
| 4.1–4.5 | High  | Validator dead code cleanup is independent from parser implementation |
| 6.3     | None  | Must be last — end-to-end validation                                  |

## Text DAG

```
[1.1 FieldConstraints]
  ├──→ [2.1 min_length parse] ──→ [5.1-5.3 min tests]
  ├──→ [2.2 max_length parse] ──→ [5.4-5.5 max tests]
  ├──→ [2.4 format parse]    ──→ [5.7-5.8 format tests]
  ├──→ [2.5 pattern parse]   ──→ [5.9-5.11 pattern tests]
  ├──→ [2.3 cross-constraint]──→ [5.6 cross test]
  ├──→ [3.1-3.4 schema]
  ├──→ [4.1 format dead code]
  ├──→ [4.2-4.5 narrowing/tightening]
  │
  └──→ (all 5.x tests) ──→ [5.12 combined test]
                              ↓
                        [6.1 lint] [6.2 build]
                              ↓
                           [6.3 ecommerce]
```
