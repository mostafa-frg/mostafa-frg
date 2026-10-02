#!/usr/bin/env bash
mosta_banner() {
  local tool="${1:-TOOL}"
  printf '\n========================================\n'
  printf '                 MOSTA\n'
  printf '              %s\n' "$tool"
  printf '========================================\n\n'
}
