#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "FILE INTEGRITY MONITOR"
exec python3 "$BASE/file-integrity-monitor/fim.py" "$@"
