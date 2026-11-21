# Task Queue

Statuses: `READY`, `IN_PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`, `CANCELLED`.

## Active coordination tasks

### ORCH-001 — Maintain shared multi-agent operating contract
- Status: IN_PROGRESS
- Owner: Technical Lead
- Branch: `chore/mosta-multi-agent-foundation`
- Scope: `.agents/**`
- Acceptance: current-state snapshot and queue match live GitHub state; role boundaries and handoff protocol remain explicit; no merge or Production deployment.

### PR5-SEC-001 — Independent security review of PR #5
- Status: CANCELLED
- Owner: Independent Security Reviewer
- Reason: PR #5 is merged; this PR-specific task is obsolete. Any review of code now on `main` must be opened as a new, SHA-specific task with an exact scope.
- Do not infer that the review was completed.

### PR5-QA-001 — PR #5 functional and release-gate verification
- Status: CANCELLED
- Owner: QA Agent
- Reason: PR #5 is merged; this PR-specific task is obsolete. Any post-merge regression or release verification must be tracked against the current `main` SHA.
- Do not infer that the release gates were satisfied.

### ORCH-002 — Define agent adapters and task templates
- Status: READY
- Owner: Technical Lead
- Scope: `.agents/agents/**`, `.agents/templates/**`
- Acceptance: copy/paste startup and completion prompts for ChatGPT, Claude, and independent reviewer; standardized task/handoff record; no overlapping writable paths.

## Active engineering and verification tasks

### PR9-AUDIT-001 — Verify audit cursor pagination hardening
- Status: REVIEW
- Owner: Independent Reviewer / QA Agent
- Branch: `feat/mosta-admin-console-audit-pagination`
- Current implementation SHA: `0b131836334ac24624e880c134f3f0f0dc48e470`
- Scope: `backend/src/index.js`, `backend/tests/api-security.mjs`
- Required: verify safe-integer rejection, run backend security suite on exact SHA, inspect admin UI pagination and confirm no duplicate/omitted events across page boundaries.
- Prohibited: merge, Production deploy, Production data/schema/secret changes.
- Acceptance: all targeted tests pass on exact SHA; independent review finds no unresolved High/Critical issue.

### PR7-INSTALL-001 — Verify isolated MOSTA Terminal installation
- Status: REVIEW
- Owner: Independent Reviewer / QA Agent
- Branch: `feat/mosta-1000-cyber-terminal-tools`
- Current implementation SHA: `a1eff15feea8f020b878a345c99bb8e3bbd95db1`
- Scope: `cyber-labs/mosta-terminal/install.sh`, `cyber-labs/mosta-terminal/README.md`
- Required: test installer in a clean Linux environment; prove it does not install requirements from sibling labs; verify symlinks, PATH setup, and mosta-doctor behavior.
- Blocker: PR currently targets `feat/mosta-platform-redesign` and is not mergeable. Compare the complete diff before deciding whether to retarget to `main`.
- Prohibited: merge, Production deploy, destructive package installation on a user's machine.
- Acceptance: clean-environment test evidence on exact SHA; no cross-lab dependency installation; base-branch decision documented.

### PR6-PREVIEW-001 — Repair Preview build configuration
- Status: BLOCKED
- Owner: Repository / Cloudflare Maintainer
- Branch: `chore/mosta-multi-agent-foundation`
- Scope: Cloudflare Build Trigger configuration only, after explicit authorization.
- Evidence: build for `912a89f62baa5e8b3767158bee267071d1b661ca` ran `npx wrangler preview` from repository root; Wrangler config is `backend/wrangler.jsonc`, which already contains a `previews` block.
- Proposed change: use `npx wrangler preview --config backend/wrangler.jsonc`, or set root directory to `backend` only after validating asset paths.
- Prohibited: Production deploy, Production resources/data/schema/secrets, changing account or deployment targets without authorization.
- Acceptance: fresh Preview build and deployment for the current PR #6 head; verify the Preview health endpoint and relevant static assets.

## Queue rules
- Do not assign overlapping writable paths.
- A reviewer cannot review their own implementation as the independent reviewer.
- Do not mark tasks DONE without exact-SHA evidence and acceptance.
- Any new task must state owner, branch, allowed paths, prohibited actions, acceptance criteria, and test plan.
- PR state and CI evidence must be refreshed before each handoff.
