# MOSTA Multi-Agent Engineering System

## Mission
Coordinate multiple AI agents on the MOSTA repository without losing context, duplicating work, weakening security, or making unauthorized releases.

## Shared source of truth
1. GitHub repository and immutable commit SHAs are authoritative for code.
2. The `.agents/` directory is authoritative for agent coordination, task ownership, decisions, and handoffs.
3. CI results are authoritative only for the exact commit SHA they tested.
4. Chat transcripts are not authoritative project state.

## Operating model
- **Technical Lead (ChatGPT or designated lead):** scopes work, assigns ownership, resolves conflicts, reviews architecture and accepts/rejects deliverables.
- **Implementation Engineer (Claude Code or equivalent):** implements only the assigned task and owned paths, adds tests, records evidence, and opens/updates a task branch.
- **Independent Security Reviewer:** reviews threat model, authorization, data isolation, secrets, dependency/supply-chain risk, and test coverage. Must not approve its own implementation.
- **CI/Automation:** executes repository checks; never grants release approval by itself.
- **Human owner:** retains authority for merges, production changes, secrets, account permissions, and irreversible actions.

## Mandatory agent startup
Before any work:
1. Read `MASTER_CONTEXT.md`, `CURRENT_STATE.md`, `SECURITY_RULES.md`, `TASK_QUEUE.md`, `DECISIONS.md`, and `HANDOFF.md`.
2. Fetch the latest GitHub state; do not trust stale notes for branch heads, PR state, CI, or deployments.
3. Verify the task is assigned to you and identify allowed paths.
4. Check for concurrent changes and uncommitted work.
5. Record the exact starting SHA and intended branch in the handoff.

## Mandatory completion
Every task must record:
- task ID, owner, branch, base SHA, final SHA;
- exact files changed;
- commands/tests executed and outcomes;
- CI run URLs and the commit SHA they tested;
- security/privacy review performed;
- unresolved risks, untested environments, and limitations;
- next action and handoff owner.

Never report a test as passed unless it actually ran and its output/status was observed. Distinguish PASS, FAIL, BLOCKED, NOT RUN, and NOT APPLICABLE.

## Concurrency and branch policy
- One writer per file/path at a time.
- Each implementation task uses its own branch: `agent/<agent>/<task-id>`.
- Do not force-push. Do not rewrite shared history.
- Rebase/merge coordination requires lead approval.
- Never edit another agent's active task branch without explicit handoff.
- Prefer small, reviewable commits and tests with each behavior change.

## Release boundary
Default state is **no merge, no Production deployment, no Production data/schema/secret changes**. These require explicit human authorization for the specific action. PR #5 was merged before this coordination snapshot was refreshed; the earlier instruction to keep it open is historical and cannot be applied retroactively. All future merges and Production actions still require explicit human authorization for the specific action.

## Honest security posture
The objective is zero known unresolved release-blocking defects, not a claim of zero vulnerabilities. A clean scan or green CI is not proof of security. Unknowns and coverage gaps must remain visible.
