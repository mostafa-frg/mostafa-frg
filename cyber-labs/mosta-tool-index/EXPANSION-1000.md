# MOSTA 1,000-Tool Expansion

## Objective

Grow the MOSTA library by **1,000 additional, distinct, useful tool workflows** across cybersecurity, Linux terminal, Kali Linux, and Termux. The target is not 1,000 labels or aliases: every entry must map to a real upstream executable, a real browser-side operation, or a documented reproducible workflow.

## Current audited baseline on the parent branch

- Parent browser engineering registry: 107 registered tool definitions.
- Current branch browser registry: 225 definitions, including 118 new Linux, Kali Linux, Termux, Android, SOC and defensive-security utilities.
- Backend authorization catalog: 225 entries; it matches the browser registry one-to-one with no duplicate or missing IDs.
- CLI CSV index: 61 upstream command entries; aliases are not counted as new tools.
- Existing terminal wrapper: a fixed allowlist of upstream executables; it does not dynamically trust arbitrary CSV values.
- Existing platform tests execute representative inputs for every registered browser tool.
- Existing terminal tests verify catalog and documentation expectations.

These counts describe the parent development branch, not the production `main` branch.

## Expansion workspaces

| Workspace | Scope |
|---|---|
| Network engineering | IPv4/IPv6, DNS, routing, packet analysis, wireless diagnostics |
| Defensive cybersecurity | hardening, secure configuration, vulnerability evidence review, cryptography |
| SOC & DFIR | log parsing, timeline building, IOC normalization, PCAP metadata, triage |
| Kali Linux | authorized assessment workflows, tool setup checks, evidence parsing |
| Termux / Android | package and environment diagnostics, storage/permission checks, shell workflows |
| Linux terminal | Bash, filesystems, processes, services, systemd, SSH, firewall, containers |
| Web & API security | headers, TLS, cookies, CSP, API schema and authorization evidence review |
| Developer / DevSecOps | Git, secrets hygiene, dependency/SBOM review, container and CI configuration |

## Non-negotiable acceptance gates

1. Unique stable ID; no duplicate tools under renamed aliases.
2. Explicit platform support and dependency detection.
3. Typed input validation, bounded output, deterministic errors, and safe defaults.
4. No arbitrary shell interpolation. Any command builder must quote arguments and display the exact command before use.
5. No silent network activity. External lookups must be labeled and disclose the destination.
6. Security assessment workflows must require an owned or explicitly authorized target and avoid stealth, persistence, credential theft, or uncontrolled scanning.
7. Frontend entries must be searchable, keyboard accessible, mobile responsive, and actually invoke their declared operation.
8. Backend/CLI entries must have unit tests plus representative smoke tests; platform-specific behavior must be marked unverified until tested on that platform.
9. Every new entry must pass duplicate-ID, dependency, schema, syntax, regression, and security checks before it is counted.
10. Catalog references and command aliases do not count as implemented tools by themselves.

## Status accounting

Each entry must be labeled exactly one of:
- `implemented`: operation exists and is wired into its intended interface.
- `tested`: automated tests pass for its declared representative cases.
- `platform-verified`: actually run on the named operating system and version.
- `reference-only`: upstream pointer or command example; not counted as an implemented tool.
- `planned`: not implemented.

The 1,000-tool target is complete only when 1,000 distinct entries are implemented, tested, documented, and visible in the correct workspace. No placeholder multiplication or renamed aliases may inflate the count.

## Implemented increments in this branch

- A deterministic CSV validator with unit tests and a GitHub Actions workflow.
- `mosta-index`, a local read-only catalog browser with list, search, category/platform filters and JSON output.
- 118 new browser-side utilities across Linux administration, Kali Linux authorized assessment, SOC/DFIR, Termux and Android diagnostics, DevSecOps supply-chain review, Windows endpoint posture and defensive configuration review. Command builders generate reviewed command text only; they do not execute shell commands from the website. Local analyzers process pasted evidence in the browser.
- Matching backend catalog and authorization metadata for all 118 additions. Frontend and backend registry IDs were compared: 225 each, with no duplicate or missing IDs.
- Regression tests cover command generation, quoting, input bounds, host/URL restrictions and rejection of shell metacharacters in constrained fields.

These are the first 118 of the requested 1,000 new tools. The previous increments added twelve endpoint, supply-chain and configuration analyzers. The latest increment adds six container and platform analyzers: Dockerfile hardening, Kubernetes Pod security context, Kubernetes RBAC wildcard scope, OpenSSH client hardening, GitHub Dependabot configuration and Kubernetes container image policy. The 1,000-tool goal is not complete, and no entry is called CI-verified until the relevant workflow passes.
