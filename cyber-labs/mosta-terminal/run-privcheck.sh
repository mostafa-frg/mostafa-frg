#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "PRIVILEGE CHECK"
exec python3 "$BASE/privilege-escalation-lab/check.py" "$@"
