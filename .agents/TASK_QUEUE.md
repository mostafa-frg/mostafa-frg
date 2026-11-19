# Task Queue

Statuses: `READY`, `IN_PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`, `CANCELLED`.

## Active coordination tasks

### ORCH-001 — Establish shared multi-agent operating contract
- Status: IN_PROGRESS
- Owner: Technical Lead
- Branch: `chore/mosta-multi-agent-foundation`
- Scope: `.agents/**`
- Acceptance: coordination docs exist, roles and handoff protocol are explicit, no PR #5 files changed, no deployment/merge performed.

### PR5-SEC-001 — Independent security review of PR #5
- Status: READY
- Owner: Independent Security Reviewer
- Branch: `agent/security/pr5-security-review`
- Scope: review-only; no code edits unless separately assigned.
- Required: backend authorization, per-user tool access, tenant isolation, audit logging, input validation, abuse/rate limits, CORS/CSP, secrets, migrations, dependency/supply-chain risks, privacy, error handling.
- Output: findings ranked Critical/High/Medium/Low/Informational with file/line evidence, exploit preconditions, impact, remediation, and regression test proposal.
- Blocker: review must inspect current PR head and exact diff; do not rely on historical notes.

### PR5-QA-001 — PR #5 functional and release-gate verification
- Status: READY
- Owner: QA Agent
- Scope: test and evidence only.
- Required: inspect workflow jobs for exact SHA, classify deployment runs and target environments, verify Preview/API health if safely reachable, navigation regression, tool-by-tool regression, supported OS/Python matrix.
- Never touch Production or change PR #5 state.

### ORCH-002 — Define agent adapters and task templates
- Status: READY
- Owner: Technical Lead
- Scope: `.agents/agents/**`, `.agents/templates/**`.
- Acceptance: copy/paste startup and completion prompts for ChatGPT, Claude, and independent reviewer; standardized task/handoff record.

## Queue rules
- Do not assign overlapping writable paths.
- A reviewer cannot review their own implementation as the independent reviewer.
- Do not mark tasks DONE without evidence and acceptance.
- Any new task must state owner, branch, allowed paths, prohibited actions, acceptance criteria, and test plan.
