# MOSTA Project State

Last updated: 2026-11-20

## Active work

- Repository: `mostafa-frg/mostafa-frg`
- Expansion branch: `feat/mosta-1000-cyber-terminal-tools`
- Pull request: [#7 – MOSTA: expand Linux, Kali, Termux and SOC tool library](https://github.com/mostafa-frg/mostafa-frg/pull/7)
- PR state: Open, Draft, not merged.
- PR base: `feat/mosta-platform-redesign`
- Production `main` has not been changed by this expansion.

## Tool inventory

- Parent browser registry: 107 definitions.
- Expansion branch browser registry: 231 definitions.
- New additions on this branch: 124.
- Backend catalog: 231 definitions.
- Frontend/backend IDs were compared: no missing or duplicate IDs at the latest audit.
- Upstream CLI CSV index: 61 entries; do not add this count to the browser registry because these are separate inventories.
- Requested target: 1,000 genuinely distinct new tools. Remaining target after current additions: 876. Do not count placeholders, renamed aliases or reference-only links.

## Implemented in PR #7

- Local read-only `mosta-index` CLI catalog browser: list, search, platform/category filters and JSON output.
- CSV catalog validator with unit tests and Python 3.10/3.12 GitHub Actions workflow.
- 107 new frontend utilities covering Linux, Kali Linux, SOC/DFIR, Termux/Android, networking, DevSecOps and defensive configuration review.
- Matching backend catalog entries and per-user default-deny access model.
- Dedicated Termux & Android Terminal workspace on the portfolio homepage.
- Command builders produce command text only; the website does not execute shell commands on visitor devices.
- Local evidence/config analyzers run in the browser; secret-like values are redacted in the relevant reports.
- Tests cover command quoting, host/URL restrictions, shell injection rejection, representative local analyzer findings and catalog parity.

## Validation history

- Python catalog workflow passed on Python 3.10 and 3.12.
- Earlier 219-entry frontend code and analyzer regression suite passed in Lab Checks run [44767735400](https://github.com/mostafa-frg/mostafa-frg/actions/runs/44767735400).
- Backend black-box API security suite passed on the earlier 219-entry revision in Lab Checks run [44767735400](https://github.com/mostafa-frg/mostafa-frg/actions/runs/44767735400).
- Repository-wide Python compilation, portfolio tests, pytest suites, offline network tool smoke tests, log pipeline, PCAP analyzer, HTTP auditor, Flask labs, shell installer/index smoke tests and Docker Compose checks passed again in run [44767986890](https://github.com/mostafa-frg/mostafa-frg/actions/runs/44767986890).
- Cloudflare Workers Preview build succeeded with `npx wrangler preview --config backend/wrangler.jsonc`; it uses the separate `mosta-preview` D1 binding, not the Production database.
- Added `portfolio/.assetsignore` to exclude the CI-only `tests/` directory from public static assets, and added a workflow guard requiring that exclusion.
- The feature-branch Preview URL is public by default until protected with Cloudflare Access. No Production deployment was performed.
- Latest 231-entry revision passed Lab Checks run [44781622275](https://github.com/mostafa-frg/mostafa-frg/actions/runs/44781622275) on attempt 2; both backend-security and Python jobs succeeded. The first attempt failed a timing-sensitive authentication test, and the isolated retry passed.
- Latest Cloudflare Preview build `2e7915d7-3991-46c2-a2a5-f80fa7ab6cdd` succeeded for commit `a28c33e` using the separate `mosta-preview` D1 binding. Stable Preview URL: https://feat-mosta-1000-cyber-terminal-tools-mostafa-frg.frh7977.workers.dev ; unique deployment URL: https://933246b9-mostafa-frg.frh7977.workers.dev.
- Production deploy jobs remain skipped because this is a Draft feature-branch PR.

## Next work

1. Check and fix every failing check for the current PR head before expanding further.
2. Add real, tested tools in small domain batches; update frontend and backend registries together.
3. Add representative tests for every new tool and update category counts. The latest twenty-four local analyzers cover GitHub Actions, IAM JSON, CycloneDX SBOM, Defender, Windows Firewall, Linux mount options, BitLocker, RDP, UAC, Python requirements, npm lockfiles, CODEOWNERS, Dockerfile hardening, Kubernetes pod security, Kubernetes RBAC, SSH client configuration, Dependabot configuration, Kubernetes image policy, Docker Compose security, Kubernetes NetworkPolicy, Helm values, GitHub branch protection, systemd socket units and PowerShell execution policy.
4. Expand terminal catalog with verified upstream package metadata, installation checks and platform-specific guidance for Kali and Termux.
5. Continue until 1,000 distinct new tools meet the implemented + tested acceptance gates.
6. Keep PR #7 Draft until the full target and review criteria are met; do not merge or deploy without explicit approval.

## Latest quality gate repair — 2026-11-24

- Code-validation head: `21af036bbcf5cf92bc5c63786c5ba20e7c788025`; the current PR head `ebe1bcb2c3cd60ad84baaf7a100744679b40ea16` adds only this state-document update.
- Added Node.js 22 setup and an explicit `node --test portfolio/tests/platform-tools.test.mjs` step to Lab Checks. Before this change, the workflow did not execute the browser-tool JavaScript regression suite.
- The newly enabled suite exposed a pre-existing malformed insertion in `portfolio/assets/platform.js`: helper/UI code had been inserted inside the tool registry and the Dockerfile analyzer definition was truncated. Restored the registry boundary, removed the misplaced duplicate block, and completed the Dockerfile analyzer.
- Fixed the Kubernetes image auditor to recognize normal YAML list entries such as `- image: example/app:latest`.
- Fixed the frontend/backend registry parity test's regular expressions and added frontend ID uniqueness, Dockerfile hardening, and digest-pinned Kubernetes image regression cases.
- Lab Checks run [45456615337](https://github.com/mostafa-frg/mostafa-frg/actions/runs/45456615337) completed successfully on code-validation head `21af036bbcf5cf92bc5c63786c5ba20e7c788025`: both `python` and `backend-security` jobs succeeded. The Node.js 22 portfolio regression suite passed **65/65**, Python compilation and all Python/CLI/installer/Compose smoke steps passed, and the isolated local-D1 backend security suite passed. The later PR head `ebe1bcb...` changes only this top-level state document and did not alter tested code.
- Browser registry remains 231 unique tools; backend authorization catalog remains 231 with exact ID parity. The separate upstream CLI catalog remains 61 entries.
- PR #7 remains Draft and non-mergeable against `feat/mosta-platform-redesign`. No base retarget, merge, or Production deployment was performed.
