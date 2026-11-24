#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
ROOT="$(cd "$BASE/.." && pwd)"
BIN="$HOME/.local/bin"
command -v python3 >/dev/null 2>&1 || { printf '%s\n' "ERROR: python3 is required." >&2; exit 1; }
command -v bash >/dev/null 2>&1 || { printf '%s\n' "ERROR: bash is required." >&2; exit 1; }
command -v readlink >/dev/null 2>&1 || { printf '%s\n' "ERROR: readlink is required." >&2; exit 1; }
mkdir -p "$BIN"

# Never delete or replace an unrelated file/symlink in the user's bin directory.
check_link_target() {
  local source="$1" target="$2" resolved
  if [[ -L "$target" ]]; then
    resolved="$(readlink -f -- "$target" 2>/dev/null || true)"
    if [[ "$resolved" == "$source" ]]; then
      return 0
    fi
    printf 'ERROR: refusing to replace existing symlink: %s\n' "$target" >&2
    return 1
  fi
  if [[ -e "$target" ]]; then
    printf 'ERROR: refusing to replace existing file: %s\n' "$target" >&2
    return 1
  fi
}

link_command() {
  local source="$1" target="$2"
  check_link_target "$source" "$target"
  if [[ ! -L "$target" ]]; then
    ln -s -- "$source" "$target"
  fi
}

# Preflight every destination before changing permissions or creating links.
for f in "${launchers[@]}"; do
  check_link_target "$BASE/$f" "$BIN/${f%.sh}"
done
check_link_target "$BASE/banner.sh" "$BIN/mosta-banner"
for f in "${commands[@]}"; do
  check_link_target "$BASE/$f" "$BIN/${f%.sh}"
done
for name in "${external_aliases[@]}"; do
  check_link_target "$BASE/mosta-external" "$BIN/$name"
done
launchers=(run-network-toolkit.sh run-http-auditor.sh run-pcap.sh run-soc.sh run-config-audit.sh run-route.sh run-triage.sh run-fim.sh run-detect.sh run-lognorm.sh run-normalize.sh run-pipeline.sh run-routing.sh run-vlan.sh run-firewall.sh run-ospf.sh run-stp.sh run-nat.sh run-acl.sh run-snmp.sh run-syslog.sh run-flow.sh run-ipam.sh run-subnet.sh run-topology.sh run-ad-audit.sh run-privcheck.sh run-report.sh run-cfg-audit.sh run-dns-lab.sh run-monitor.sh run-scan.sh run-automation.sh)
commands=(mosta mosta-doctor.sh mnet mhttp mpcap msoc mconf mroute mtriage mtool mfim mdet mlog mnorm mpipe mrt mvlan mfw mospf mstp mnat macl msnmp msyslog mflow mipam msubnet mtopo mad mpriv mreport mcfg mdns mmon mscan mauto mosta-tools mosta-index)
for f in "${launchers[@]}" "${commands[@]}" banner.sh mosta-external; do
  [ -f "$BASE/$f" ] || { printf 'ERROR: missing launcher file: %s\n' "$f" >&2; exit 1; }
  chmod +x "$BASE/$f"
done
for f in "${launchers[@]}"; do
  link_command "$BASE/$f" "$BIN/${f%.sh}"
done
link_command "$BASE/banner.sh" "$BIN/mosta-banner"
for f in "${commands[@]}"; do
  link_command "$BASE/$f" "$BIN/${f%.sh}"
done
external_aliases=(mnmap mnc mdig mtcpdump mtshark mwireshark mscapy msocat mtracepath mtraceroute mmtr mwhois mcurl mwget mssh maircrack mkismet mnikto mffuf mjohn mhashcat mhydra mzeek msuricata mmetsploit msqlmap msearchsploit mburp mzap mmasscan mwhatweb mwifite mdnsrecon mdnsenum mnslookup mss mip mping mps mtop mjq mopenssl miperf3 mipcalc mnetstat mifconfig mhtop mtmux mrsync mlsof msha256sum mfile mstrace mripgrep mfd mfzf mtree mncdu mmicro mfiglet mtoilet)
for name in "${external_aliases[@]}"; do
  link_command "$BASE/mosta-external" "$BIN/$name"
done
printf '%s\n' "Python lab dependencies are intentionally not installed globally."
printf '%s\n' "Install only the requirements for the specific lab you plan to use."
for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
  [ -f "$rc" ] || continue
  line='export PATH="$HOME/.local/bin:$PATH"'
  grep -Fqx "$line" "$rc" || printf '%s\n' "$line" >> "$rc"
done
printf '\n%s\n' "Linux desktop CLI installation completed."
printf '%s\n' "Reload your shell, then run: mosta-doctor"
printf '%s\n' "Main commands: mosta, mnet, mhttp, mpcap, msoc, mconf, mroute, mtriage, mtool"
printf '%s\n' "Run mosta for the complete command index."
