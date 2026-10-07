#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "FIREWALL RULE VALIDATOR"
exec python3 "$BASE/firewall-rule-validator/validator.py" "$@"
