#!/usr/bin/env bash
set -u
export PS1='Mosta@\\h:\\w$ '
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mhelp() {
  printf '%s\n' "Mosta Terminal"
  printf '%s\n' "mnet mhttp mpcap msoc mconf mroute mtriage"
}
mnet(){ python3 "$ROOT/network-toolkit/nettool.py" "$@"; }
mhttp(){ python3 "$ROOT/http-security-auditor/auditor.py" "$@"; }
mpcap(){ python3 "$ROOT/pcap-analysis/analyze.py" "$@"; }
msoc(){ python3 "$ROOT/soc-log-analyzer/analyzer.py" "$@"; }
mconf(){ python3 "$ROOT/config-compliance/check.py" "$@"; }
mroute(){ python3 "$ROOT/routing-lab/routing.py" "$@"; }
mtriage(){ python3 "$ROOT/incident-network-triage/triage.py" "$@"; }

printf '%s\n' "======================================"
printf '%s\n' "           MOSTA TERMINAL"
printf '%s\n' "     Network | Linux | Security"
printf '%s\n' "======================================"
printf '%s\n' "Type mhelp for lab commands."
