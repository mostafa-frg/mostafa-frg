#!/usr/bin/env python3
import argparse,ipaddress
p=argparse.ArgumentParser(); p.add_argument("network"); p.add_argument("prefix",nargs="+",type=int); a=p.parse_args()
base=ipaddress.ip_network(a.network,strict=False)
cursor=int(base.network_address)
for prefix in a.prefix:
 size=1<<(32-prefix)
 candidate=ipaddress.ip_network((cursor,prefix),strict=False)
 if not candidate.subnet_of(base): raise SystemExit(f"Subnet /{prefix} does not fit in {base}")
 hosts=max(candidate.num_addresses-2,0)
 print(f"{candidate} hosts={hosts} range={candidate.network_address}..{candidate.broadcast_address}")
 cursor=int(candidate.broadcast_address)+1
