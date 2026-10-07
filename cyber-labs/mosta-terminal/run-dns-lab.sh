#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$BASE/mosta-terminal/banner.sh"
mosta_banner "DNS & DHCP LAB"
exec python3 "$BASE/dns-dhcp-lab/dns_lab.py" "$@"
