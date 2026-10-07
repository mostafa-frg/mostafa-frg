#!/usr/bin/env bash
# Mosta start-up banner (graphic header). Drawn on stderr, only on an interactive
# terminal, so pipes and scripts stay clean.
#   MOSTA_BANNER=never|always|auto   NO_COLOR=1   MOSTA_ASCII=1   MOSTA_BANNER_SHOWN=1 (set after drawing)
_MOSTA_COMMON="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/../common" 2>/dev/null && pwd || true)"

mosta_banner() {
  local tool="${1:-TOOL}" mode="${MOSTA_BANNER:-auto}"
  case "$mode" in never|0|off|no) return 0 ;; esac
  [ -z "${MOSTA_BANNER_SHOWN:-}" ] || return 0
  if command -v python3 >/dev/null 2>&1 && [ -f "$_MOSTA_COMMON/mosta_banner.py" ]; then
    python3 "$_MOSTA_COMMON/mosta_banner.py" "$tool" || true
  elif [ "$mode" = "always" ] || [ -t 2 ]; then
    printf '\n== MOSTA | %s ==\n Network & Security Toolkit\n Use only on systems you are authorized to test.\n\n' "$tool" >&2
  fi
  export MOSTA_BANNER_SHOWN=1
  return 0
}
