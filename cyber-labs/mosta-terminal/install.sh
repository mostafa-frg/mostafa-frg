#!/usr/bin/env bash
set -e
BASE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.local/bin"
ln -sf "$BASE/mosta.sh" "$HOME/.local/bin/mosta"
printf '%s\n' 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
printf '%s\n' 'source "$HOME/.local/bin/mosta"' >> "$HOME/.bashrc"
printf '%s\n' "Installed. Restart the shell, then run: mosta"
