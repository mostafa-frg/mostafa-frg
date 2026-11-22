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
- Status: DONE
- Owner: Technical Lead
- Scope: `.agents/agents/**`, `.agents/templates/**`
- Evidence: ChatGPT, Claude, and independent reviewer adapters now contain copy/paste startup and completion instructions; task and handoff templates provide standardized ownership, allowed-path, test, CI, security, blocker, and next-action fields.
- Commits: `86342dfc6d809c63195bbd1522e2ac070d722123`, `88d0ec153fe574b3b88a240239e060b6bbee6ada`, `7ea46aa205f750a9047712857ed51b7321a83b75`.
- Verification: all three adapter files were fetched back from GitHub and inspected after writing. No merge or deployment.

## Active engineering and verification tasks

### PR9-AUDIT-001 — Verify audit cursor pagination hardening
- Status: REVIEW
- Owner: Independent Reviewer / QA Agent
- Branch: `feat/mosta-admin-console-audit-pagination`
- Current implementation SHA: `0b131836334ac24624e880c134f3f0f0dc48e470`
- Scope: `backend/src/index.js`, `backend/tests/api-security.mjs`
- Required: verify safe-integer rejection, run backend security suite on exact SHA, inspect admin UI pagination and confirm no duplicate/omitted events across page boundaries.
- Evidence: Lab Checks `44932343231`, portfolio `44932343250`, and platform `44932343277` succeeded on this SHA; deployment jobs were skipped.
- Prohibited: merge, Production deploy, Production data/schema/secret changes.
- Acceptance: all targeted tests pass on exact SHA; independent review finds no unresolved High/Critical issue; Preview/runtime verification complete.

### PR7-INSTALL-001 — Verify isolated MOSTA Terminal installation
- Status: REVIEW
- Owner: Independent Reviewer / QA Agent
- Branch: `feat/mosta-1000-cyber-terminal-tools`
- Latest branch commit: `50d2fb429b9869717f12332b1909319770880fce`
- Scope: `cyber-labs/mosta-terminal/install.sh`, `cyber-labs/mosta-terminal/README.md`
- Required: test installer in a clean Linux environment; prove it does not install requirements from sibling labs; verify symlinks, PATH setup, and mosta-doctor behavior.
- Blocker: PR targets `feat/mosta-platform-redesign`; comparison reports 122 commits ahead and 21 behind that base, and 122 ahead / 66 behind `main`. Do not retarget until the complete 20-file diff and shared ancestry are reviewed.
- Prohibited: merge, Production deploy, destructive package installation on a user's machine.
- Acceptance: clean-environment test evidence on exact latest SHA; no cross-lab dependency installation; base-branch decision documented.

### PR7-INDEX-001 — Harden and verify CLI catalog CSV validation
- Status: REVIEW
- Owner: Independent Reviewer / QA Agent
- Branch: `feat/mosta-1000-cyber-terminal-tools`
- Latest branch head: `c8f225f45f73e509b0bfc676a31523317cd921a2`.
- Scope: `cyber-labs/mosta-tool-index/validate_catalog.py`, `cyber-labs/mosta-tool-index/test_validate_catalog.py`
- Changes: strict CSV parsing; reject rows with extra fields; regression tests for extra columns and unterminated quoted fields; corrected frontend tool-count/category assertions from stale 207 to audited 231; added frontend/backend registry ID parity regression.
- Required: run validator against the checked-in 61-entry CSV; run all `test_*.py` tests on Python 3.10 and 3.12; capture exact-SHA CI evidence.
- Workflow: `.github/workflows/mosta-tool-index.yml` defines Python 3.10/3.12 matrix checks on both push and pull_request for this branch. Current execution tools returned no PR-triggered run and no combined commit status for the latest SHA; push-triggered run state remains unverified.
- Prohibited: claim tests passed without observed output; merge or deploy.
- Acceptance: both Python matrix jobs pass on the exact commit; 61 catalog entries validate; malformed-input tests pass.

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
