## Dependency Matrix

| Task ID | Depends On              | Type | Reason                                                                  |
| ------- | ----------------------- | ---- | ----------------------------------------------------------------------- |
| 1.1     | —                       | —    | No dependencies; initial setup                                          |
| 1.2     | 1.1                     | FS   | Lockfile update requires package.json change                            |
| 2.1     | 1.1                     | FS   | Needs AJV installed before importing it                                 |
| 2.2     | 2.1                     | FS   | Same file; implements function on top of AJV setup                      |
| 2.3     | 2.1                     | FS   | Needs AJV instance to verify schema compatibility                       |
| 3.1     | 2.2                     | FS   | Needs validateAgainstSchema function to exist                           |
| 3.2     | 2.2                     | FS   | Needs validateAgainstSchema function to exist                           |
| 3.3     | 3.2                     | FS   | Must have validation step in validator.ts before adding error reporting |
| 4.1     | 2.2                     | FS   | Needs validateAgainstSchema function to exist                           |
| 4.2     | 2.2                     | FS   | Needs validateAgainstSchema function to exist                           |
| 4.3     | 2.2                     | FS   | Needs validateAgainstSchema function to exist                           |
| 4.4     | 2.2                     | FS   | Needs validateAgainstSchema function to exist                           |
| 4.5     | 2.2                     | FS   | Needs validateAgainstSchema function to exist                           |
| 4.6     | 4.1, 4.2, 4.3, 4.4, 4.5 | FS   | Must have schema validation in place before removing manual checks      |
| 5.1     | 2.2                     | FS   | Tests need the validation utility to exist                              |
| 5.2     | 5.1                     | FS   | Same test file; builds on initial test structure                        |
| 5.3     | 5.1                     | FS   | Same test file                                                          |
| 5.4     | 5.1                     | FS   | Same test file                                                          |
| 6.1     | 4.1, 4.2                | FS   | Integration tests need parsers to have schema validation wired in       |
| 6.2     | 3.2                     | FS   | Test needs validator.ts integration to exist                            |
| 6.3     | 3.3                     | FS   | Test needs error reporting to be wired into validation report           |
| 7.1     | 6.1, 6.2, 6.3           | FS   | Lint/format runs after all code changes                                 |
| 7.2     | 7.1                     | FS   | Tests run after lint passes                                             |
| 7.3     | 7.2                     | FS   | CI verification is final step                                           |

## Critical Path

```
1.1 → 2.1 → 2.2 → 4.1 → 4.6 → 6.1 → 7.1 → 7.2 → 7.3
```

This is the longest chain: setup → core utility → one parser integration → remove redundant checks → integration tests → lint → test → CI.

## Parallel Execution Waves

### Wave 1 (no dependencies)

- **1.1** Add ajv dependency to package.json

### Wave 2 (depends only on Wave 1)

- **1.2** Run bun install to update lockfile
- **2.1** Create schema-validator.ts with AJV setup and compiled validators

### Wave 3 (depends on Wave 2 — core utility exists)

- **2.2** Implement validateAgainstSchema function
- **2.3** Verify schema imports from dataspec-core

### Wave 4 (depends on Wave 3 — utility API complete)

- **3.1** Wire validation into workspace.ts
- **3.2** Wire validation into validator.ts
- **4.1** Add validation to contract parser
- **4.2** Add validation to source parser
- **4.3** Add validation to platform parser
- **4.4** Add validation to dataset parser
- **4.5** Add validation to flow parser
- **5.1** Create unit test file structure

### Wave 5 (depends on Wave 4)

- **3.3** Add schema errors to validation report (depends on 3.2)
- **4.6** Remove redundant manual checks (depends on 4.1-4.5)
- **5.2** Add invalid data error tests (depends on 5.1)
- **5.3** Add all resource type tests (depends on 5.1)
- **5.4** Add multiple errors tests (depends on 5.1)
- **6.2** Add validator.ts integration test (depends on 3.2)

### Wave 6 (depends on Wave 5)

- **6.1** Update existing parser tests (depends on 4.1, 4.2)
- **6.3** Verify error path in report (depends on 3.3)

### Wave 7 (final — depends on Wave 6)

- **7.1** Run lint and format
- **7.2** Run full test suite
- **7.3** Verify CI passes

## Float / Slack

| Task ID | Float   | Notes                                                                                 |
| ------- | ------- | ------------------------------------------------------------------------------------- |
| 1.2     | 1 wave  | Can delay 1 wave without blocking others (other tasks use AJV, not lockfile directly) |
| 2.3     | 2 waves | Schema verification can happen anytime after 2.1; not blocking for integration        |
| 3.1     | 2 waves | CLI workspace integration is independent from core parser integration                 |
| 3.2     | 2 waves | Validator integration is independent from core parser integration                     |
| 5.2     | 1 wave  | Test additions can be batched                                                         |
| 5.3     | 1 wave  | Test additions can be batched                                                         |
| 5.4     | 1 wave  | Test additions can be batched                                                         |
| 6.2     | 1 wave  | Integration test can be written after 3.2 or later                                    |
| 6.3     | 1 wave  | Depends on error reporting but can be deferred                                        |

**Zero float (critical path)**: 1.1, 2.1, 2.2, 4.1, 4.6, 6.1, 7.1, 7.2, 7.3

## Text DAG

```
[1.1] ──────────────────────────────────────────→ [7.1] → [7.2] → [7.3]
  │                                                  ↑
  ├──→ [1.2]                                        │
  │                                                  │
  └──→ [2.1] ─→ [2.2] ──┬──→ [3.1]                │
              │          ├──→ [3.2] ─→ [3.3] ───────┤
              │          ├──→ [4.1] ──┐             │
              │          ├──→ [4.2] ──┤             │
              │          ├──→ [4.3] ──┼→ [4.6] ────┤
              │          ├──→ [4.4] ──┤             │
              │          ├──→ [4.5] ──┘             │
              │          ├──→ [5.1] ─→ [5.2]        │
              │          │       ├────→ [5.3]        │
              │          │       └────→ [5.4]        │
              │          └──→ [6.2] ────────────────┤
              └──→ [2.3]                             │
                                                      │
                                             [6.1] ───┘
                                             [6.3] ───┘
```
