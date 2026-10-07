#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
ROOT="$(cd "$BASE/.." && pwd)"
BIN="$HOME/.local/bin"
if [ -f "/data/data/com.termux/files/usr/bin/pkg" ]; then
  printf '%s\n' "Termux detected."
  pkg update -y
  pkg install -y python git
fi
command -v python3 >/dev/null 2>&1 || { printf '%s\n' "ERROR: python3 is required." >&2; exit 1; }
command -v bash >/dev/null 2>&1 || { printf '%s\n' "ERROR: bash is required." >&2; exit 1; }
command -v readlink >/dev/null 2>&1 || { printf '%s\n' "ERROR: readlink is required." >&2; exit 1; }
mkdir -p "$BIN"
launchers=(run-network-toolkit.sh run-http-auditor.sh run-pcap.sh run-soc.sh run-config-audit.sh run-route.sh run-triage.sh run-fim.sh run-detect.sh run-vlan.sh run-firewall.sh run-ospf.sh run-stp.sh run-nat.sh run-acl.sh run-snmp.sh run-syslog.sh run-flow.sh run-ipam.sh run-subnet.sh run-topology.sh run-ad-audit.sh run-privcheck.sh run-report.sh run-cfg-audit.sh run-dns-lab.sh run-monitor.sh run-scan.sh run-automation.sh)
commands=(mosta mosta-doctor.sh mnet mhttp mpcap msoc mconf mroute mtriage mtool mfim mdet mvlan mfw mospf mstp mnat macl msnmp msyslog mflow mipam msubnet mtopo mad mpriv mreport mcfg mdns mmon mscan mauto mosta-tools mosta-external-install.sh)
for f in "${launchers[@]}" "${commands[@]}" banner.sh mosta-external; do
  chmod +x "$BASE/$f"
done
for f in "${launchers[@]}"; do
  ln -sfn "$BASE/$f" "$BIN/${f%.sh}"
done
ln -sfn "$BASE/banner.sh" "$BIN/mosta-banner"
for f in "${commands[@]}"; do
  ln -sfn "$BASE/$f" "$BIN/${f%.sh}"
done
if command -v python3 >/dev/null 2>&1; then
  while IFS= read -r req; do
    [ -z "$req" ] && continue
    printf '%s\n' "Installing Python dependencies from $req"
    python3 -m pip install -r "$ROOT/$req"
  done < <(find "$ROOT" -mindepth 2 -maxdepth 2 -name requirements.txt -print | sed "s#^$ROOT/##" | sort)
fi
if [ -f "/data/data/com.termux/files/usr/bin/pkg" ]; then
  "$BASE/mosta-external-install.sh"
fi
for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
  [ -f "$rc" ] || continue
  line='export PATH="$HOME/.local/bin:$PATH"'
  grep -Fqx "$line" "$rc" || printf '%s\n' "$line" >> "$rc"
done
printf '\n%s\n' "Mosta installation completed."
printf '%s\n' "Reload your shell, then run: mosta-doctor"
printf '%s\n' "Main commands: mosta, mnet, mhttp, mpcap, msoc, mconf, mroute, mtriage, mtool"
printf '%s\n' "Lab commands: mvlan, mfw, mospf, mstp, mnat, macl, msnmp, msyslog, mflow, mipam, msubnet, mtopo, mad, mpriv, mfim, mdet, mreport, mcfg, mdns, mmon, mscan, mauto (run mosta for the full list)"
printf '%s\n' "External network commands: mnmap, mnc, mdig, mtcpdump, msocat, mtracepath, mtraceroute, mwhois, mcurl, mwget, mssh"
