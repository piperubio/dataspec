## Configuration

- **Agent count**: 3
- **Total tasks**: 25
- **Tasks per agent**: ~8-9 (varies by agent focus)

## Token Cost Warning

> **Multi-agent execution scales token costs.** Each agent maintains its own context window.
> With 3 agents, expect roughly **3×** the token usage of a single-agent run.
> Estimated cost multiplier: **3×**
>
> Each agent will read relevant project files independently. Shared context (proposal, design, specs)
> is small and does not significantly inflate costs.

## Feasibility Assessment

The 3-agent distribution is **feasible and well-balanced** for this change:

- **Natural independence**: The core utility (Agent 1), CLI integration (Agent 2), and tests (Agent 3) work on largely separate file trees
- **Low coordination overhead**: Only 3 cross-agent sync points (Agent 2 and 3 each wait for Agent 1 to complete task 2.2; Agent 3 waits for Agent 2 on one task)
- **Good workload balance**: Agent 1 has 11 tasks (critical path owner), Agent 2 has 5 tasks (focused integration), Agent 3 has 9 tasks (test-heavy)
- **File isolation is clean**: No two agents write to the same file

## Agent Assignments

### Agent 1: Core & Parsers

**Focus**: Build the AJV validation utility and wire it into all 5 core parsers.

**Tasks:**

- 1.1 Add ajv ^8.12.0 to packages/dataspec-cli/package.json
- 1.2 Run bun install to update lockfile
- 2.1 Create schema-validator.ts with AJV setup and compiled validators
- 2.2 Implement validateAgainstSchema function
- 2.3 Verify schema imports from dataspec-core
- 4.1 Add validation to contract parser (contract.ts)
- 4.2 Add validation to source parser (source.ts)
- 4.3 Add validation to platform parser (platform.ts)
- 4.4 Add validation to dataset parser (dataset.ts)
- 4.5 Add validation to flow parser (flow.ts)
- 4.6 Remove redundant manual checks in all parsers

**File ownership:**

- `packages/dataspec-cli/package.json`
- `bun.lock`
- `packages/dataspec-cli/src/validation/schema-validator.ts`
- `packages/dataspec-core/src/parsers/contract.ts`
- `packages/dataspec-core/src/parsers/source.ts`
- `packages/dataspec-core/src/parsers/platform.ts`
- `packages/dataspec-core/src/parsers/dataset.ts`
- `packages/dataspec-core/src/parsers/flow.ts`

**Execution order:**

1. 1.1 → 1.2 + 2.1 (parallel after 1.1)
2. 2.2 → 2.3
3. 4.1, 4.2, 4.3, 4.4, 4.5 (parallel, all depend on 2.2)
4. 4.6 (after all parsers have validation)

**Cross-agent dependencies:** None — this agent is the dependency source for others.

---

### Agent 2: CLI Integration

**Focus**: Wire schema validation into the CLI workspace parsing and validation pipeline.

**Tasks:**

- 3.1 Wire validation into workspace.ts
- 3.2 Wire validation into validator.ts
- 3.3 Add schema errors to validation report
- 6.2 Add integration test for validator.ts schema validation
- 6.3 Verify error path in validation report output

**File ownership:**

- `packages/dataspec-cli/src/parsing/workspace.ts`
- `packages/dataspec-cli/src/validation/validator.ts`
- `packages/dataspec-cli/src/validation/error.ts`

**Execution order:**

1. Wait for Agent 1 task 2.2 (validateAgainstSchema must exist)
2. 3.1 + 3.2 (parallel)
3. 3.3 (after 3.2)
4. 6.2 (after 3.2)
5. 6.3 (after 3.3)

**Cross-agent dependencies:**

- **Blocked by Agent 1, task 2.2**: Cannot start until validateAgainstSchema function is implemented

---

### Agent 3: Tests & CI

**Focus**: Write unit tests for the validation utility, update existing parser tests, and run CI verification.

**Tasks:**

- 5.1 Create schema-validator.test.ts file structure
- 5.2 Add invalid data error tests
- 5.3 Add all resource type tests
- 5.4 Add multiple errors tests
- 6.1 Update existing parser tests for schema validation errors
- 7.1 Run bun lint and bun format
- 7.2 Run bun test across all packages
- 7.3 Verify CI pipeline passes

**File ownership:**

- `packages/dataspec-cli/src/validation/__tests__/schema-validator.test.ts`
- `packages/dataspec-core/src/__tests__/contract.test.ts`
- `packages/dataspec-core/src/__tests__/source.test.ts`

**Execution order:**

1. Wait for Agent 1 task 2.2 (need validateAgainstSchema to test)
2. 5.1 → 5.2, 5.3, 5.4 (parallel after 5.1)
3. Wait for Agent 1 tasks 4.1, 4.2 (parsers must have validation before updating tests)
4. 6.1 (after parser integration)
5. Wait for Agent 2 task 3.3 (error reporting must be wired)
6. 7.1 → 7.2 → 7.3 (final sequential chain, after all code + tests)

**Cross-agent dependencies:**

- **Blocked by Agent 1, task 2.2**: Cannot start unit tests until validateAgainstSchema exists
- **Blocked by Agent 1, tasks 4.1 + 4.2**: Cannot update parser tests until parsers have schema validation
- **Blocked by Agent 2, task 3.3**: Cannot verify error path reporting until it's wired into the report

## File Ownership Isolation

| File                                                                      | Owner Agent | Notes                    |
| ------------------------------------------------------------------------- | ----------- | ------------------------ |
| `packages/dataspec-cli/package.json`                                      | Agent 1     | Only Agent 1 modifies    |
| `bun.lock`                                                                | Agent 1     | Generated by bun install |
| `packages/dataspec-cli/src/validation/schema-validator.ts`                | Agent 1     | Core utility creation    |
| `packages/dataspec-core/src/parsers/contract.ts`                          | Agent 1     | Parser integration       |
| `packages/dataspec-core/src/parsers/source.ts`                            | Agent 1     | Parser integration       |
| `packages/dataspec-core/src/parsers/platform.ts`                          | Agent 1     | Parser integration       |
| `packages/dataspec-core/src/parsers/dataset.ts`                           | Agent 1     | Parser integration       |
| `packages/dataspec-core/src/parsers/flow.ts`                              | Agent 1     | Parser integration       |
| `packages/dataspec-cli/src/parsing/workspace.ts`                          | Agent 2     | CLI integration          |
| `packages/dataspec-cli/src/validation/validator.ts`                       | Agent 2     | CLI integration          |
| `packages/dataspec-cli/src/validation/error.ts`                           | Agent 2     | Error formatting         |
| `packages/dataspec-cli/src/validation/__tests__/schema-validator.test.ts` | Agent 3     | Unit tests               |
| `packages/dataspec-core/src/__tests__/contract.test.ts`                   | Agent 3     | Parser tests             |
| `packages/dataspec-core/src/__tests__/source.test.ts`                     | Agent 3     | Parser tests             |

**No file conflicts**: Each file is owned by exactly one agent.

## Cross-Agent Dependencies

| Waiting Agent | Blocked Task            | Depends On                              | Owning Agent |
| ------------- | ----------------------- | --------------------------------------- | ------------ |
| Agent 2       | 3.1 Wire workspace.ts   | 2.2 validateAgainstSchema               | Agent 1      |
| Agent 2       | 3.2 Wire validator.ts   | 2.2 validateAgainstSchema               | Agent 1      |
| Agent 3       | 5.1 Create test file    | 2.2 validateAgainstSchema               | Agent 1      |
| Agent 3       | 6.1 Update parser tests | 4.1 Contract parser + 4.2 Source parser | Agent 1      |
| Agent 3       | 7.1 Run lint/format     | 3.3 Error reporting in report           | Agent 2      |

**Total sync points**: 5 cross-agent dependencies. After the initial gate (task 2.2), Agents 1, 2, and 3 proceed largely in parallel until the final CI verification wave.

## Claude Code Team Setup

To execute this plan, run `/opsx-multiagent-apply` on this change. It will automate the steps below.

Alternatively, set up the team manually:

**1. Create the team** using `TeamCreate`:

- `team_name`: `ajv-yaml-validation`
- `description`: "Add AJV JSON Schema validation to YAML parsers for runtime validation"

**2. Populate the shared task list** using `TaskCreate` for each task, then `TaskUpdate` with `addBlockedBy` for dependencies and `owner` for agent pre-assignment.

**3. Spawn 3 teammates** using the `Agent` tool:

- **Agent 1** (`name: "core-parsers"`, `isolation: "worktree"`): Receives tasks 1.1, 1.2, 2.1, 2.2, 2.3, 4.1-4.6
- **Agent 2** (`name: "cli-integration"`, `isolation: "worktree"`): Receives tasks 3.1, 3.2, 3.3, 6.2, 6.3
- **Agent 3** (`name: "tests-ci"`, `isolation: "worktree"`): Receives tasks 5.1-5.4, 6.1, 7.1-7.3

**4. Monitor**: Use `TaskList` to track progress. Send `shutdown_request` when all tasks complete.
