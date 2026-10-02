#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")/.." && pwd)"
source "$(dirname "$0")/banner.sh"
mosta_banner "NETWORK ENGINEERING SUITE"
exec python3 "$BASE/network-engineering-suite/suite.py" "$@"
