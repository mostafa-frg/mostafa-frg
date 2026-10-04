#!/usr/bin/env bash
set -euo pipefail
if [ ! -f "/data/data/com.termux/files/usr/bin/pkg" ]; then
  printf '%s\n' "This installer is for Termux only."
  exit 1
fi
BASE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
BIN="$HOME/.local/bin"
mkdir -p "$BIN"
pkg update -y
pkg install -y nmap netcat-openbsd dnsutils tracepath traceroute tcpdump socat curl wget openssh whois
chmod +x "$BASE/mosta-external"
for name in mnmap mnc mdig mtcpdump msocat mtracepath mtraceroute mwhois mcurl mwget mssh; do
  ln -sfn "$BASE/mosta-external" "$BIN/$name"
done
printf '\n%s\n' "Core Termux network tools installed."
printf '%s\n' "Run mosta-doctor to verify them."
printf '%s\n' "Root-only / restricted tools are intentionally not forced into this installer."
