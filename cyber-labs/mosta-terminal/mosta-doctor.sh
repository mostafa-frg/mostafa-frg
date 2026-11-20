#!/usr/bin/env bash
set -u
BASE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
ROOT="$(cd "$BASE/.." && pwd)"
BIN="$HOME/.local/bin"
pass=0; fail=0; warn=0
ok(){ printf '[OK] %s\n' "$1"; pass=$((pass+1)); }
bad(){ printf '[FAIL] %s\n' "$1"; fail=$((fail+1)); }
note(){ printf '[INFO] %s\n' "$1"; warn=$((warn+1)); }
source "$BASE/banner.sh"
mosta_banner "LINUX DESKTOP SYSTEM CHECK"
if command -v python3 >/dev/null 2>&1; then
  pyver="$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
  ok "Python $pyver"
else
  bad "python3 is not installed"
fi
command -v git >/dev/null 2>&1 && ok "Git" || note "Git is not installed"
[ -d "$ROOT" ] && ok "Repository layout" || bad "Repository layout not found"
[ -d "$BIN" ] && ok "Local bin directory" || note "$BIN does not exist yet"
for name in mosta mosta-doctor mosta-tools mnet mhttp mpcap msoc mconf mroute mtriage mtool mfim mdet mlog mnorm mpipe mrt mvlan mfw mospf mstp mnat macl msnmp msyslog mflow mipam msubnet mtopo mad mpriv mreport mcfg mdns mmon mscan mauto mnmap mnc mdig mtcpdump mtshark mwireshark mscapy msocat mtracepath mtraceroute mmtr mwhois mcurl mwget mssh maircrack mkismet mnikto mffuf mjohn mhashcat mhydra mzeek msuricata mmetsploit msqlmap msearchsploit mburp mzap mmasscan mwhatweb mwifite mdnsrecon mdnsenum mnslookup mss mip mping mps mtop mjq mopenssl miperf3 mipcalc mnetstat mifconfig mhtop mtmux mrsync mlsof msha256sum mfile mstrace mripgrep mfd mfzf mtree mncdu mmicro mfiglet mtoilet; do
  command -v "$name" >/dev/null 2>&1 && ok "$name" || note "$name is not installed in PATH"
done
for tool in nmap nc dig nslookup tcpdump socat tracepath traceroute whois curl wget ssh ip ping ss ps top jq openssl iperf3 sha256sum file; do
  command -v "$tool" >/dev/null 2>&1 && ok "$tool available" || note "$tool not installed"
done
for tool in tshark wireshark scapy aircrack-ng kismet nikto ffuf john hashcat hydra zeek suricata msfconsole sqlmap searchsploit burpsuite zaproxy masscan; do
  command -v "$tool" >/dev/null 2>&1 && ok "optional: $tool" || note "optional: $tool not installed"
done
if command -v python3 >/dev/null 2>&1; then
  python3 -c 'import importlib.util,sys; sys.exit(0 if all(importlib.util.find_spec(m) for m in ("flask","scapy")) else 1)' && ok "Optional Python lab dependencies (Flask + Scapy)" || note "Optional Python lab dependencies are incomplete"
fi
if [ "$fail" -eq 0 ]; then
  printf '\nPASS: %d checks, %d informational notices.\n' "$pass" "$warn"
  exit 0
fi
printf '\nFAIL: %d failed, %d passed, %d informational notices.\n' "$fail" "$pass" "$warn"
exit 1
