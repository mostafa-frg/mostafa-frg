# Cyber & Network Labs

Practical network-engineering, security, and SOC projects. Every lab works on local input, supplied evidence, or an isolated environment.

## Structure

- **Network engineering** — network-toolkit, network-monitor, subnet-planner, ipam, vlan-lab, firewall-rule-validator, acl-policy-lab, routing-lab, ospf-lab, stp-lab, nat-lab, snmp-audit, syslog-analyzer, netflow-parser, topology-builder, network-automation-lab, network-config-auditor, config-compliance, network-engineering-suite, incident-network-triage, dns-dhcp-lab, dns-dhcp / network-lab-compose / network-operations-lab (Docker).
- **Enterprise security** — active-directory-security-lab, privilege-escalation-lab.
- **Web & API security** — web-security-lab, api-security-lab, ctf-web-lab, http-security-auditor.
- **Blue team & reporting** — soc-log-analyzer, pcap-analysis, security-report-template.
- **Linux / Termux** — [mosta-terminal](mosta-terminal/) (short commands for every lab), linux-network-toolbox, [tool-catalog](tool-catalog/), [mosta-tool-index](mosta-tool-index/).

## Testing

    python -m pytest -q tests
    python -m unittest discover -s tests -p 'test_*.py'

GitHub Actions runs both, plus smoke tests for every CLI, the Flask labs, the PCAP analyzer, the shell launchers, and Docker Compose validation.

All labs are intended for systems and environments where you have explicit authorization.
