#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$(dirname "$0")/banner.sh"

mhelp() {
  printf '%s\n' "Mosta terminal launchers:"
  printf '%s\n' "  mnet     Network Toolkit"
  printf '%s\n' "  mhttp    HTTP Security Auditor"
  printf '%s\n' "  mpcap    PCAP Analysis"
  printf '%s\n' "  msoc     SOC Log Analyzer"
  printf '%s\n' "  mconf    Network Config Compliance"
  printf '%s\n' "  mroute   Network Engineering Suite"
  printf '%s\n' "  mtriage  Network Incident Triage"
  printf '%s\n' "  mtool    Linux Network Toolbox"
  printf '%s\n' "  mfim     File Integrity Monitor"
  printf '%s\n' "  mvlan    VLAN Lab"
  printf '%s\n' "  mfw      Firewall Rule Validator"
  printf '%s\n' "  mospf    OSPF Lab"
  printf '%s\n' "  mstp     STP Lab"
  printf '%s\n' "  mnat     NAT Policy Lab"
  printf '%s\n' "  macl     ACL Policy Lab"
  printf '%s\n' "  msnmp    SNMP Audit"
  printf '%s\n' "  msyslog  Syslog Analyzer"
  printf '%s\n' "  mflow    NetFlow Analyzer"
  printf '%s\n' "  mipam    IPAM Lab"
  printf '%s\n' "  msubnet  Subnet Planner"
  printf '%s\n' "  mtopo    Topology Builder"
  printf '%s\n' "  mad      Active Directory Security Lab"
  printf '%s\n' "  mpriv    Privilege Escalation Lab"
  printf '%s\n' "  mreport  Security Report Template"
  printf '%s\n' "  mcfg     Network Config Auditor"
  printf '%s\n' "  mdns     DNS & DHCP Lab"
  printf '%s\n' "  mmon     Network Monitor"
  printf '%s\n' "  mscan    Network Security Lab (authorized targets only)"
  printf '%s\n' "  mauto    Network Automation Lab"
}

mrun() {
  local label="$1"; shift
  mosta_banner "$label"
  exec "$@"
}

mnet(){ mrun "NETWORK TOOLKIT" python3 "$ROOT/network-toolkit/nettool.py" "$@"; }
mhttp(){ mrun "HTTP SECURITY AUDITOR" python3 "$ROOT/http-security-auditor/auditor.py" "$@"; }
mpcap(){ mrun "PCAP ANALYSIS" python3 "$ROOT/pcap-analysis/analyze.py" "$@"; }
msoc(){ mrun "SOC LOG ANALYZER" python3 "$ROOT/soc-log-analyzer/analyzer.py" "$@"; }
mconf(){ mrun "NETWORK CONFIG COMPLIANCE" python3 "$ROOT/config-compliance/check.py" "$@"; }
mroute(){ mrun "NETWORK ENGINEERING SUITE" python3 "$ROOT/network-engineering-suite/suite.py" "$@"; }
mtriage(){ mrun "NETWORK INCIDENT TRIAGE" python3 "$ROOT/incident-network-triage/triage.py" "$@"; }
mfim(){ mrun "FILE INTEGRITY MONITOR" python3 "$ROOT/file-integrity-monitor/fim.py" "$@"; }
mtool(){ mrun "LINUX NETWORK TOOLBOX" python3 "$ROOT/linux-network-toolbox/toolbox.py" "$@"; }
mvlan(){ mrun "VLAN LAB" python3 "$ROOT/vlan-lab/validate.py" "$@"; }
mfw(){ mrun "FIREWALL RULE VALIDATOR" python3 "$ROOT/firewall-rule-validator/validator.py" "$@"; }
mospf(){ mrun "OSPF LAB" python3 "$ROOT/ospf-lab/ospf.py" "$@"; }
mstp(){ mrun "STP LAB" python3 "$ROOT/stp-lab/stp.py" "$@"; }
mnat(){ mrun "NAT POLICY LAB" python3 "$ROOT/nat-lab/nat.py" "$@"; }
macl(){ mrun "ACL POLICY LAB" python3 "$ROOT/acl-policy-lab/acl.py" "$@"; }
msnmp(){ mrun "SNMP AUDIT" python3 "$ROOT/snmp-audit/audit.py" "$@"; }
msyslog(){ mrun "SYSLOG ANALYZER" python3 "$ROOT/syslog-analyzer/analyze.py" "$@"; }
mflow(){ mrun "NETFLOW ANALYZER" python3 "$ROOT/netflow-parser/flow.py" "$@"; }
mipam(){ mrun "IPAM LAB" python3 "$ROOT/ipam/ipam.py" "$@"; }
msubnet(){ mrun "SUBNET PLANNER" python3 "$ROOT/subnet-planner/planner.py" "$@"; }
mtopo(){ mrun "TOPOLOGY BUILDER" python3 "$ROOT/topology-builder/topology.py" "$@"; }
mad(){ mrun "ACTIVE DIRECTORY AUDIT" python3 "$ROOT/active-directory-security-lab/audit.py" "$@"; }
mpriv(){ mrun "PRIVILEGE CHECK" python3 "$ROOT/privilege-escalation-lab/check.py" "$@"; }
mreport(){ mrun "SECURITY REPORT" python3 "$ROOT/security-report-template/report.py" "$@"; }
mcfg(){ mrun "NETWORK CONFIG AUDITOR" python3 "$ROOT/network-config-auditor/audit.py" "$@"; }
mdns(){ mrun "DNS & DHCP LAB" python3 "$ROOT/dns-dhcp-lab/dns_lab.py" "$@"; }
mmon(){ mrun "NETWORK MONITOR" python3 "$ROOT/network-monitor/monitor.py" "$@"; }
mscan(){ mrun "NETWORK SECURITY LAB" python3 "$ROOT/network-security-lab/scanner.py" "$@"; }
mauto(){ mrun "NETWORK AUTOMATION LAB" python3 "$ROOT/network-automation-lab/build.py" "$@"; }

printf '%s\n' "Mosta shell helpers loaded."
printf '%s\n' "Run mhelp for available commands."
