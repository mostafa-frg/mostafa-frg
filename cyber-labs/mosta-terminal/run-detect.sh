#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "DETECTION RULES ENGINE"
exec python3 "$BASE/detection-rules-engine/engine.py" "$@"
