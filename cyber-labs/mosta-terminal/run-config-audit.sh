#!/usr/bin/env bash
set -e
BASE="$(cd "$(dirname "$0")/.." && pwd)"
source "$(dirname "$0")/banner.sh"
mosta_banner "NETWORK CONFIG COMPLIANCE"
exec python3 "$BASE/config-compliance/check.py" "$@"
