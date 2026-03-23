# Dependency Analysis — `dataspec-docs`

## 1. Dependency Matrix

| Task ID | Depends On    | Type | Reason                                                                                                    |
| ------- | ------------- | ---- | --------------------------------------------------------------------------------------------------------- |
| 1.1     | —             | —    | No dependencies; first task in types.ts                                                                   |
| 1.2     | 1.1           | FS   | Same file (types.ts); config types extend base interfaces                                                 |
| 2.1     | 1.2           | FS   | Imports types defined in 1.1/1.2; separate file (mermaid.ts)                                              |
| 2.2     | 2.1           | FS   | Same file (mermaid.ts); CSS classes applied to nodes built by 2.1                                         |
| 2.3     | 2.1           | FS   | Same file (mermaid.ts); splitting logic extends builder from 2.1                                          |
| 2.4     | 2.2, 2.3      | FS   | Tests require all mermaid.ts implementations complete                                                     |
| 3.1     | 1.2, 2.3      | FS   | Imports types; lineage subgraph requires mermaid builder (2.1+); same file (renderers.ts)                 |
| 3.2     | 3.1           | FS   | Same file (renderers.ts); sequential write                                                                |
| 3.3     | 3.2           | FS   | Same file (renderers.ts); sequential write                                                                |
| 3.4     | 3.3           | FS   | Same file (renderers.ts); sequential write                                                                |
| 3.5     | 3.4, 2.3      | FS   | Same file (renderers.ts); cross-linked pages depend on diagram splitting from 2.3                         |
| 3.6     | 3.5           | FS   | Tests require all renderer implementations complete                                                       |
| 4.1     | 3.5, 1.2      | FS   | Orchestrator imports renderers and types; separate file (generator.ts)                                    |
| 4.2     | 4.1           | FS   | Same file (generator.ts); file writer called by orchestrator                                              |
| 4.3     | 4.2           | FS   | Same file (generator.ts); --check mode extends file writer                                                |
| 4.4     | 4.3, 2.4, 3.6 | FS   | Integration test needs all implementation + unit tests passing                                            |
| 5.1     | 4.3           | FS   | Docs command calls generator; separate file (docs.ts)                                                     |
| 5.2     | 5.1           | FS   | Same file (docs.ts); option wiring extends command scaffold                                               |
| 5.3     | 5.2           | FS   | Registration after command is complete; touches cli.ts + commands/index.ts                                |
| 6.1     | 1.2           | FS   | Inspect command uses types; separate file (inspect.ts)                                                    |
| 6.2     | 6.1           | FS   | Same file (inspect.ts); sequential write                                                                  |
| 6.3     | 6.2           | FS   | Same file (inspect.ts); sequential write                                                                  |
| 6.4     | 6.3           | FS   | Same file (inspect.ts); sequential write                                                                  |
| 6.5     | 6.4, 5.3      | FS   | Registration after inspect command complete; **must follow 5.3** (both modify cli.ts + commands/index.ts) |
| 6.6     | 6.5           | FS   | Tests require inspect command registered                                                                  |
| 7.1     | 2.3           | FS   | Larger workspace triggers diagram splitting feature from 2.3                                              |
| 7.2     | 5.3, 6.5      | FS   | Build requires all CLI commands registered                                                                |
| 7.3     | 7.2           | FS   | Lint/format runs after build verification                                                                 |
| 7.4     | 7.3, 4.4, 6.6 | FS   | E2E test requires build passing + all unit/integration tests green                                        |

## 2. Critical Path

The longest chain of dependent tasks determines minimum project duration:

```
1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 4.1 → 4.2 → 4.3 → 5.1 → 5.2 → 5.3 → 6.5 → 6.6 → 7.4
```

**Length: 19 tasks**

The path flows: Types → Mermaid builder → Mermaid CSS → Mermaid splitting → Overview renderer → Catalog renderers → Contract renderer → Lineage renderer → Orchestrator → File writer → Check mode → Docs CLI → Docs options → Docs registration → Inspect registration → Inspect tests → E2E.

Bottleneck: Groups 3 (renderers) and 5 (docs CLI) form the densest sequential chains on the critical path.

## 3. Parallel Execution Waves

Tasks within a wave have no mutual dependencies and can execute simultaneously.

| Wave | Tasks                             | Count | Gate               |
| ---- | --------------------------------- | ----- | ------------------ |
| 1    | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1 | 7     | None               |
| 2    | 1.2, 2.2, 3.2, 4.2, 5.2, 6.2      | 6     | Wave 1             |
| 3    | 2.3, 3.3, 4.3, 5.3, 6.3           | 5     | Wave 2             |
| 4    | 2.4, 3.4, 6.4                     | 3     | Wave 3             |
| 5    | 3.5                               | 1     | Wave 4 + 2.3       |
| 6    | 3.6, 4.4, 6.5                     | 3     | Wave 5             |
| 7    | 6.6, 7.2                          | 2     | Wave 6             |
| 8    | 7.3                               | 1     | Wave 7             |
| 9    | 7.4                               | 1     | Wave 8 + 4.4 + 6.6 |

**Note on 6.5**: Task 6.5 is intentionally placed in Wave 6 (after 5.3 in Wave 3) because both 5.3 and 6.5 modify `cli.ts` and `commands/index.ts`. They must be serialized even though 6.5's inspect logic doesn't depend on 5.3's docs logic.

## 4. Float / Slack

Tasks not on the critical path have float (can be delayed without affecting project end date).

| Task ID | Float (waves) | Reason                                                     |
| ------- | ------------- | ---------------------------------------------------------- |
| 2.1     | 0             | On critical path                                           |
| 2.4     | 5             | Test task; critical path hits 2.2→2.3 not 2.4              |
| 4.1     | 0             | On critical path                                           |
| 4.2     | 0             | On critical path                                           |
| 4.3     | 0             | On critical path                                           |
| 4.4     | 3             | Integration test; not on longest chain to 7.4              |
| 6.1     | 6             | Critical path uses docs (5.x), not inspect (6.1-6.4)       |
| 6.2     | 6             | Part of inspect non-critical branch                        |
| 6.3     | 6             | Part of inspect non-critical branch                        |
| 6.4     | 3             | Feeds into 6.5 which is on critical path                   |
| 6.6     | 2             | Test; not on primary chain to 7.4                          |
| 7.1     | 8             | Independent workspace update; only blocks nothing critical |
| 7.2     | 2             | Build check; not on the 6.6→7.4 chain                      |
| 7.3     | 1             | Lint/format after build; close to critical                 |

All other tasks have **zero float** — they are on the critical path.

## 5. Text DAG

```
Wave 1    Wave 2    Wave 3    Wave 4    Wave 5    Wave 6    Wave 7    Wave 8    Wave 9
──────    ──────    ──────    ──────    ──────    ──────    ──────    ──────    ──────

1.1 ─────→ 1.2 ──┐
                  ├──→ 2.1 ─────→ 2.2 ─────→ 2.3 ──┬─────────────────────┐
                  │                                  │                     │
                  │                             ┌────┘                     │
                  │                             ▼                          │
                  │                     ┌──→ 3.1 ─────→ 3.2 ─────→ 3.3 ──┐│
                  │                     │                                 ││
2.1 (start) ─────┘                     │                            3.4 ←┘│
                                       │                             │    │
                  ┌────────────────────┘                        3.5 ←─┘    │
                  │  (2.3) ────────────────────────────────────→ (3.5)     │
                  │                             │                          │
                  │                             ▼                          │
                  │                     ┌──→ 4.1 ─────→ 4.2 ─────→ 4.3 ──┤│
                  │                     │                                  ││
                  │                     │    5.1 ←─────────────────────────┘│
                  │                     │     │                             │
                  │                     │    5.2 ─────→ 5.3 ──────────┐    │
                  │                     │                             │    │
6.1 ◄────────────┘                     │                             │    │
  │                                    │                             │    │
  ├──→ 6.2 ─────→ 6.3 ─────→ 6.4 ────┘                             │    │
  │                                                                  │    │
  │         6.5 ◄────────────────────────────────────────────────────┘    │
  │          │                                                            │
  │         6.6 ──┐                                                      │
  │               │                                                      │
7.1 ──────→ ─ ─ ─ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
                  │                                                      │
                  │    4.4 ◄──── 4.3 + 2.4 + 3.6                        │
                  │     │                                                │
                  │     │    7.2 ◄──── 5.3 + 6.5                        │
                  │     │     │                                          │
                  │     │    7.3 ◄──── 7.2                               │
                  │     │     │                                          │
                  └─────┴─────┴────→ 7.4 ◄──── 7.3 + 4.4 + 6.6          │
                                                                       │
                                                                  [END]┘

Legend:
  ──→  FS dependency (Finish-to-Start)
  ◄──  feeds into
  Parallel lanes separated by │

Critical path (■): 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 4.1 → 4.2 → 4.3 → 5.1 → 5.2 → 5.3 → 6.5 → 6.6 → 7.4
Non-critical (□): 2.4, 4.4, 6.1→6.2→6.3→6.4, 7.1, 7.2, 7.3
```

### Parallel Lanes Summary

```
Lane A (types):     1.1 → 1.2
Lane B (mermaid):   2.1 → 2.2 → 2.3 → [2.4 test]
Lane C (renderers): 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → [3.6 test]
Lane D (orchestr):  4.1 → 4.2 → 4.3 → [4.4 test]
Lane E (docs CLI):  5.1 → 5.2 → 5.3
Lane F (inspect):   6.1 → 6.2 → 6.3 → 6.4 → 6.5 → [6.6 test]
Lane G (valid):     7.1, [7.2 build], [7.3 lint], [7.4 e2e]

Merge points:
  - Lanes B+C merge at 3.5 (renderers need mermaid splitting)
  - Lanes D+E merge at 4.1 (orchestrator needs renderers)
  - Lanes E+F merge at 6.5 (serialize cli.ts registration)
  - All lanes converge at 7.4 (e2e test)
```
