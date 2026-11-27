# MOSTA Project State

Last updated: 2026-11-27

## Active work

- Repository: `mostafa-frg/mostafa-frg`
- Expansion branch: `feat/mosta-1000-cyber-terminal-tools`
- Pull request: [#7 – MOSTA: expand Linux, Kali, Termux and SOC tool library](https://github.com/mostafa-frg/mostafa-frg/pull/7)
- PR state: Open, Draft, not merged.
- PR base: `feat/mosta-platform-redesign`
- Production `main` has not been changed by this expansion.

## Tool inventory

- Parent browser registry: 107 definitions.
- Expansion branch browser registry: 239 definitions.
- New additions on this branch: 132.
- Backend catalog: 239 definitions.
- Frontend/backend IDs were compared: no missing or duplicate IDs at the latest audit.
- Upstream CLI CSV index: 61 entries; do not add this count to the browser registry because these are separate inventories.
- Requested target: 1,000 genuinely distinct new tools. Remaining target after current additions: 868. Do not count placeholders, renamed aliases or reference-only links.

## Implemented in PR #7

- Local read-only `mosta-index` CLI catalog browser: list, search, platform/category filters and JSON output.
- CSV catalog validator with unit tests and Python 3.10/3.12 GitHub Actions workflow.
- 115 new frontend utilities covering Linux, Kali Linux, SOC/DFIR, Termux/Android, networking, DevSecOps and defensive configuration review.
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

- Code-validation head: `21af036bbcf5cf92bc5c63786c5ba20e7c788025`; current PR head: `2cb447999799acf2ae195e2304d53df6b5470464`. The latest head adds the all-tools schema regression test and adjusts it to support tools that legitimately take no input fields.
- Added Node.js 22 setup and an explicit `node --test portfolio/tests/platform-tools.test.mjs` step to Lab Checks. Before this change, the workflow did not execute the browser-tool JavaScript regression suite.
- The newly enabled suite exposed a pre-existing malformed insertion in `portfolio/assets/platform.js`: helper/UI code had been inserted inside the tool registry and the Dockerfile analyzer definition was truncated. Restored the registry boundary, removed the misplaced duplicate block, and completed the Dockerfile analyzer.
- Fixed the Kubernetes image auditor to recognize normal YAML list entries such as `- image: example/app:latest`.
- Fixed the frontend/backend registry parity test's regular expressions and added frontend ID uniqueness, Dockerfile hardening, and digest-pinned Kubernetes image regression cases.
- Lab Checks run [45456615337](https://github.com/mostafa-frg/mostafa-frg/actions/runs/45456615337) completed successfully on code-validation head `21af036bbcf5cf92bc5c63786c5ba20e7c788025`: both `python` and `backend-security` jobs succeeded. The Node.js 22 portfolio regression suite passed **65/65**; pytest passed **42/42**; Python compilation, offline network/PCAP/HTTP/Flask, terminal installer and Docker Compose smoke steps all passed; and the isolated local-D1 backend security suite passed **89/89**. The later PR head `ebe1bcb...` changes only this top-level state document and did not alter tested code.
- Browser registry remains 231 unique tools; backend authorization catalog remains 231 with exact ID parity. The separate upstream CLI catalog remains 61 entries.
- PR #7 remains Draft and non-mergeable against `feat/mosta-platform-redesign`. No base retarget, merge, or Production deployment was performed.

- Exact successful run evidence: [Lab Checks #45456615337](https://github.com/mostafa-frg/mostafa-frg/actions/runs/45456615337), event `push`, code head `21af036bbcf5cf92bc5c63786c5ba20e7c788025`; `python` and `backend-security` jobs both succeeded. JavaScript registry/analyzer tests **65/65**, pytest **42/42**, backend API security **89/89**; 122 offline toolkit checks passed with 22 informational notices. Optional system tools such as Nmap, socat, traceroute, whois, tshark, Aircrack-ng, Kismet, Nikto, ffuf, John, Hashcat, Hydra, Zeek, Suricata, Metasploit, sqlmap, Searchsploit, Burp Suite and ZAP were not installed in the runner; their absence is reported, not counted as functional installation tests.
- The same workflow also confirms the Node.js 22 JavaScript suite now runs in CI. The earlier failing run [45456466001](https://github.com/mostafa-frg/mostafa-frg/actions/runs/45456466001) failed at the JavaScript suite; fixture repairs were followed by the successful run above.
- GitHub currently reports `mergeable_state=dirty`. Latest base branch `feat/mosta-platform-redesign` is at `fea4e71c00cad242ff569625c2915b4cc7363b12`; comparison shows the feature branch 146 commits ahead / 21 behind. No merge or retarget was attempted because conflict resolution must be deliberate.

- Latest exact-head Lab Checks run [45491020405](https://github.com/mostafa-frg/mostafa-frg/actions/runs/45491020405) passed on `2cb447999799acf2ae195e2304d53df6b5470464`: Node.js regression suite **66/66**, pytest **42/42**, backend API security **89/89**, 122 toolkit checks with 22 informational notices; Python compilation, offline network/PCAP/HTTP/Flask, terminal installer and Docker Compose validations all passed. The new test checks every registered browser tool for a valid stable ID, name, description, category, symbol, handler and optional input schema.
- The first schema-test attempt exposed that `public-ip` is a no-input tool; the test was corrected to allow an omitted `fields` array for input-free tools. The corrected exact-head CI run passed.


## Integration and compatibility review — 2026-11-25

- Compared the expansion branch against the current base branch. It is **153 commits ahead / 21 behind** `feat/mosta-platform-redesign`; the merge base is `ea69dd09976a6a49dcdb9511eac4b2861fd33043`. Six paths have changes on both sides: the two portfolio/lab workflows, `backend/src/index.js`, terminal README, installer, and `mosta-index`.
- Reviewed the base-only changes on those paths. Kept the expansion's collision-safe installer and CSV-backed Python index; retained the base branch's Termux installation documentation while correcting the README so the desktop installer does not globally install unrelated lab requirements.
- Corrected a critical runtime compatibility regression: restored `ITER=100000` in `backend/src/index.js`, matching the later production-safe Cloudflare Workers PBKDF2 hotfix on the base branch. The feature branch's prior `600000` value exceeded the documented Workers WebCrypto ceiling. Commit: `98d2aee5ddf60648e93f4631f2a95bfde156552f`.
- Hardened the terminal catalog CI smoke check against SIGPIPE and added an explicit regression check that searching for a missing catalog entry exits with status 1.
- Exact-head Lab Checks run [45505897428](https://github.com/mostafa-frg/mostafa-frg/actions/runs/45505897428) passed on source/workflow head `805e4f04e56b1d561adfba982705dadf6667ac3b`: Node.js regression tests **66/66**, pytest **42/42**, backend API security **89/89**, and **122** toolkit checks with **22 informational notices**. Python compilation, offline network/PCAP/HTTP/Flask checks, installer collision-preservation tests, CLI index list/search/empty-search checks, and Docker Compose validation passed.
- Optional upstream executables absent from the CI runner remain informational and are not claimed as installed or functionally tested.
- The PR remains Draft and non-mergeable; the six overlapping paths have been reviewed and their safe content choices recorded, but no retarget, merge, Preview deployment, Production deployment, D1 migration, or Cloudflare account change was performed.
- Inventory remains **231** distinct browser tools, **124** new additions toward the 1,000-tool target, and a separate **61-entry** CLI catalog. These are not 200,000 tools.


## Latest website tool expansion — 2026-11-27

- Added eight distinct browser analyzers to the existing tool directory:
  - Nginx security configuration review
  - Apache HTTP Server security review
  - GitHub Actions permissions and action-pinning review
  - Terraform S3 public-exposure review
  - Environment-file secret exposure scan with value redaction
  - Kubernetes Ingress TLS review
  - PostgreSQL listener, TLS and authentication review
  - systemd service hardening review
- Updated `portfolio/assets/platform.js`, `backend/src/index.js`, and the regression/security tests together.
- Frontend registry and backend authorization catalog each contain **239 unique IDs**, with exact set parity.
- Updated category totals and the API security assertion to verify the 239-tool catalog and the eight new IDs.
- Exact source/test head: `f96c23b28a63c5155e62e74c437defab88f4e588`.
- Lab Checks run [46015241042](https://github.com/mostafa-frg/mostafa-frg/actions/runs/46015241042) passed: JavaScript regression tests **67/67**, pytest **42/42**, backend API security **89/89**, plus Python compilation, portfolio tests, offline network/PCAP/HTTP/Flask checks, installer checks and Docker Compose validation.
- The eight additions bring the branch to **132 new browser tools** toward the 1,000-tool target; **868 remain**. The separate CLI reference catalog remains 61 entries.
- No merge, retarget, Preview deployment, Production deployment, D1 migration or Cloudflare account change was performed. PR #7 remains Draft and non-mergeable pending its separate integration/conflict review.
