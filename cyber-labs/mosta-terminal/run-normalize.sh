#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "LOG NORMALIZER"
exec python3 "$BASE/log-normalizer/log_normalizer.py" "$@"
