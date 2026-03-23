## Configuration

- **Agent count**: 3
- **Total tasks**: 28
- **Tasks per agent**: ~9-10

## Token Cost Warning

> **Multi-agent execution scales token costs.** Each agent maintains its own context window.
> With 3 agents, expect roughly **3×** the token usage of a single-agent run.
> Estimated cost multiplier: **3×**

## Feasibility Assessment

**Feasible.** The dependency structure supports 3 agents cleanly:

- **File isolation is clean**: Agent A owns `types/contract.ts`, `schemas/contract.schema.json`, `parsers/contract.ts`, and `contract.test.ts`. Agent B owns `validator.ts` and `validator.test.ts`. Agent C owns documentation files. No two agents write the same file.
- **One cross-agent sync point**: Agent B needs Agent A's type definition (1.1) before starting validator work. This is a single FS dependency at Wave 1→2.
- **Tests align with implementation owners**: Each agent tests their own code.

## Agent Assignments

### Agent A: Core Types + Parser

**Focus**: Type definition, JSON schema, parser implementation, parser tests

**Tasks (10):**

1. 1.1 Add precision, scale, min, max to FieldConstraints interface
2. 1.2 Update JSON schema for new constraint properties
3. 2.1 Parse precision and scale from YAML
4. 2.2 Validate precision/scale only on decimal
5. 2.3 Validate precision/scale co-presence
6. 2.4 Validate positive integers for precision/scale
7. 2.5 Validate scale ≤ precision
8. 5.1 Test valid precision/scale
9. 5.3 Test scale > precision rejection
10. 5.4 Test co-presence rejection

**File ownership:**

- `packages/dataspec-core/src/types/contract.ts`
- `packages/dataspec-core/src/schemas/contract.schema.json`
- `packages/dataspec-core/src/parsers/contract.ts`
- `packages/dataspec-core/src/__tests__/contract.test.ts`

**Execution order:**

1. 1.1 → 1.2 (serialization point)
2. 2.1 → 2.2, 2.3, 2.4 (parallel)
3. 2.4 → 2.5
4. 2.5 → 5.1, 5.3
5. 2.3 → 5.4

**Cross-agent dependencies:** None. Agent A is the foundation.

---

### Agent B: Validator

**Focus**: Min/max parsing, validator logic, validator tests

**Tasks (10):**

1. 3.1 Parse min and max from YAML
2. 3.2 Validate min/max only on numeric types
3. 3.3 Validate finite numbers for min/max
4. 3.4 Validate min ≤ max
5. 4.1 Verify detectTypeNarrowing activates for precision/scale
6. 4.2 Add min/max constraint tightening detection
7. 4.3 Add precision/scale constraint tightening detection
8. 4.4 Add precision/scale consistency check
9. 4.5 Add min/max consistency check
10. 6.3 Test consistency validation rejects precision/scale on non-decimal

**File ownership:**

- `packages/dataspec-core/src/parsers/contract.ts` (min/max section only)
- `packages/dataspec-cli/src/validation/validator.ts`
- `packages/dataspec-cli/__tests__/validator.test.ts`

**Execution order:**

1. (Wait for 1.1 from Agent A)
2. 3.1 → 3.2, 3.3 (parallel)
3. 3.3 → 3.4
4. 4.1, 4.2, 4.3, 4.4, 4.5 (can start after 1.1)
5. 4.4 → 6.3

**Cross-agent dependencies:**

- **Blocked by Agent A**: 1.1 (FieldConstraints type must include new fields before validator can reference them)

---

### Agent C: Tests + Documentation

**Focus**: Parser correctness tests, validator integration tests, documentation

**Tasks (8):**

1. 5.2 Test precision/scale rejected on non-decimal types
2. 5.5 Test non-positive precision/scale rejected
3. 5.6 Test valid min/max
4. 5.7 Test min/max rejected on non-numeric types
5. 5.8 Test min > max rejection
6. 5.9 Test non-finite min/max rejected
7. 7.1 Update contract reference docs
8. 7.2 Update data-contracts spec

**File ownership:**

- `packages/dataspec-core/src/__tests__/contract.test.ts` (read + append)
- `skills/dataspec/references/contract.md`
- `openspec/specs/data-contracts/spec.md`

**Execution order:**

1. 7.1, 7.2 (can start immediately, independent)
2. (Wait for Agent A: 2.2, 2.4, 2.5 for parser test deps)
3. (Wait for Agent B: 3.2, 3.3, 3.4 for parser test deps)
4. 5.2 (needs 2.2), 5.5 (needs 2.4)
5. 5.7 (needs 3.2), 5.9 (needs 3.3)
6. 5.6, 5.8 (need 3.4)

**Cross-agent dependencies:**

- **Blocked by Agent A**: 2.2 for 5.2, 2.4 for 5.5, 2.5 for 5.6/5.8
- **Blocked by Agent B**: 3.2 for 5.7, 3.3 for 5.9, 3.4 for 5.6/5.8

---

## File Ownership Isolation

| File                                                      | Owner Agent                                                 | Notes                                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `packages/dataspec-core/src/types/contract.ts`            | Agent A                                                     | Exclusive                                                                 |
| `packages/dataspec-core/src/schemas/contract.schema.json` | Agent A                                                     | Exclusive                                                                 |
| `packages/dataspec-core/src/parsers/contract.ts`          | Agent A (precision/scale) + Agent B (min/max)               | Different sections, sequential (Agent B starts after Agent A's 1.1)       |
| `packages/dataspec-core/src/__tests__/contract.test.ts`   | Agent A (precision/scale tests) + Agent C (remaining tests) | Different test blocks, sequential (Agent C starts after Agent A's parser) |
| `packages/dataspec-cli/src/validation/validator.ts`       | Agent B                                                     | Exclusive                                                                 |
| `packages/dataspec-cli/__tests__/validator.test.ts`       | Agent B                                                     | Exclusive                                                                 |
| `skills/dataspec/references/contract.md`                  | Agent C                                                     | Exclusive                                                                 |
| `openspec/specs/data-contracts/spec.md`                   | Agent C                                                     | Exclusive                                                                 |

**Shared file resolution:**

- `parsers/contract.ts`: Agent A works on precision/scale parsing (tasks 2.1-2.5). Agent B works on min/max parsing (tasks 3.1-3.4). Agent B waits for Agent A's 1.1, so there's no concurrent write conflict.
- `contract.test.ts`: Agent A writes precision/scale tests (5.1, 5.3, 5.4). Agent C writes remaining tests (5.2, 5.5, 5.6, 5.7, 5.8, 5.9). Agent C starts after Agent A's parser is done, so no conflict.

## Cross-Agent Dependencies

| Waiting Agent | Blocked Task | Depends On                    | Owning Agent |
| ------------- | ------------ | ----------------------------- | ------------ |
| Agent B       | 3.1, 4.1-4.5 | 1.1 FieldConstraints type     | Agent A      |
| Agent C       | 5.2          | 2.2 type validation           | Agent A      |
| Agent C       | 5.5          | 2.4 positive int validation   | Agent A      |
| Agent C       | 5.6          | 2.5 + 3.4 semantic validation | Agent A + B  |
| Agent C       | 5.7          | 3.2 type validation           | Agent B      |
| Agent C       | 5.8          | 3.4 min ≤ max validation      | Agent B      |
| Agent C       | 5.9          | 3.3 finite number validation  | Agent B      |

**Total sync points**: 7. The main bottleneck is Agent A's 1.1 — it gates Agent B and cascades to Agent C.

## Claude Code Team Setup

To execute this plan, run `/opsx-multiagent-apply` on this change. It will automate the steps below.

Alternatively, set up the team manually:

**1. Create the team** using `TeamCreate`:

- `team_name`: `numeric-constraints`
- `description`: Add precision, scale, min, and max constraints for numeric field types in data contracts

**2. Populate the shared task list** using `TaskCreate` for each of the 28 tasks, then use `TaskUpdate` with `addBlockedBy` for dependency relationships and `owner` for agent pre-assignment per the assignments above.

**3. Spawn teammates** using the `Agent` tool for each agent:

- `name`: "Agent A: Core Types + Parser" / "Agent B: Validator" / "Agent C: Tests + Docs"
- `team_name`: `numeric-constraints`
- `subagent_type`: `general-purpose`
- `isolation`: `worktree`
- `prompt`: Include assigned tasks, file ownership, execution order, and cross-agent dependencies from this document

**4. Monitor and shutdown:** Use `TaskList` to track progress. Send `shutdown_request` via `SendMessage` when all tasks are complete.
