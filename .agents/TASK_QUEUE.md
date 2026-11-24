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
- Latest branch head: `290d5fbb4b9d344b80ee1b59f4c764524993f60d` (installer hardening was committed earlier).
- Scope: `cyber-labs/mosta-terminal/install.sh`, `cyber-labs/mosta-terminal/README.md`
- Evidence: Lab Checks run `45015734097` passed on latest head `68c4aff...` under Ubuntu 26.04. It syntax-checked shell launchers, installed into a temporary HOME, asserted no global pip invocation, verified launcher symlinks, exercised `mosta-index list/search`, ran `mosta-doctor` (122 checks, 22 informational notices), and tested the installed `mnmap` wrapper against a fake executable.
- Remaining: consider broader distro/shell compatibility; current CI is one clean Ubuntu 26.04 environment.
- Blocker: PR targets `feat/mosta-platform-redesign`; fresh comparison reports 146 commits ahead and 21 behind that base, and 146 ahead / 66 behind `main`. Six paths overlap with changes on the base branch. Do not retarget until the complete diff and shared ancestry are reviewed.
- Prohibited: merge, Production deploy, destructive package installation on a user's machine.
- Acceptance: one clean Ubuntu CI install path passed; no global pip install was invoked; base-branch decision and independent review remain open.

### PR7-INDEX-001 — Harden and verify CLI catalog CSV validation
- Status: REVIEW
- Owner: Independent Reviewer / QA Agent
- Branch: `feat/mosta-1000-cyber-terminal-tools`
- Latest branch head: `290d5fbb4b9d344b80ee1b59f4c764524993f60d`.
- Scope: `cyber-labs/mosta-tool-index/validate_catalog.py`, `cyber-labs/mosta-tool-index/test_validate_catalog.py`
- Changes: strict CSV parsing; reject rows with extra fields; regression tests for extra columns and unterminated quoted fields; corrected frontend tool-count/category assertions from stale 207 to audited 231; added frontend/backend registry ID parity regression; `mosta_index.py` now uses the shared strict validator and rejects malformed/extra-field catalogs, with new regression tests.
- Evidence: run `45015060496` passed the Python 3.10/3.12 matrix on `20f5fdd...`: validator compile, 61-row catalog validation, and all 14 CLI index unit tests. Latest Lab Checks `45015734097` also passed `mosta-index list/search` on `68c4aff...`.
- Workflow: `.github/workflows/mosta-tool-index.yml` defines Python 3.10/3.12 matrix checks on both push and pull_request. Run `45015060496` passed both matrix jobs on `20f5fdd...` (61 catalog rows, 14 unit tests). Latest full Lab Checks run `45454764659` passed on exact head `290d5fbb4b9d344b80ee1b59f4c764524993f60d`, including installer safety collision test and backend-security 89/89. Previous fixture and CI harness failures were corrected before the successful run.
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


### PR7-JS-CI-001 — Enable and repair frontend regression gate
- Status: DONE (code validation complete; later docs-only commits)
- Owner: ChatGPT implementation / GitHub Actions QA
- Branch: `feat/mosta-1000-cyber-terminal-tools`
- Code-validation SHA: `21af036bbcf5cf92bc5c63786c5ba20e7c788025`
- Scope: `.github/workflows/lab-checks.yml`, `portfolio/assets/platform.js`, `portfolio/tests/platform-tools.test.mjs`
- Changes: added Node.js 22 and explicit `node --test`; restored malformed frontend registry structure; completed Dockerfile hardening analyzer; fixed Kubernetes YAML list image parsing; corrected registry parity regex and added uniqueness/Dockerfile/digest tests.
- Evidence: Lab Checks run `45456615337` passed both jobs: JavaScript 65/65, pytest 42/42, and backend-security 89/89; Python compile and all configured smoke steps passed.
- Later top-level documentation-only PR #7 commits: `ebe1bcb...`, `b7ac46f...`, `b1d2ff...`.
- Prohibited: merge, retarget, Preview/Production deployment, or claim 1,000/200,000 tools exist.
- Remaining release gates: independent security review, resolve PR base overlap, and verify Preview/runtime behavior.



### PR7-SCHEMA-001 — Validate every browser tool definition
- Status: DONE (exact-head CI passed)
- Owner: ChatGPT implementation / GitHub Actions QA
- Branch: `feat/mosta-1000-cyber-terminal-tools`
- Code SHA: `2cb447999799acf2ae195e2304d53df6b5470464`
- Scope: `portfolio/tests/platform-tools.test.mjs`
- Acceptance: all 231 registry entries have safe stable IDs, nonempty name/description/symbol, known category, executable handler, and valid optional input schema; input-free tools are supported.
- Evidence: Lab Checks run `45491020405` passed JavaScript 66/66, pytest 42/42, backend-security 89/89, 122 toolkit checks / 22 informational notices, and configured smoke checks.
- Remaining PR #7 release gates: independent security review, resolve dirty base ancestry (146 ahead / 21 behind), and verify current Preview/runtime behavior. No merge or deployment.
