#!/usr/bin/env bash
set -e
BASE="$(cd "$(dirname "$0")/.." && pwd)"
source "$(dirname "$0")/banner.sh"
mosta_banner "PCAP ANALYSIS"
exec python3 "$BASE/pcap-analysis/analyze.py" "$@"
