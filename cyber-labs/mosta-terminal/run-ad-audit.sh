#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "ACTIVE DIRECTORY AUDIT"
exec python3 "$BASE/active-directory-security-lab/audit.py" "$@"
