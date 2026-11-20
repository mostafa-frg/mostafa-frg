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
- Expansion branch browser registry: 219 definitions.
- New additions on this branch: 112.
- Backend catalog: 219 definitions.
- Frontend/backend IDs were compared: no missing or duplicate IDs at the latest audit.
- Upstream CLI CSV index: 61 entries; do not add this count to the browser registry because these are separate inventories.
- Requested target: 1,000 genuinely distinct new tools. Remaining target after current additions: 888. Do not count placeholders, renamed aliases or reference-only links.

## Implemented in PR #7

- Local read-only `mosta-index` CLI catalog browser: list, search, platform/category filters and JSON output.
- CSV catalog validator with unit tests and Python 3.10/3.12 GitHub Actions workflow.
- 95 new frontend utilities covering Linux, Kali Linux, SOC/DFIR, Termux/Android, networking, DevSecOps and defensive configuration review.
- Matching backend catalog entries and per-user default-deny access model.
- Dedicated Termux & Android Terminal workspace on the portfolio homepage.
- Command builders produce command text only; the website does not execute shell commands on visitor devices.
- Local evidence/config analyzers run in the browser; secret-like values are redacted in the relevant reports.
- Tests cover command quoting, host/URL restrictions, shell injection rejection, representative local analyzer findings and catalog parity.

## Validation history

- Python catalog workflow passed on Python 3.10 and 3.12.
- Latest 219-entry frontend code and analyzer regression suite passed in Lab Checks run [44767735400](https://github.com/mostafa-frg/mostafa-frg/actions/runs/44767735400).
- Backend black-box API security suite passed on the 219-entry revision in Lab Checks run [44767735400](https://github.com/mostafa-frg/mostafa-frg/actions/runs/44767735400).
- Repository-wide Python compilation, portfolio tests, pytest suites, offline network tool smoke tests, log pipeline, PCAP analyzer, HTTP auditor, Flask labs, shell installer/index smoke tests and Docker Compose checks passed again in run [44767986890](https://github.com/mostafa-frg/mostafa-frg/actions/runs/44767986890).
- Cloudflare Workers Preview build succeeded with `npx wrangler preview --config backend/wrangler.jsonc`; it uses the separate `mosta-preview` D1 binding, not the Production database.
- Added `portfolio/.assetsignore` to exclude the CI-only `tests/` directory from public static assets, and added a workflow guard requiring that exclusion.
- The feature-branch Preview URL is public by default until protected with Cloudflare Access. No Production deployment was performed.
- Production deploy jobs remain skipped because this is a Draft feature-branch PR.

## Next work

1. Check and fix every failing check for the current PR head before expanding further.
2. Add real, tested tools in small domain batches; update frontend and backend registries together.
3. Add representative tests for every new tool and update category counts. The latest twelve local analyzers cover GitHub Actions, IAM JSON, CycloneDX SBOM, Defender, Windows Firewall, Linux mount options, BitLocker, RDP, UAC, Python requirements, npm lockfiles and CODEOWNERS.
4. Expand terminal catalog with verified upstream package metadata, installation checks and platform-specific guidance for Kali and Termux.
5. Continue until 1,000 distinct new tools meet the implemented + tested acceptance gates.
6. Keep PR #7 Draft until the full target and review criteria are met; do not merge or deploy without explicit approval.
