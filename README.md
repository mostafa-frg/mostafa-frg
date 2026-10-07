<div align="center">

# Mostafa Mahmoud

**IT Support • Networking • Linux • Cybersecurity**

<img src="./profile/terminal.svg" alt="Terminal">

Practical network engineering, security testing, Linux administration, and defensive security labs.

[![Lab Checks](https://github.com/mostafa-frg/mostafa-frg/actions/workflows/lab-checks.yml/badge.svg)](https://github.com/mostafa-frg/mostafa-frg/actions/workflows/lab-checks.yml)

</div>

<div align="center">

![Python](https://img.shields.io/badge/Python-3.8%2B%20(static%20check)-3776AB?logo=python&logoColor=white)
![Platform](https://img.shields.io/badge/Linux-tested-2ea44f)
![Termux](https://img.shields.io/badge/Termux-supported%20(not%20yet%20tested)-yellow)
![Tools](https://img.shields.io/badge/30%20CLI%20tools%20%2B%203%20web%20labs-0ea5e9)
![Tests](https://img.shields.io/badge/tests-pytest%20%2B%20unittest-8b5cf6)
![License](https://img.shields.io/badge/use-authorized%20only-orange)

</div>

---

## Preview

Every Python tool and `m*` command opens with the Mosta banner in an interactive terminal:

```text
   __  __  ___  ____ _____  _
  |  \/  |/ _ \/ ___|_   _|/ \
  | |\/| | | | \___ \ | | / _ \
  | |  | | |_| |___) || |/ ___ \
  |_|  |_|\___/|____/ |_/_/   \_\
╭──────────────────────────────────────╮
│ ▸ NETWORK TOOLKIT                    │
│ Network & Security Toolkit · v1.1.0  │
│ by Mostafa Mahmoud                   │
│ ⚠ Authorized use only                │
╰──────────────────────────────────────╯
```

---

## About

I build small, testable tools around the work I actually want to do: troubleshooting networks, validating configurations, analyzing security data, and automating repetitive tasks.

The repository is intentionally practical. Most labs take local input or supplied evidence rather than depending on a live production environment.

## Focus

- Network engineering and troubleshooting
- Linux administration and shell tooling
- Web and API security
- SOC and log analysis
- Security testing in controlled environments
- Network automation

## Projects

### Network Engineering & Security

| Project | What it does | Command |
|---|---|---|
| [Network Toolkit](cyber-labs/network-toolkit/) | subnet, DNS, TCP connectivity, and inventory diagnostics | `mnet` |
| [Network Security Lab](cyber-labs/network-security-lab/) | authorized TCP service inventory with JSON reporting | `mscan` |
| [Network Monitor](cyber-labs/network-monitor/) | periodic TCP health checks with JSONL events | `mmon` |
| [Subnet Planner](cyber-labs/subnet-planner/) | IPv4 subnet allocation and capacity planning | `msubnet` |
| [IPAM Lab](cyber-labs/ipam/) | CSV-backed IPv4 address allocation | `mipam` |
| [VLAN Lab](cyber-labs/vlan-lab/) | access/trunk and VLAN consistency validation | `mvlan` |
| [Firewall Rule Validator](cyber-labs/firewall-rule-validator/) | offline ACL overlap, conflict, and shadowing checks | `mfw` |
| [Network Config Auditor](cyber-labs/network-config-auditor/) | Cisco-style configuration security checks | `mcfg` |
| [Network Automation Lab](cyber-labs/network-automation-lab/) | repeatable IOS-style configuration generation | `mauto` |
| [Topology Builder](cyber-labs/topology-builder/) | CSV-to-Graphviz topology generation | `mtopo` |
| [NetFlow Analyzer](cyber-labs/netflow-parser/) | offline traffic-flow aggregation | `mflow` |
| [DNS & DHCP Lab](cyber-labs/dns-dhcp-lab/) | local DNS/DHCP troubleshooting lab | `mdns` |
| [PCAP Analysis Lab](cyber-labs/pcap-analysis/) | offline packet and DNS analysis | `mpcap` |
| [OSPF Lab](cyber-labs/ospf-lab/) | router-ID, area, and network validation | `mospf` |
| [STP Lab](cyber-labs/stp-lab/) | bridge identity and priority consistency checks | `mstp` |
| [NAT Policy Lab](cyber-labs/nat-lab/) | offline IPv4 NAT policy validation | `mnat` |
| [SNMP Audit](cyber-labs/snmp-audit/) | configuration review for insecure SNMP settings | `msnmp` |
| [Syslog Analyzer](cyber-labs/syslog-analyzer/) | network-device syslog aggregation | `msyslog` |
| [ACL Policy Lab](cyber-labs/acl-policy-lab/) | offline access-control policy validation | `macl` |
| [Routing Lab](cyber-labs/routing-lab/) | offline route validation and analysis | — |
| [Network Operations Lab](cyber-labs/network-operations-lab/) | isolated Docker topology with services and health checks | — |
| [Network Engineering Suite](cyber-labs/network-engineering-suite/) | IP validation, longest-prefix route lookup, and inventory tooling | `mroute` |
| [Network Config Compliance](cyber-labs/config-compliance/) | deterministic Cisco-style configuration compliance checks | `mconf` |
| [Network Incident Triage](cyber-labs/incident-network-triage/) | network event timeline and severity analysis | `mtriage` |
| [File Integrity Monitor](cyber-labs/file-integrity-monitor/) | SHA-256 baseline and tamper detection (added/removed/modified/permissions, optional HMAC) | `mfim` |

### Linux / Termux

| Project | What it does | Command |
|---|---|---|
| [Mosta Terminal](cyber-labs/mosta-terminal/) | Linux/Termux launchers with `Mosta` terminal branding and short aliases | — |
| [Linux Network Toolbox](cyber-labs/linux-network-toolbox/) | interfaces, routes, DNS, and TCP diagnostics | `mtool` |
| [Security Tool Catalog](cyber-labs/tool-catalog/) | categorized Linux/Termux security-tool reference | — |
| [Mosta Tool Index](cyber-labs/mosta-tool-index/) | upstream tool to Mosta alias map (`mnmap`, `mmasscan`, `mdnsrecon`, ...) | — |

### Quick Start (Linux)

```bash
git clone https://github.com/mostafa-frg/mostafa-frg.git
cd mostafa-frg/cyber-labs/mosta-terminal
./install.sh && mosta-doctor
mnet subnet 192.168.10.10/24     # every tool opens with the MOSTA banner
```

The graphic banner is drawn on stderr only in an interactive terminal, so pipes, JSON output and scripts stay clean. Set `MOSTA_BANNER=never` to hide it, `MOSTA_BANNER=always` to force it, or `NO_COLOR=1` to disable colors.

### Termux Quick Start

The repository can be installed as a native Mosta command layer on Termux:

```bash
cd cyber-labs/mosta-terminal
chmod +x install.sh
./install.sh
mosta-doctor
```

Core commands include `mnet`, `mhttp`, `mpcap`, `msoc`, `mconf`, `mroute`, `mtriage`, and `mtool`. Every lab also has a short command: `mvlan`, `mfw`, `mospf`, `mstp`, `mnat`, `macl`, `msnmp`, `msyslog`, `mflow`, `mipam`, `msubnet`, `mtopo`, `mad`, `mpriv`, `mreport`, `mcfg`, `mdns`, `mmon`, `mscan`, and `mauto`. Native networking tools are exposed through `mnmap`, `mnc`, `mdig`, `mtcpdump`, and related Mosta aliases.

### Enterprise Security

- [Active Directory Security Lab](cyber-labs/active-directory-security-lab/) — offline account and privilege auditing
- [Privilege Escalation Lab](cyber-labs/privilege-escalation-lab/) — Linux privilege-boundary checks

### Web Security

- [Web Security Lab](cyber-labs/web-security-lab/) — local web-security exercises
- [API Security Lab](cyber-labs/api-security-lab/) — authentication and authorization testing
- [CTF Web Security Lab](cyber-labs/ctf-web-lab/) — controlled vulnerable web challenges
- [HTTP Security Auditor](cyber-labs/http-security-auditor/) — HTTP security-header assessment

### Blue Team & Reporting

- [SOC Log Analyzer](cyber-labs/soc-log-analyzer/) — SSH authentication-log analysis
- [Security Assessment Report Template](cyber-labs/security-report-template/) — repeatable security-report generation

## What is verified (and what is not)

- **Verified:** 30 pytest tests and the unittest suite pass; every CLI runs on sample data; the three Flask labs serve requests; shell launchers install and run from a clean `HOME` and virtualenv on Linux (tested with Python 3.13).
- **Static check only:** compatibility with Python 3.8-3.12 (no syntax newer than 3.8 is used, but older interpreters were not run).
- **Not tested:** real Termux/Android devices and macOS. The installer uses `readlink -f`, which stock macOS does not provide, so macOS is not claimed as supported.
- **CI:** the workflow is defined in `.github/workflows/lab-checks.yml`; check the badge above for the live result.

## Validation

The GitHub Actions workflow is configured to check:

- Python compilation and CLI help paths
- unit and integration tests (unittest and pytest)
- offline lab fixtures and negative cases
- PCAP analysis with generated test traffic
- local HTTP and Flask lab behavior
- shell syntax and terminal launchers
- Docker Compose configuration

The security labs are scoped to localhost, supplied evidence, offline analysis, or environments where testing is explicitly authorized.

## Tools

`Linux` `Python` `Bash` `Git` `TCP/IP` `IPv4` `DNS` `DHCP` `VLAN` `Routing` `ACL` `IPAM` `PCAP` `Network Automation` `Web Security` `SOC`

---

<div align="center">

**Build it. Test it. Understand it.**

</div>
