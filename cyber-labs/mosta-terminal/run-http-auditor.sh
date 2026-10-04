#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "HTTP SECURITY AUDITOR"
exec python3 "$BASE/http-security-auditor/auditor.py" "$@"
