## Configuration

- **Agent count**: 3
- **Total tasks**: 31
- **Tasks per agent**: ~10–11

## Token Cost Warning

> **Multi-agent execution scales token costs.** Each agent maintains its own context window.
> With 3 agents, expect roughly 3× the token usage of a single-agent run.
> Estimated cost multiplier: **3×**

## Feasibility Assessment

Three agents is feasible. The work naturally clusters into:

1. **Type + Parser** (interface changes + parsing logic) — tightly coupled, single agent
2. **Schema + Validator** (JSON schema + dead code cleanup) — independent surface area
3. **Tests + Validation** (all test cases + lint/build/example) — depends on agent 1 completing parser

File ownership is clean — no two agents write the same file. Cross-agent dependency is limited: Agent 3 must wait for Agent 1's parser tasks before writing tests.

## Agent Assignments

### Agent 1: Core Implementation (Type + Parser)

**Tasks:**

- 1.1 Add properties to FieldConstraints interface
- 2.1 min_length parsing with validation
- 2.2 max_length parsing with validation
- 2.3 Cross-constraint min_length <= max_length validation
- 2.4 format parsing with type restriction
- 2.5 pattern parsing with regex validation

**File ownership:**

- `packages/dataspec-core/src/types/contract.ts`
- `packages/dataspec-core/src/parsers/contract.ts`

**Execution order:**

1. 1.1 (type definition first — foundation for everything)
2. 2.1, 2.2, 2.4, 2.5 (independent parsing tasks, any order)
3. 2.3 (cross-constraint — depends on 2.1 and 2.2)

**Cross-agent dependencies:** None — this agent is the foundation provider

### Agent 2: Schema + Validator

**Tasks:**

- 3.1 min_length schema property
- 3.2 max_length schema property
- 3.3 format schema property
- 3.4 pattern schema property
- 4.1 Remove format dead code in detectTypeNarrowing
- 4.2 Activate max_length in detectTypeNarrowing
- 4.3 Activate pattern in detectTypeNarrowing
- 4.4 Add min_length tightening detection
- 4.5 Add max_length tightening detection

**File ownership:**

- `packages/dataspec-core/src/validation/` (schema files)
- `packages/dataspec-cli/src/validation/validator.ts`

**Execution order:**

1. 3.1, 3.2, 3.3, 3.4 (schema updates, any order)
2. 4.1, 4.2, 4.3, 4.4, 4.5 (validator changes, any order)

**Cross-agent dependencies:** None — schema and validator are independent surfaces

### Agent 3: Tests + Validation

**Tasks:**

- 5.1 min_length valid tests
- 5.2 min_length type rejection tests
- 5.3 min_length value validation tests
- 5.4 max_length valid tests
- 5.5 max_length type/value rejection tests
- 5.6 min_length > max_length rejection test
- 5.7 format valid tests
- 5.8 format type rejection tests
- 5.9 pattern valid tests
- 5.10 pattern type rejection tests
- 5.11 pattern invalid regex tests
- 5.12 All constraints combined test
- 6.1 Lint and format
- 6.2 Build verification
- 6.3 Update ecommerce example

**File ownership:**

- `packages/dataspec-core/src/__tests__/contract.test.ts`
- `examples/ecommerce-platform/`

**Execution order:**

1. Wait for Agent 1 tasks 2.1–2.5 to complete
2. 5.1–5.12 (write all tests)
3. 6.1, 6.2 (lint, format, build)
4. 6.3 (update ecommerce example)

**Cross-agent dependencies:**

- Must wait for Agent 1 (parser tasks 2.1–2.5) before writing tests
- Should wait for Agent 2 to complete before 6.2 (build verification)

## File Ownership Isolation

| File                                                    | Owner Agent | Notes             |
| ------------------------------------------------------- | ----------- | ----------------- |
| `packages/dataspec-core/src/types/contract.ts`          | Agent 1     | Type definition   |
| `packages/dataspec-core/src/parsers/contract.ts`        | Agent 1     | Parser logic      |
| `packages/dataspec-core/src/validation/*`               | Agent 2     | JSON schema       |
| `packages/dataspec-cli/src/validation/validator.ts`     | Agent 2     | Dead code cleanup |
| `packages/dataspec-core/src/__tests__/contract.test.ts` | Agent 3     | Tests             |
| `examples/ecommerce-platform/*`                         | Agent 3     | Example update    |

No file conflicts — clean isolation.

## Cross-Agent Dependencies

| Waiting Agent | Blocked Task             | Depends On              | Owning Agent |
| ------------- | ------------------------ | ----------------------- | ------------ |
| Agent 3       | 5.1–5.12 (all tests)     | 2.1, 2.2, 2.3, 2.4, 2.5 | Agent 1      |
| Agent 3       | 6.2 (build verification) | 3.1–3.4, 4.1–4.5        | Agent 2      |

## Claude Code Team Setup

To execute this plan, run `/opsx:multiagent-apply` on this change. It will automate the steps below.

Alternatively, set up the team manually:

**1. Create the team** using `TeamCreate`:

- `team_name`: string-constraints
- `description`: Add min_length, max_length, format, and pattern string constraints to FieldConstraints

**2. Populate the shared task list** using `TaskCreate` for each task, then use `TaskUpdate` with `addBlockedBy` for dependencies and `owner` for pre-assignment per the agent assignments above.

**3. Spawn teammates** using the `Agent` tool for each agent:

- `name`: "Core Implementation" / "Schema + Validator" / "Tests + Validation"
- `team_name`: string-constraints
- `subagent_type`: "general-purpose"
- `isolation`: "worktree"
- `prompt`: include assigned tasks, file ownership, execution order, and cross-agent dependencies

**4. Monitor and shutdown:** Use `TaskList` to track progress. Send `shutdown_request` via `SendMessage` when all tasks are complete.
