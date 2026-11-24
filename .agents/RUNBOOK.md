# Multi-Agent Operating Runbook

## Recommended topology
- GitHub repository: shared durable state and review boundary.
- ChatGPT: Technical Lead and integration coordinator.
- Claude Code: implementation worker on assigned isolated branches.
- Independent reviewer agent: security/quality review on immutable PR head SHAs.
- GitHub Actions: deterministic CI evidence.
- Human owner: sole release authority.

## Standard lifecycle
1. **Intake:** create a task from `templates/TASK_TEMPLATE.md`; assign one owner and allowed paths.
2. **Claim:** agent records task ownership, branch, and base SHA in the handoff.
3. **Implement:** one writer per path; small commits; tests added with changes.
4. **Self-check:** run focused tests, inspect diff, scan for secrets, and record all skipped checks.
5. **Review:** independent reviewer inspects exact commit SHA and reports evidence-backed findings.
6. **CI:** wait for required checks on the exact PR head SHA; stale checks do not count.
7. **Integrate:** Technical Lead checks conflicts, tests, review findings, and acceptance criteria.
8. **Release:** human owner explicitly authorizes any merge or deployment as a separate action.

## Failure and takeover
When an agent stops responding:
1. Do not assume its task is abandoned.
2. Read the latest handoff and inspect GitHub branch activity.
3. Confirm no active writer remains on the same paths.
4. Fetch the exact latest commit and inspect all changes since the last verified SHA.
5. Re-run relevant tests before continuing.
6. Record takeover owner and timestamp in the handoff.

## Parallelism
Safe parallel work requires disjoint allowed paths and separate branches. Shared files such as `CURRENT_STATE.md`, `TASK_QUEUE.md`, and `HANDOFF.md` are coordination hot spots: nominate one coordinator to update them, or serialize updates. Never allow two agents to overwrite the same shared state simultaneously.

## ChatGPT / Claude session recovery
Paste the bootstrap prompt from `.agents/prompts/BOOTSTRAP.md` into a new session and provide the repository URL. Each agent must independently authenticate to GitHub using its supported integration. Repository documentation does not grant credentials or automatically connect separate AI products.

## Automation boundary
This initial system is intentionally human-supervised. Do not add autonomous issue assignment, agent-triggered code execution, auto-merge, auto-deploy, or secret-bearing automation until threat modeling, permissions, auditability, failure handling, and human approval controls are reviewed and separately approved.
