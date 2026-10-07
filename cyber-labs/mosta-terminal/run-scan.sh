#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "NETWORK SECURITY LAB"
exec python3 "$BASE/network-security-lab/scanner.py" "$@"
