# Dependency Analysis — `dataspec-docs`

## 1. Dependency Matrix

| Task ID | Depends On    | Type | Reason                                                                     |
| ------- | ------------- | ---- | -------------------------------------------------------------------------- |
| 1.1     | —             | —    | No dependencies; first task in types.ts                                    |
| 1.2     | 1.1           | FS   | Same file (types.ts); config types extend base interfaces                  |
| 2.1     | 1.2           | FS   | Imports types defined in 1.1/1.2; separate file (mermaid.ts)               |
| 2.2     | 2.1           | FS   | Same file (mermaid.ts); CSS classes applied to nodes built by 2.1          |
| 2.3     | 2.1           | FS   | Same file (mermaid.ts); splitting logic extends builder from 2.1           |
| 2.4     | 2.2, 2.3      | FS   | Tests require all mermaid.ts implementations complete                      |
| 3.1     | 1.2, 2.3      | FS   | Imports types; lineage subgraph requires mermaid builder (2.1+); same file |
| 3.2     | 3.1           | FS   | Same file (renderers.ts); sequential write                                 |
| 3.3     | 3.2           | FS   | Same file (renderers.ts); sequential write                                 |
| 3.4     | 3.3           | FS   | Same file (renderers.ts); sequential write                                 |
| 3.5     | 3.4, 2.3      | FS   | Same file (renderers.ts); cross-linked pages depend on diagram splitting   |
| 3.6     | 3.5           | FS   | Tests require all renderer implementations complete                        |
| 4.1     | 3.5, 1.2      | FS   | Orchestrator imports renderers and types; separate file (generator.ts)     |
| 4.2     | 4.1           | FS   | Same file (generator.ts); file writer called by orchestrator               |
| 4.3     | 4.2           | FS   | Same file (generator.ts); --check mode extends file writer                 |
| 4.4     | 4.3, 2.4, 3.6 | FS   | Integration test needs all implementation + unit tests passing             |
| 5.1     | 4.3           | FS   | Docs command calls generator; separate file (docs.ts)                      |
| 5.2     | 5.1           | FS   | Same file (docs.ts); option wiring extends command scaffold                |
| 5.3     | 5.2           | FS   | Registration after command is complete; touches cli.ts + commands/index.ts |
| 5.4     | 5.3           | FS   | Tests require docs command registered                                      |
| 6.1     | 2.3           | FS   | Larger workspace triggers diagram splitting feature from 2.3               |
| 6.2     | 5.3           | FS   | Build requires CLI command registered                                      |
| 6.3     | 6.2           | FS   | Lint/format runs after build verification                                  |
| 6.4     | 6.3, 4.4, 5.4 | FS   | E2E test requires build passing + all unit/integration tests green         |

## 2. Critical Path

The longest chain of dependent tasks determines minimum project duration:

```
1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 4.1 → 4.2 → 4.3 → 5.1 → 5.2 → 5.3 → 5.4 → 6.4
```

**Length: 18 tasks**

The path flows: Types → Mermaid builder → Mermaid CSS → Mermaid splitting → Renderers → Orchestrator → File writer → Check mode → Docs CLI → Registration → Tests → E2E.

## 3. Parallel Execution Waves

| Wave | Tasks                   | Count | Gate   |
| ---- | ----------------------- | ----- | ------ |
| 1    | 1.1, 2.1, 3.1, 4.1, 5.1 | 5     | None   |
| 2    | 1.2, 2.2, 3.2, 4.2, 5.2 | 5     | Wave 1 |
| 3    | 2.3, 3.3, 4.3, 5.3      | 4     | Wave 2 |
| 4    | 2.4, 3.4                | 2     | Wave 3 |
| 5    | 3.5                     | 1     | Wave 4 |
| 6    | 3.6, 4.4                | 2     | Wave 5 |
| 7    | 5.4, 6.1, 6.2           | 3     | Wave 6 |
| 8    | 6.3                     | 1     | Wave 7 |
| 9    | 6.4                     | 1     | Wave 8 |

## 4. Float / Slack

| Task ID | Float (waves) | Reason                                 |
| ------- | ------------- | -------------------------------------- |
| 2.1     | 0             | On critical path                       |
| 2.4     | 4             | Test task; critical path hits 2.2→2.3  |
| 4.1     | 0             | On critical path                       |
| 4.4     | 2             | Integration test; not on longest chain |
| 6.1     | 6             | Independent workspace update           |
| 6.2     | 1             | Build check; close to critical path    |
| 6.3     | 0             | On critical path (leads to E2E)        |

## 5. Text DAG

```
Wave 1    Wave 2    Wave 3    Wave 4    Wave 5    Wave 6    Wave 7    Wave 8    Wave 9
──────    ──────    ──────    ──────    ──────    ──────    ──────    ──────    ──────

1.1 ─────→ 1.2 ──┐
                  ├──→ 2.1 ─────→ 2.2 ─────→ 2.3 ──┬─────────────────────
                  │                                  │
                  │                             ┌────┘
                  │                             ▼
                  │                     ┌──→ 3.1 ─────→ 3.2 ─────→ 3.3 ──┐
                  │                     │                                 │
                  │                     │                            3.4 ←┘
                  │                     │                             │
                  │                     │                        3.5 ←─┘
                  │                     │                             │
                  │                     ▼                             │
                  │             ┌──→ 4.1 ─────→ 4.2 ─────→ 4.3 ──┐    │
                  │             │                                  │    │
                  │             │    5.1 ←─────────────────────────┘    │
                  │             │     │                                 │
                  │             │    5.2 ─────→ 5.3 ─────→ 5.4 ──┐      │
                  │             │                             │    │    │
                  │             │    4.4 ◄──── 2.4 + 3.6     │    │    │
                  │             │      │                      │    │    │
                  └─────────────┴──────┴──────────────────────┘    │    │
                                                                 6.2 ◄──┘
                                                                   │
                                                              6.3 ──┐
                                                                    │
                                                               6.4 ◄─┘

6.1 ──────→ (independent, creates large workspace)

[END]
```

**Critical path**: 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 4.1 → 4.2 → 4.3 → 5.1 → 5.2 → 5.3 → 5.4 → 6.4
