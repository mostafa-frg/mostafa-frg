#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("SUBNET PLANNER")
except Exception:
    pass
import argparse
import ipaddress

p=argparse.ArgumentParser(description="Allocate sequential IPv4 subnets")
p.add_argument("network")
p.add_argument("prefix",nargs="+",type=int)
a=p.parse_args()

try:
    base=ipaddress.ip_network(a.network,strict=False)
except ValueError as e:
    raise SystemExit(f"Invalid network: {e}")
if base.version != 4:
    raise SystemExit("Only IPv4 networks are supported")
if any(prefix < base.prefixlen or prefix > 32 for prefix in a.prefix):
    raise SystemExit(f"Requested prefixes must be between /{base.prefixlen} and /32")

cursor=int(base.network_address)
for prefix in a.prefix:
    size=1<<(32-prefix)
    if cursor % size:
        cursor=((cursor//size)+1)*size
    candidate=ipaddress.ip_network((cursor,prefix),strict=False)
    if not candidate.subnet_of(base):
        raise SystemExit(f"Subnet /{prefix} does not fit in {base}")
    hosts=max(candidate.num_addresses-2,0)
    print(f"{candidate} hosts={hosts} range={candidate.network_address}..{candidate.broadcast_address}")
    cursor=int(candidate.broadcast_address)+1
