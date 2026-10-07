#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "NETFLOW ANALYZER"
exec python3 "$BASE/netflow-parser/flow.py" "$@"
