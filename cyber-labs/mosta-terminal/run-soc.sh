#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "SOC LOG ANALYZER"
exec python3 "$BASE/soc-log-analyzer/analyzer.py" "$@"
