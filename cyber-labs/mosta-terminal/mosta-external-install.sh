#!/usr/bin/env bash
set -euo pipefail

if [ ! -x "/data/data/com.termux/files/usr/bin/pkg" ]; then
  printf '%s\n' "This installer is for Termux only." >&2
  exit 1
fi

BASE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
BIN="$HOME/.local/bin"
mkdir -p "$BIN"

pkg update -y
pkg install -y nmap netcat-openbsd dnsutils tracepath traceroute tcpdump socat curl wget openssh whois

chmod +x "$BASE/mosta-external"
aliases=(mnmap mnc mdig mtcpdump msocat mtracepath mtraceroute mwhois mcurl mwget mssh mnslookup mss)
for name in "${aliases[@]}"; do
  ln -sfn "$BASE/mosta-external" "$BIN/$name"
done

# Termux commonly places user-installed executables in ~/.local/bin only
# when the user has added it to PATH; persist that path for Bash and Zsh.
for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
  [ -f "$rc" ] || continue
  line='export PATH="$HOME/.local/bin:$PATH"'
  grep -Fqx "$line" "$rc" || printf '%s\n' "$line" >> "$rc"
done

printf '\n%s\n' "Core Termux network tools installed."
printf '%s\n' "Reload your shell, then run: command -v mnmap && command -v mtcpdump"
printf '%s\n' "Root-only and device-dependent tools are intentionally not installed."
