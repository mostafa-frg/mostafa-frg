# MOSTA Roadmap and Handoff Protocol

Read this file first, in every session, whichever agent (Claude, ChatGPT or a human) you are.
It is the single plan until the goals below are finished. Update the "Status" section at the end of every working session.
Never put secrets, tokens or passwords in this file or anywhere in the repository.

## Owner goals (Mostafa, Cairo; communicate in Arabic)
1. About **2,000 browser tools**, every one working and tested, across all workspaces, with the **most weight on cybersecurity and
   defensive/analysis "hacking" tooling** (Kali, Nmap, Wireshark, SOC/DFIR, Termux, OSINT, hardening audits).
2. The site must look organized, load fast, and the backend must be clean and safe.
3. Quality over count: an alias, a renamed copy or a placeholder does NOT count as a tool.

## Hard rules (both agents)
- Do not change repository visibility; do not delete or overwrite existing repos/files without explicit approval.
- Do not touch Cloudflare settings, delete the Worker, disable builds or disconnect GitHub.
- Work on branches. Only the owner decides to merge to `main` or deploy. Say so before any push that triggers a deploy.
- No offensive tooling: no exploits, payloads, credential attacks, or tools that act against targets. Tools analyze text the user
  pastes, build commands the user runs on their own systems/with authorization, or explain/reference.
- Do not claim "unbreakable", "100% secure" or "complete". Label every claim Implemented / Deployed / Tested / Verified honestly.
- `ITER` (PBKDF2 iterations) must stay **100000**: Cloudflare Workers rejects higher values in production (local workerd does not
  enforce this, so local tests cannot catch it). Raising it breaks admin creation and login.
- Previews use a separate empty D1 database (`mosta-preview`). An admin created on production does not exist on a preview.

## One-writer rule (stops the "everything is mixed up" problem)
- Only ONE agent edits `platform.js`, the backend catalog and the test counts at a time. Before starting, `git fetch` and read the
  newest commit message and `docs/ROADMAP.md` status. Record who is working at the top of Status.
- Never push a change to `platform.js` without running the full gate below. A previous push left `platform.js` with a syntax error
  and a blank tools page while the notes claimed CI had passed. Notes must be written AFTER the gate, from its real output.
- Prefer small commits and one integration branch. Do not create new long-lived branches that rewrite the same files.

## The gate (nothing is merged or counted unless all pass)
Run from the repo root:
1. `node --check portfolio/assets/platform.js` and `node --check backend/src/index.js`
2. `for t in portfolio/tests/*.test.mjs; do node --test $t; done` (all pass, includes the guard that every tool has a dedicated
   known-answer test and unique IDs; update the exact counts in `platform-tools.test.mjs` deliberately)
3. Backend suite: local `wrangler dev` with a throw-away D1 and test-only secrets, then `node backend/tests/api-security.mjs`
   (all pass; catalog count test matches the frontend count)
4. Frontend and backend IDs identical (no tool in one and missing from the other); CI floor in `deploy-backend.yml` matches the count
5. Headless-browser sweep: open every tool with its default input; no JS errors, no blank output, no horizontal overflow, desktop
   and 390px mobile. (`/api/tools` is stubbed because tools are login-gated on the ChatGPT-lineage backend.)
6. Every new tool needs: known-answer test, an error-path test, no network unless labeled `external:true` and tested with mocked fetch.

## Phases
- **Phase 0 - Consolidate (in progress).** One integration branch (`fix/terminal-tools-v2`: 265 tools, gate green). Then owner chooses:
  open a PR into `main` (preferred) or keep reviewing. ChatGPT's `feat/mosta-1000-cyber-terminal-tools` / PR #7 contained a broken
  `platform.js` and `ITER=600000` at last review; rebase it onto the integration branch instead of merging it as is.
- **Phase 1 - Architecture for scale.** Split the single `platform.js` into per-workspace catalog files loaded on demand
  (a 2,000-tool single file would be several MB). Keep `tools.html?tool=ID` deep links, search across all workspaces (small index
  file with id/name/tags only), the backend catalog generated from the same source (script + parity test) so IDs cannot drift,
  CI checks updated to read the split files. Tests load the split files; guard test unchanged.
- **Phase 2 - Cybersecurity depth, in batches of about 100 tools**, each batch fully gated before the next:
  parsers for Nmap/Masscan/Nikto/Gobuster outputs, Wireshark/tshark/Zeek/Suricata, Sysmon/Windows events, auth/web/firewall log
  analyzers, TLS/cert/header/CSP/CORS reviewers, hash/encoding/crypto utilities (known-answer vectors), IOC and YARA/Sigma helpers,
  ATT&CK/CWE/CVSS/CAPEC reference lookups with source data checked, cloud/IaC/container/Kubernetes audits, Linux/Windows hardening
  audits, Kali/Termux/OSINT command builders (text only), DFIR triage, forensics file-format identifiers.
- **Phase 3 - Other workspaces** (networking, Linux/Ubuntu/Bash, developer, cloud, database, Termux) to fill out the 2,000.
- **Phase 4 - Product polish.** Visual consistency across pages, accessibility, performance budget per page, admin console review,
  documented admin recovery runbook (`backend/README.md`), preview-environment banner.
- **Phase 5 - Release.** Owner-approved PR to `main`; deploy workflow resolves the production D1 database and applies migrations;
  smoke tests; record Deployed/Verified status from real output.

## Honest limits
- Browser tools cannot scan or capture packets themselves; they parse output the user pastes and build commands to run elsewhere.
- Network-dependent tools only work where the browser has internet and are labeled external.
- Reference data (ports, ATT&CK, CVSS, Termux packages) must be checked against a cited source and dated; do not write it from memory.
- "Zero errors" cannot be guaranteed; the guarantee is that no tool ships without passing known-answer tests and the gate.

## Status (update every session)
- Last updated: 2026-11-21 by Claude. Working branch: `fix/terminal-tools-v2` (265 tools, 94 frontend tests, 92 backend checks green).
- Production (`main`) unchanged by this work; last seen change was login redirect to the production origin on 2026-11-20.
- Next action: Phase 1 (split catalog), then Phase 2 batch 1.
