#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
ROOT="$(cd "$BASE/.." && pwd)"
BIN="$HOME/.local/bin"
pass=0; fail=0; warn=0
ok(){ printf '[✓] %s\n' "$1"; pass=$((pass+1)); }
bad(){ printf '[✗] %s\n' "$1"; fail=$((fail+1)); }
note(){ printf '[!] %s\n' "$1"; warn=$((warn+1)); }
source "$BASE/banner.sh"
mosta_banner "SYSTEM CHECK"
if command -v python3 >/dev/null 2>&1; then
  pyver="$(python3 -c 'import sys; print(str(sys.version_info.major)+"."+str(sys.version_info.minor))')"
  ok "Python $pyver"
else
  bad "python3 is not installed"
fi
if command -v git >/dev/null 2>&1; then ok "Git"; else bad "Git is not installed"; fi
if [ -d "$ROOT" ]; then ok "Mosta repository layout"; else bad "Repository layout not found"; fi
if [ -d "$BIN" ]; then ok "Local bin directory"; else note "$BIN does not exist yet"; fi
for name in \
  run-network-toolkit run-http-auditor run-pcap run-soc run-config-audit run-route run-triage \
  run-fim run-detect run-lognorm run-normalize run-pipeline run-routing run-vlan run-firewall \
  run-ospf run-stp run-nat run-acl run-snmp run-syslog run-flow run-ipam run-subnet run-topology \
  run-ad-audit run-privcheck run-report run-cfg-audit run-dns-lab run-monitor run-scan run-automation \
  mosta-banner mosta-doctor mosta mosta-tools mosta-external-install \
  mnet mhttp mpcap msoc mconf mroute mtriage mtool mfim mdet mlog mnorm mpipe mrt mvlan mfw \
  mospf mstp mnat macl msnmp msyslog mflow mipam msubnet mtopo mad mpriv mreport mcfg mdns mmon \
  mscan mauto mnmap mnc mdig mtcpdump msocat mtracepath mtraceroute mwhois mcurl mwget mssh \
  mnslookup mss mip mping mps mtop mjq mopenssl mhtop mtmux mrsync mlsof msha256sum mfile \
  miperf3 mipcalc mnetstat mifconfig mmtr mstrace mripgrep mfd mfzf mtree mncdu mmicro mfiglet \
  mtoilet mtermux-info mtermux-storage; do
  if command -v "$name" >/dev/null 2>&1; then ok "$name"; else note "$name is not installed in PATH"; fi
done
if command -v python3 >/dev/null 2>&1; then
  if python3 -c 'import importlib.util,sys; sys.exit(0 if all(importlib.util.find_spec(m) for m in ("flask","scapy")) else 1)'; then
    ok "Python lab dependencies (Flask + Scapy)"
  else
    note "Optional Python lab dependencies are incomplete (Flask/Scapy)"
  fi
fi
for tool in nmap nc dig nslookup tcpdump socat tracepath traceroute whois curl wget ssh ip ping ss ps top jq openssl iperf3 ipcalc htop tmux rsync lsof sha256sum file termux-info termux-setup-storage; do
  if command -v "$tool" >/dev/null 2>&1; then ok "$tool available"; else note "$tool not installed"; fi
done
for tool in mtr netstat ifconfig strace rg fd fzf tree ncdu micro figlet toilet masscan whatweb wifite dnsrecon dnsenum tshark wireshark scapy aircrack-ng kismet nikto ffuf john hashcat hydra zeek suricata msfconsole sqlmap searchsploit burpsuite zaproxy; do
  if command -v "$tool" >/dev/null 2>&1; then ok "optional: $tool"; else note "optional: $tool not installed"; fi
done
if [ -x "/data/data/com.termux/files/usr/bin/pkg" ]; then
  note "Termux: Android permissions can restrict raw packet capture and privileged scans."
  note "Unrooted Android: Nmap TCP connect scans (-sT) are the safer compatibility baseline; raw SYN scans may be unavailable."
  note "Wi-Fi monitor mode and packet injection depend on root, kernel, driver, adapter, and Android build; they are not guaranteed by this toolkit."
fi
if [ "$fail" -eq 0 ]; then
  printf '\nPASS: %d checks, %d notices.\n' "$pass" "$warn"
  exit 0
fi
printf '\nFAIL: %d failed, %d passed, %d notices.\n' "$fail" "$pass" "$warn"
exit 1
