#!/usr/bin/env bash
# Mosta start-up banner (graphic header). Drawn on stderr, only on an interactive
# terminal, so pipes and scripts stay clean.
#   MOSTA_BANNER=never|always|auto   NO_COLOR=1   MOSTA_BANNER_SHOWN=1 (set after drawing)
_MOSTA_COMMON="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/../common" 2>/dev/null && pwd || true)"

mosta_banner() {
  local tool="${1:-TOOL}" mode="${MOSTA_BANNER:-auto}"
  case "$mode" in never|0|off|no) return 0 ;; esac
  [ -z "${MOSTA_BANNER_SHOWN:-}" ] || return 0
  if [ "$mode" != "always" ] && [ ! -t 2 ]; then return 0; fi
  local c="" b="" d="" o="" logo ver rule
  if [ -t 2 ] && [ -z "${NO_COLOR:-}" ] && [ "${TERM:-}" != "dumb" ]; then
    c=$'\033[36m'; b=$'\033[1m'; d=$'\033[2m'; o=$'\033[0m'
  fi
  logo="$(cat "$_MOSTA_COMMON/logo.txt" 2>/dev/null || printf 'MOSTA')"
  ver="$(tr -d '[:space:]' < "$_MOSTA_COMMON/VERSION" 2>/dev/null || printf 'dev')"
  rule="$(printf '%*s' 40 '' | tr ' ' '=')"
  {
    printf '\n%s%s%s%s\n' "$c" "$b" "$logo" "$o"
    printf '%s%s%s\n' "$d" "$rule" "$o"
    printf ' %sNetwork & Security Toolkit%s  v%s\n' "$b" "$o" "$ver"
    printf ' Tool : %s%s%s%s\n' "$c" "$b" "$tool" "$o"
    printf ' %sUse only on systems you are authorized to test.%s\n' "$d" "$o"
    printf '%s%s%s\n\n' "$d" "$rule" "$o"
  } >&2
  export MOSTA_BANNER_SHOWN=1
  return 0
}
