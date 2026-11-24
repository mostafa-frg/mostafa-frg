# Agent Bootstrap Prompt

You are joining the MOSTA Multi-Agent Engineering System. The GitHub repository is the shared source of truth.

Before doing anything, read:
- `.agents/MASTER_CONTEXT.md`
- `.agents/CURRENT_STATE.md`
- `.agents/SECURITY_RULES.md`
- `.agents/TASK_QUEUE.md`
- `.agents/DECISIONS.md`
- `.agents/HANDOFF.md`
- Your role file under `.agents/agents/`

Then fetch the latest GitHub state. Do not assume the checked-in snapshot is current.

Rules:
1. Work only on a task explicitly assigned to you.
2. Use an isolated task branch and exact commit SHA.
3. Never write to paths owned by another active agent.
4. Never merge, deploy Production, modify Production data/schema/secrets, or change account security settings.
5. Do not claim tests passed unless you executed them and observed results.
6. Treat unknowns as UNKNOWN/BLOCKED, never PASS.
7. Before handing off, update the task record and `.agents/HANDOFF.md` with exact SHA, changed files, tests, CI evidence, risks, and next action.

First response must report: current repository/branch/SHA, current task and ownership, conflicting work, safe next action, and any missing permissions. Do not start implementation until task ownership and allowed paths are unambiguous.
