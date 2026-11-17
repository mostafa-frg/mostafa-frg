# Engineering & Security Toolkit

A public collection of desktop utilities, engineering references, and controlled cybersecurity labs. The repository is organized for repeatable use, transparent behavior, and verification through automated tests.

## Desktop toolkit

The DeskOps package provides cross-platform utilities for Windows 10/11, Linux desktops, and macOS. It requires Python 3.10+ and uses only the standard library.

- File hashing and integrity baselines
- DNS resolution and single-endpoint TCP checks
- HTTP security-header review
- Local Apache/Nginx access-log summaries
- No telemetry, automatic uploads, credential collection, or background service

Start here: [Desktop Toolkit documentation](desktop/README.md).

## Engineering workspace

The browser-based workspace currently registers 104 utilities for networking, cybersecurity, SOC analysis, Linux administration, Bash, and developer workflows. CI exercises every registered tool workflow.

- Open the application source in [portfolio](portfolio/).
- Browse the [tool library](portfolio/tools.html).
- Read the [security and privacy notes](portfolio/security.html).

Browser-local tools process supplied data in the browser. External lookups identify their provider and send only the query required for that lookup.

## Network and security labs

The [cyber-labs directory](cyber-labs/README.md) contains independent Python labs for subnetting, routing, VLANs, ACLs, configuration auditing, PCAP analysis, log normalization, detection rules, file integrity, and incident triage.

## Validation

GitHub Actions runs automated checks for the web workspace, backend security tests against isolated local test resources, and Python lab regression tests. The desktop toolkit has a separate Windows and Ubuntu test matrix.

A successful CI run is evidence for the tested code paths only; it is not a guarantee that every environment or live network will behave identically.

## Privacy and safe use

- No personal profile data is required to run the tools.
- No telemetry or silent data upload is built into DeskOps.
- Never commit credentials, tokens, private logs, private keys, or real customer data.
- Network diagnostics and security testing must be limited to systems you own or are explicitly authorized to assess.

## License and third-party tools

No repository-wide open-source license has been selected yet; public visibility does not itself grant redistribution rights. External utilities are not bundled or silently installed, and each upstream tool has its own license.