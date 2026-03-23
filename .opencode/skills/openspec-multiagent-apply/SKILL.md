---
name: openspec-multiagent-apply
description: Orchestrate a Claude Code agent team to implement a change in parallel using a dispec-driven distribution plan. Use when the user has completed /opsx:multiagent planning and wants to start multi-agent execution.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Orchestrate a Claude Code agent team to implement a change in parallel using the distribution plan.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>"

2. **Validate the change uses dispec-driven schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get `schemaName`. If it is NOT `dispec-driven`:
   - Inform the user that multi-agent apply requires the `dispec-driven` schema
   - Suggest using `/opsx:apply` for single-agent execution instead
   - Stop

   If `distribution` artifact is not `done`:
   - Report which artifacts are missing
   - Suggest running `/opsx:multiagent` to complete the planning phase
   - Stop

3. **Read the distribution plan and context**

   Read the following files from the change directory:
   - `distribution.md` — agent assignments, file ownership, cross-agent dependencies
   - `dependencies.md` — task dependency matrix
   - `tasks.md` — full task list with file annotations
   - `proposal.md` — change context
   - `design.md` — technical decisions (if exists)

   Extract from `distribution.md`:
   - Agent count and names
   - Each agent's assigned task IDs, file ownership, execution order
   - Cross-agent dependency table

4. **Display token cost warning and confirm**

   Show the user:
   > **Multi-agent execution scales token costs.** With N agents, expect roughly N× the token usage of a single-agent run.

   Use the **AskUserQuestion tool** to confirm:
   > "Ready to spawn N agents for change '<name>'? This will use approximately N× token costs."

   Options: "Yes, proceed" / "No, cancel"

   If cancelled, stop.

5. **Create the team**

   Use `TeamCreate` with:
   - `team_name`: the change name (kebab-case)
   - `description`: brief description from the proposal

6. **Populate the shared task list**

   For each task in `tasks.md`:
   - Use `TaskCreate` with:
     - `subject`: the task description (e.g., "1.1 Create multiagent-apply.ts file")
     - `description`: include the `Files:` annotation content and any relevant context
     - `activeForm`: present-continuous form (e.g., "Creating multiagent-apply.ts file")

   After all tasks are created, set up dependencies and ownership:
   - Use `TaskUpdate` with `addBlockedBy` to link tasks per the dependency matrix in `dependencies.md`
   - Use `TaskUpdate` with `owner` to pre-assign tasks to agents per the assignment cards in `distribution.md`

7. **Spawn teammates**

   Before spawning agents, detect current working context:
   ```bash
   current_workdir=$(pwd)
   git_toplevel=$(git rev-parse --show-toplevel)
   branch=$(git branch --show-current)
   ```

   For each agent in the distribution plan, use the `Agent` tool with:
   - `name`: agent name from the distribution plan (e.g., "new-skill")
   - `team_name`: the change name
   - `subagent_type`: "general-purpose"
   - `prompt`: include:
     - The agent's assigned task IDs and descriptions
      - File ownership list
      - Execution order
      - Cross-agent dependencies (what to wait for)
      - The change directory path
      - The path to `tasks.md` in the change directory (e.g. `/path/to/openspec/changes/<name>/tasks.md`)
      - **Working directory**: "Your working directory is: `<current_workdir>`. You MUST execute all commands from this directory. Do NOT create new worktrees — work in the existing one. Project root: `<git_toplevel>`. Current branch: `<branch>`."
      - Instructions: "Use `TaskList` to find available work. Use `TaskUpdate` to mark tasks as `in_progress` when starting and `completed` when done. **After marking a task as `completed` via TaskUpdate, you MUST also update `tasks.md`** in the change directory: find the line matching your task description and change `- [ ]` to `- [x]` for that task. This keeps the OpenSpec artifact in sync with execution progress. Check `TaskList` after completing each task for newly unblocked work."

   Spawn agents that have no cross-agent dependencies first (they can start immediately).
   Spawn agents with dependencies after — they will find their tasks blocked in the task list and wait.

8. **Monitor progress**

   After spawning all teammates:
   - Teammates will send messages automatically when they complete tasks or need help
   - Respond to teammate messages as needed (clarify questions, resolve blockers)
   - Periodically check `TaskList` to see overall progress
   - When a teammate reports all their tasks done, acknowledge

   **Tasks.md sync (orquestador as backup):**
   - When a teammate reports a task completed, read `tasks.md` and verify the corresponding line is marked `- [x]`. If not, update it yourself: `- [ ]` → `- [x]` for that task description.
   - This ensures `tasks.md` stays in sync even if a teammate's worktree didn't propagate the change.

9. **Shutdown and report**

   When all tasks show as completed in `TaskList`:

   **Pre-shutdown tasks.md sync:**
   - Read `tasks.md` from the change directory
   - Compare every task line against `TaskList` status
   - Any line still `- [ ]` that corresponds to a completed task in `TaskList` must be updated to `- [x]`
   - Write the corrected `tasks.md` back

   Then:
   - Send `shutdown_request` via `SendMessage` to each teammate
   - Wait for shutdown confirmations
   - Display final summary:

   ```
   ## Multi-Agent Implementation Complete

   **Change:** <change-name>
   **Schema:** dispec-driven
   **Agents:** N agents used
    **Tasks:** M/M complete (tasks.md synced ✓)

   ### Agent Summary
   - <agent-1>: N tasks completed (branch: <worktree-branch>)
   - <agent-2>: N tasks completed (branch: <worktree-branch>)
   ...

   ### Next Steps
   - Review and merge agent branches
   - Run tests to verify integration
   - Archive the change with `/opsx:archive`
   ```

**Guardrails**
- MUST validate schema is `dispec-driven` before proceeding
- MUST validate all artifacts are complete (especially `distribution`)
- MUST show token cost warning and get user confirmation before spawning agents
- MUST detect current working directory and branch before spawning agents
- MUST include working directory instructions in each agent's prompt
- MUST keep `tasks.md` in sync: agents update it on task completion, orchestrator verifies on monitoring and pre-shutdown
- If the distribution plan shows file ownership conflicts (two agents writing same file), warn the user and ask whether to proceed or reassign
- If a teammate reports a blocker, try to help resolve it before escalating to the user
- Do not create the team or spawn agents if the user cancels at the confirmation step
