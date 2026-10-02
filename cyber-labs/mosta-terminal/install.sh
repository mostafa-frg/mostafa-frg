#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.local/bin"
for f in "$BASE"/run-*.sh; do
  ln -sf "$f" "$HOME/.local/bin/$(basename "$f" .sh)"
done
ln -sf "$BASE/banner.sh" "$HOME/.local/bin/mosta-banner"

for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
  [ -f "$rc" ] || continue
  line='export PATH="$HOME/.local/bin:$PATH"'
  grep -Fqx "$line" "$rc" || printf '%s\n' "$line" >> "$rc"
done

printf '%s\n' "Installed Mosta launchers to $HOME/.local/bin"
printf '%s\n' "Restart the shell or reload your shell rc file."
