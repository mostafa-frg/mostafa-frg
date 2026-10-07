#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "SYSLOG ANALYZER"
exec python3 "$BASE/syslog-analyzer/analyze.py" "$@"
