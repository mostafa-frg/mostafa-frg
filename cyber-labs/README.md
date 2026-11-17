# Cyber & Network Labs

Practical network-engineering, security, and SOC projects. Labs operate on local input, supplied evidence, or isolated environments.

## Structure

- **Network engineering** — network-toolkit, network-monitor, subnet-planner, ipam, vlan-lab, firewall-rule-validator, acl-policy-lab, routing-lab, ospf-lab, stp-lab, nat-lab, snmp-audit, syslog-analyzer, netflow-parser, topology-builder, network-automation-lab, network-config-auditor, config-compliance, network-engineering-suite, incident-network-triage, dns-dhcp-lab, and isolated Docker network labs.
- **Enterprise security** — active-directory-security-lab, privilege-escalation-lab.
- **Web & API security** — web-security-lab, api-security-lab, ctf-web-lab, http-security-auditor.
- **Blue team & reporting** — soc-log-analyzer, pcap-analysis, security-report-template.
- **Desktop Linux utilities** — mosta-terminal command launchers, linux-network-toolbox, tool-catalog, and mosta-tool-index.

## Testing

    python -m pytest -q tests
    python -m unittest discover -s tests -p 'test_*.py'

GitHub Actions runs both suites plus smoke tests for the Python CLIs, local web labs, PCAP analysis, Linux shell launchers, and Docker Compose definitions.

All labs are intended for systems and environments where you have explicit authorization.