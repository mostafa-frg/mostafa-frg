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
- **Phase 0 - Consolidate (done on `platform/clean-v3`).** main (107 tools, redesign merged 2026-11-21) + 46 verified tools = 150,
  gate green. Owner decides the merge. Termux tools are excluded because main's catalog/test forbid them; if wanted, change that rule
  deliberately in one commit (catalog test, terminal-tools test, homepage) rather than slipping them in.
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
- Last updated: 2026-11-22 by Claude. Working branch: `platform/clean-v3` (178 tools; 120 frontend tests, 103 backend checks green;
  browser run of every new tool clean).
- Batch 1 (10): x509-inspector, ssh-fingerprint, nmap-grepable-parser, suricata-eve-summary, zeek-conn-summary, sudoers-audit,
  passwd-shadow-audit, checksum-calc, luhn-check, yara-rule-lint.
- Batch 2 (9): sysmon-event-summary, windows-logon-summary, powershell-encoded-decoder, ioc-defang, ip-in-cidr-list,
  forensic-timestamps, file-signature-id, layered-decoder, auditd-execve-summary. Ground truth: Python (base64, datetime, ipaddress),
  the `file` command on real generated files, documented Sysmon/Security/auditd schemas; mutation-checked (5 deliberate bugs, all caught).
- Batch 3 (6): cipher-suite-classifier (checked against all 158 suites of `openssl ciphers -stdname -v`, by OpenSSL and IANA name),
  jwt-security-audit (tokens built independently in Python), hsts-check (RFC 6797 grammar, hstspreload.org rules), security-txt-check
  (RFC 9116 rules read from the RFC; dates cross-checked with Python datetime), cors-config-audit, http-smuggling-lint (RFC 9112 framing;
  body lengths vs Python). Mutation-checked; surviving mutants were closed with extra boundary tests or shown equivalent.
  Batch 4 (3 so far): dns-zone-audit (all 26 records of three zone files match dnspython), cidr-aggregate (310 cases incl. 300 seeded
  random ones equal Python ipaddress collapse/address_exclude, RFC 5952 output), authorized-keys-audit (real keys from Python cryptography,
  hand-built blobs of exact odd bit lengths). All mutation-checked.
  Not done: sshd-config-audit (sshd not available here to produce ground truth), robots-txt-audit (needs the RFC 9309
  longest-match examples), password-policy-audit (needs the NIST SP 800-63B-4 values read from the source).
- Test standard going forward: derive expected values from an independent source, then mutate the tool to prove the test fails.
- Decision: the catalog stays in one `platform.js` until about 400 tools; the split (Phase 1) is deferred because CI, tests and the
  deploy smoke check all read that file.
- `main` last seen at 0b90b7c. Older `feat/*` and `fix/terminal-tools-*` branches are superseded; do not merge them.
- Next action: Phase 2 batch 4: finish the not-done items above (each needs a cited or locally produced ground truth first), then
  more SOC/DFIR and Linux-hardening tools.
