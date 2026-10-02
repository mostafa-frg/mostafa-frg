#!/usr/bin/env bash
set -euo pipefail

BASE="$(cd "$(dirname "$0")" && pwd)"
BIN="$HOME/.local/bin"

mkdir -p "$BIN"

launchers=(
  run-network-toolkit.sh
  run-http-auditor.sh
  run-pcap.sh
  run-soc.sh
  run-config-audit.sh
  run-route.sh
  run-triage.sh
)

for f in "${launchers[@]}"; do
  ln -sf "$BASE/$f" "$BIN/${f%.sh}"
done
ln -sf "$BASE/banner.sh" "$BIN/mosta-banner"

for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
  [ -f "$rc" ] || continue
  line='export PATH="$HOME/.local/bin:$PATH"'
  grep -Fqx "$line" "$rc" || printf '%s\n' "$line" >> "$rc"
done

printf '%s\n' "Installed Mosta launchers to $BIN"
printf '%s\n' "Restart the shell or reload your shell rc file."
