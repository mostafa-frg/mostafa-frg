#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "SUBNET PLANNER"
exec python3 "$BASE/subnet-planner/planner.py" "$@"
