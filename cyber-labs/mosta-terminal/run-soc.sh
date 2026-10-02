#!/usr/bin/env bash
set -e
BASE="$(cd "$(dirname "$0")/.." && pwd)"
source "$(dirname "$0")/banner.sh"
mosta_banner "SOC LOG ANALYZER"
exec python3 "$BASE/soc-log-analyzer/analyzer.py" "$@"
