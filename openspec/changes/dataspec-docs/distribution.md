# Distribution Plan — `dataspec-docs`

## 1. Configuration

| Parameter             | Value |
| --------------------- | ----- |
| Agents                | 3     |
| Total tasks           | 29    |
| Tasks per agent (avg) | ~9.7  |

## 2. Token Cost Warning

> **Multi-agent execution scales token costs.** Each agent maintains its own full context (project files, task history, dependency knowledge). With 3 agents, expect roughly **3× the token usage** of a single-agent run. Ensure budget and rate limits account for this before launching.

## 3. Feasibility Assessment

**Verdict: Feasible with one serialized handoff.**

The dependency graph naturally clusters into three groups with minimal cross-agent coupling:

- Groups 1–3 (types, mermaid, renderers) form a tight chain with no external file conflicts — single agent.
- Groups 4–5 (orchestrator, docs CLI) depend on group 3 output — second agent.
- Groups 6–7 (inspect CLI, integration) are mostly independent until registration — third agent.

The only mandatory serialization across agents is **5.3 → 6.5** (both write `cli.ts` and `commands/index.ts`). This is a single sync point and does not block Agent C from working on 6.1–6.4 in parallel with Agent B.

No other cross-agent file conflicts exist. This is a clean 3-agent split.

## 4. Agent Assignment Cards

### Agent A — Core Engine

| Field                | Value                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility**   | Foundation types, Mermaid diagram builder, Markdown renderers                                                                                                                                     |
| **Task count**       | 12                                                                                                                                                                                                |
| **Tasks**            | 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6                                                                                                                                        |
| **File ownership**   | `packages/dataspec-cli/src/docs/types.ts`, `packages/dataspec-cli/src/docs/mermaid.ts`, `packages/dataspec-cli/src/docs/renderers.ts`, `__tests__/mermaid.test.ts`, `__tests__/renderers.test.ts` |
| **Execution order**  | 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → (2.4 and 3.6 after their impl deps)                                                                                                   |
| **Cross-agent deps** | None (upstream provider). Produces types and renderers consumed by Agent B.                                                                                                                       |

### Agent B — Orchestrator + Docs CLI

| Field                | Value                                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility**   | Generator orchestration, docs command, CLI registration                                                                                                                                                                           |
| **Task count**       | 7                                                                                                                                                                                                                                 |
| **Tasks**            | 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3                                                                                                                                                                                                 |
| **File ownership**   | `packages/dataspec-cli/src/docs/generator.ts`, `__tests__/generator.test.ts`, `packages/dataspec-cli/src/commands/docs.ts`, `packages/dataspec-cli/src/cli.ts` (partial), `packages/dataspec-cli/src/commands/index.ts` (partial) |
| **Execution order**  | 4.1 → 4.2 → 4.3 → 5.1 → 5.2 → 5.3 (4.4 after 2.4 + 3.6 complete)                                                                                                                                                                  |
| **Cross-agent deps** | **Gate:** Waits for Agent A tasks 3.5 + 1.2 before starting 4.1. **Output:** Must complete 5.3 before Agent C can run 6.5.                                                                                                        |

### Agent C — Inspect CLI + Integration

| Field                | Value                                                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility**   | Inspect command, workspace integration, build validation, E2E                                                                                                                                                   |
| **Task count**       | 10                                                                                                                                                                                                              |
| **Tasks**            | 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4                                                                                                                                                                |
| **File ownership**   | `packages/dataspec-cli/src/commands/inspect.ts`, `packages/dataspec-cli/src/cli.ts` (partial), `packages/dataspec-cli/src/commands/index.ts` (partial), `__tests__/e2e.test.ts`, `examples/ecommerce-platform/` |
| **Execution order**  | 6.1 → 6.2 → 6.3 → 6.4 → [wait for 5.3] → 6.5 → 6.6, 7.1 (parallel), 7.2 → 7.3 → 7.4                                                                                                                             |
| **Cross-agent deps** | **Gate 1:** Waits for Agent A task 1.2 before starting 6.1. **Gate 2:** Waits for Agent B task 5.3 before 6.5. **Gate 3:** 7.2 needs both 5.3 and 6.5. **Gate 4:** 7.4 needs 4.4 (Agent B) and 6.6.             |

## 5. File Ownership Isolation

| File                                            | Owner                   | Notes                                          |
| ----------------------------------------------- | ----------------------- | ---------------------------------------------- |
| `packages/dataspec-cli/src/docs/types.ts`       | Agent A                 |                                                |
| `packages/dataspec-cli/src/docs/mermaid.ts`     | Agent A                 |                                                |
| `packages/dataspec-cli/src/docs/renderers.ts`   | Agent A                 |                                                |
| `packages/dataspec-cli/src/docs/generator.ts`   | Agent B                 |                                                |
| `packages/dataspec-cli/src/commands/docs.ts`    | Agent B                 |                                                |
| `packages/dataspec-cli/src/commands/inspect.ts` | Agent C                 |                                                |
| `packages/dataspec-cli/src/cli.ts`              | **Shared (serialized)** | Agent B writes first (5.3), then Agent C (6.5) |
| `packages/dataspec-cli/src/commands/index.ts`   | **Shared (serialized)** | Agent B writes first (5.3), then Agent C (6.5) |
| `__tests__/mermaid.test.ts`                     | Agent A                 |                                                |
| `__tests__/renderers.test.ts`                   | Agent A                 |                                                |
| `__tests__/generator.test.ts`                   | Agent B                 |                                                |
| `__tests__/e2e.test.ts`                         | Agent C                 |                                                |
| `examples/ecommerce-platform/**`                | Agent C                 |                                                |

**`cli.ts` and `commands/index.ts`** are the only shared files. They are written sequentially: Agent B (task 5.3) adds docs command registration, then Agent C (task 6.5) adds inspect command registration. No merge conflict possible.

## 6. Cross-Agent Dependencies

| Sync Point              | Upstream Agent | Upstream Task | Downstream Agent | Downstream Task | Nature                                       |
| ----------------------- | -------------- | ------------- | ---------------- | --------------- | -------------------------------------------- |
| Types available         | A              | 1.2           | B                | 4.1             | B imports types from A                       |
| Types available         | A              | 1.2           | C                | 6.1             | C imports types from A                       |
| Mermaid splitting ready | A              | 2.3           | C                | 7.1             | Ecommerce example uses diagram splitting     |
| Renderers complete      | A              | 3.5           | B                | 4.1             | Orchestrator calls renderers                 |
| Mermaid tests pass      | A              | 2.4           | B                | 4.4             | Integration test gate                        |
| Renderer tests pass     | A              | 3.6           | B                | 4.4             | Integration test gate                        |
| **Docs registered**     | **B**          | **5.3**       | **C**            | **6.5**         | **Serialize `cli.ts` + `commands/index.ts`** |
| Inspect tests pass      | C              | 6.6           | C                | 7.4             | E2E gate                                     |
| Integration tests pass  | B              | 4.4           | C                | 7.4             | E2E gate                                     |
| Build verified          | C              | 7.2           | C                | 7.3             | Lint after build                             |
| All done                | C              | 7.3           | C                | 7.4             | Final E2E                                    |

## 7. Team Setup

### Launch Sequence

```bash
# Step 1: Start all 3 agents in parallel
# Agent A begins immediately (no upstream dependencies)
# Agent B begins 4.1-type work after Agent A signals 3.5 + 1.2 complete
# Agent C begins 6.1-type work after Agent A signals 1.2 complete

# Step 2: Signal points (use file-based or conversation-based coordination)
# After Agent A completes 1.2 + 3.5 → signal Agent B to start 4.1
# After Agent B completes 5.3 → signal Agent C to run 6.5

# Step 3: Final convergence
# Agent C runs 7.2 → 7.3 → 7.4 after both 5.3 and 6.5 complete
```

### Agent Prompts

**Agent A prompt prefix:**

> You are Agent A (Core Engine). Your tasks: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6. You own: types.ts, mermaid.ts, renderers.ts, and their test files. Execute in dependency order. Signal completion of 1.2 and 3.5 to unblock downstream agents.

**Agent B prompt prefix:**

> You are Agent B (Orchestrator + Docs CLI). Your tasks: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3. You own: generator.ts, generator.test.ts, docs.ts. You share cli.ts and commands/index.ts with Agent C — you write first (5.3), Agent C writes after. Wait for Agent A to complete 1.2 and 3.5 before starting 4.1.

**Agent C prompt prefix:**

> You are Agent C (Inspect CLI + Integration). Your tasks: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4. You own: inspect.ts, e2e.test.ts, examples/ecommerce-platform/. You share cli.ts and commands/index.ts with Agent B — Agent B writes first (5.3), you write after (6.5). Start 6.1–6.4 immediately after Agent A completes 1.2. Wait for Agent B to complete 5.3 before running 6.5.

### Coordination Rules

1. **File isolation**: Never edit a file owned by another agent.
2. **Shared files**: `cli.ts` and `commands/index.ts` follow strict write order: B→5.3, then C→6.5. Agent C must read the current state before appending.
3. **Test verification**: Each agent runs their own unit tests after implementation. Agent C runs E2E last.
4. **Signal mechanism**: Use completion markers (e.g., a `.agent-a-done` sentinel file or direct message) to coordinate the two sync points.
