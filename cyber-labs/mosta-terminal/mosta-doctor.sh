#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$BASE/.." && pwd)"
BIN="$HOME/.local/bin"
pass=0; fail=0; warn=0
ok(){ printf '[✓] %s\n' "$1"; pass=$((pass+1)); }
bad(){ printf '[✗] %s\n' "$1"; fail=$((fail+1)); }
note(){ printf '[!] %s\n' "$1"; warn=$((warn+1)); }
printf '\n========================================\n                 MOSTA\n              SYSTEM CHECK\n========================================\n\n'
if command -v python3 >/dev/null 2>&1; then pyver="$(python3 -c 'import sys; print(str(sys.version_info.major)+"."+str(sys.version_info.minor))')"; ok "Python $pyver"; else bad "python3 is not installed"; fi
if command -v git >/dev/null 2>&1; then ok "Git"; else bad "Git is not installed"; fi
if [ -d "$ROOT" ]; then ok "Mosta repository layout"; else bad "Repository layout not found"; fi
if [ -d "$BIN" ]; then ok "Local bin directory"; else note "$BIN does not exist yet"; fi
for name in run-network-toolkit run-http-auditor run-pcap run-soc run-config-audit run-route run-triage mosta-banner mosta-doctor mnet mhttp mpcap msoc mconf mroute mtriage mtool; do
  if command -v "$name" >/dev/null 2>&1; then ok "$name"; else note "$name is not installed in PATH"; fi
done
if command -v python3 >/dev/null 2>&1; then
  if python3 -c 'import importlib.util,sys; sys.exit(0 if all(importlib.util.find_spec(m) for m in ("flask","scapy")) else 1)'; then ok "Python lab dependencies (Flask + Scapy)"; else note "Optional Python lab dependencies are incomplete (Flask/Scapy)"; fi
fi
for tool in nmap nc dig tcpdump tshark; do
  if command -v "$tool" >/dev/null 2>&1; then ok "$tool available"; else note "$tool not installed (external tool)"; fi
done
if [ "$fail" -eq 0 ]; then printf '\nPASS: %d checks, %d optional notices.\n' "$pass" "$warn"; exit 0; fi
printf '\nFAIL: %d failed, %d passed, %d notices.\n' "$fail" "$pass" "$warn"; exit 1
