#!/usr/bin/env bash
set -e
BASE="$(cd "$(dirname "$0")/.." && pwd)"
source "$(dirname "$0")/banner.sh"
mosta_banner "HTTP SECURITY AUDITOR"
exec python3 "$BASE/http-security-auditor/auditor.py" "$@"
