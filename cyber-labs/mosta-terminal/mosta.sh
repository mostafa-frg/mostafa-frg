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
mtool(){ mrun "LINUX NETWORK TOOLBOX" python3 "$ROOT/linux-network-toolbox/toolbox.py" "$@"; }

printf '%s\n' "Mosta shell helpers loaded."
printf '%s\n' "Run mhelp for available commands."
