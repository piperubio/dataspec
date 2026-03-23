# Distribution Plan — `dataspec-docs`

## 1. Configuration

| Parameter             | Value |
| --------------------- | ----- |
| Agents                | 2     |
| Total tasks           | 22    |
| Tasks per agent (avg) | 11    |

## 2. Token Cost Warning

> **Multi-agent execution scales token costs.** With 2 agents, expect roughly **2× the token usage** of a single-agent run.

## 3. Feasibility Assessment

**Verdict: Clean 2-agent split with no file conflicts.**

The dependency graph naturally clusters into two groups:

- Groups 1–3 (types, mermaid, renderers) — 12 tasks
- Groups 4–6 (orchestrator, docs CLI, integration) — 10 tasks

No file conflicts between agents. Clean handoff after renderers complete.

## 4. Agent Assignment Cards

### Agent A — Core Engine

| Field                | Value                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility**   | Foundation types, Mermaid diagram builder, Markdown renderers                                                                                                                                     |
| **Task count**       | 12                                                                                                                                                                                                |
| **Tasks**            | 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6                                                                                                                                        |
| **File ownership**   | `packages/dataspec-cli/src/docs/types.ts`, `packages/dataspec-cli/src/docs/mermaid.ts`, `packages/dataspec-cli/src/docs/renderers.ts`, `__tests__/mermaid.test.ts`, `__tests__/renderers.test.ts` |
| **Execution order**  | 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → (2.4, 3.6 after deps)                                                                                                                 |
| **Cross-agent deps** | Signal Agent B when 1.2 and 3.5 complete                                                                                                                                                          |

### Agent B — Orchestrator + CLI + Integration

| Field                | Value                                                                                                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility**   | Generator orchestration, docs command, CLI registration, integration tests                                                                                                                                                                                             |
| **Task count**       | 10                                                                                                                                                                                                                                                                     |
| **Tasks**            | 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4                                                                                                                                                                                                             |
| **File ownership**   | `packages/dataspec-cli/src/docs/generator.ts`, `__tests__/generator.test.ts`, `packages/dataspec-cli/src/commands/docs.ts`, `packages/dataspec-cli/src/cli.ts`, `packages/dataspec-cli/src/commands/index.ts`, `__tests__/e2e.test.ts`, `examples/ecommerce-platform/` |
| **Execution order**  | Wait for 1.2 + 3.5 → 4.1 → 4.2 → 4.3 → 5.1 → 5.2 → 5.3 → 5.4 → 6.1, 6.2 → 6.3 → 6.4                                                                                                                                                                                    |
| **Cross-agent deps** | Wait for Agent A tasks 1.2 and 3.5 before starting 4.1                                                                                                                                                                                                                 |

## 5. File Ownership Isolation

| File                                          | Owner   | Notes |
| --------------------------------------------- | ------- | ----- |
| `packages/dataspec-cli/src/docs/types.ts`     | Agent A |       |
| `packages/dataspec-cli/src/docs/mermaid.ts`   | Agent A |       |
| `packages/dataspec-cli/src/docs/renderers.ts` | Agent A |       |
| `packages/dataspec-cli/src/docs/generator.ts` | Agent B |       |
| `packages/dataspec-cli/src/commands/docs.ts`  | Agent B |       |
| `packages/dataspec-cli/src/cli.ts`            | Agent B |       |
| `packages/dataspec-cli/src/commands/index.ts` | Agent B |       |
| `__tests__/mermaid.test.ts`                   | Agent A |       |
| `__tests__/renderers.test.ts`                 | Agent A |       |
| `__tests__/generator.test.ts`                 | Agent B |       |
| `__tests__/e2e.test.ts`                       | Agent B |       |
| `examples/ecommerce-platform/**`              | Agent B |       |

**No shared files** — Agent B owns all CLI registration.

## 6. Cross-Agent Dependencies

| Sync Point          | Upstream Agent | Upstream Task | Downstream Agent | Downstream Task | Nature                       |
| ------------------- | -------------- | ------------- | ---------------- | --------------- | ---------------------------- |
| Types available     | A              | 1.2           | B                | 4.1             | B imports types from A       |
| Renderers complete  | A              | 3.5           | B                | 4.1             | Orchestrator calls renderers |
| Mermaid tests pass  | A              | 2.4           | B                | 4.4             | Integration test gate        |
| Renderer tests pass | A              | 3.6           | B                | 4.4             | Integration test gate        |

## 7. Team Setup

### Agent A prompt prefix:

> You are Agent A (Core Engine). Your tasks: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6. You own: types.ts, mermaid.ts, renderers.ts, and their test files. Execute in dependency order. Signal completion of 1.2 and 3.5 to unblock Agent B.

### Agent B prompt prefix:

> You are Agent B (Orchestrator + CLI + Integration). Your tasks: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4. You own: generator.ts, docs.ts, cli.ts, commands/index.ts, and all tests. Wait for Agent A to complete 1.2 and 3.5 before starting 4.1.

### Coordination Rules

1. **File isolation**: No shared files — clean ownership
2. **Single sync point**: Agent A signals Agent B when types and renderers are ready
3. **Test verification**: Each agent runs their own tests; Agent B runs final E2E
