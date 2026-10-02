#!/usr/bin/env bash
set -e
BASE="$(cd "$(dirname "$0")/.." && pwd)"
source "$(dirname "$0")/banner.sh"
mosta_banner "ROUTING LAB"
exec python3 "$BASE/routing-lab/routing.py" "$@"
