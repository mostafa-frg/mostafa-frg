# Engineering & Security Toolkit

A desktop-first collection of practical engineering utilities, command-line references, and controlled cybersecurity labs for Windows, Linux, and macOS.

## Start here

- [Desktop toolkit](desktop/README.md) — local command-line utilities with no third-party Python dependencies.
- [Desktop download and installation guide](desktop/INSTALL.md) — GitHub ZIP download or Git clone, with Windows, Linux, and macOS instructions.
- [Desktop CLI & Security Tool Catalog](desktop/CLI-CATALOG.md) — a categorized upstream directory of networking, web security, defensive monitoring, forensics, cryptography, and developer tools.
- [Browser-based engineering workspace](portfolio/index.html) — practical networking, cybersecurity, SOC, Linux administration, Bash, and developer utilities.
- [Security and privacy notes](portfolio/security.html).

## DeskOps desktop commands

The DeskOps package uses Python 3.10+ and the Python standard library:

- File hashing and integrity manifests.
- DNS resolution and single-endpoint TCP diagnostics.
- HTTP security-header review and TLS certificate inspection.
- Local Apache/Nginx access-log summaries.
- Offline tests and a cross-platform GitHub Actions matrix.

Quick start:

```bash
git clone https://github.com/mostafa-frg/mostafa-frg.git
cd mostafa-frg/desktop
python -m deskops --help
python -m unittest discover -s tests -v
```

On Windows, use `py -3` if `python` is not on PATH. GitHub's **Code → Download ZIP** option is also supported; Git is not required for a ZIP download.

## Desktop CLI catalog

The CLI catalog is designed for desktop/laptop operating systems only. It covers Windows 10/11, Linux distributions, and macOS. It links to upstream projects and explains platform-specific installation routes, verification, and limitations. It does not bundle third-party executables or run installation commands.

**Mobile operating systems and Android terminal environments are out of scope.**

## Engineering workspace and labs

The browser workspace contains utilities for networking, cybersecurity, SOC analysis, Linux administration, Bash, and developer workflows. The [cyber-labs directory](cyber-labs/README.md) contains focused Python labs for subnetting, routing, VLANs, ACLs, configuration auditing, PCAP analysis, log normalization, detection rules, file integrity, and incident triage.

## Privacy and safe use

- No personal profile information is required to download or run the tools.
- DeskOps does not collect device identifiers, credentials, browser data, or personal files.
- No telemetry, silent data upload, account, or background service is built into DeskOps.
- Never commit credentials, tokens, private logs, private keys, or real customer data.
- Network diagnostics and security testing must be limited to systems you own or are explicitly authorized to assess.

## Validation and limitations

GitHub Actions runs automated checks for the browser workspace, backend security tests against isolated local test resources, Python lab regression tests, and the desktop toolkit on supported CI operating systems. Passing CI validates only the code paths exercised by those tests; it does not guarantee compatibility with every hardware device, network, distribution, or third-party package.

## Licensing

No repository-wide open-source license has been selected yet. Public visibility on GitHub does not automatically grant permission to redistribute this repository or third-party software. The CLI catalog links to upstream projects; review each project's license and official installation instructions.
