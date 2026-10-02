#!/usr/bin/env python3
import argparse
import csv
import ipaddress

def validate_ip(value):
    ip = ipaddress.ip_interface(value)
    print(f"address={ip.ip}")
    print(f"network={ip.network}")
    print(f"prefix={ip.network.prefixlen}")
    print(f"usable_hosts={max(ip.network.num_addresses - 2, 0)}")

def route_lookup(address, filename):
    target = ipaddress.ip_address(address)
    matches = []
    with open(filename, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            net = ipaddress.ip_network(row["prefix"], strict=False)
            if target in net:
                matches.append((net.prefixlen, row))
    for _, row in sorted(matches, reverse=True):
        print(f"match {row['prefix']} via {row['next_hop']} metric={row['metric']}")

def inventory(filename):
    with open(filename, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"devices={len(rows)}")
    for row in rows:
        print(f"{row['name']:12} {row['ip']:15} {row['role']}")

p = argparse.ArgumentParser()
sub = p.add_subparsers(dest="cmd", required=True)
a = sub.add_parser("validate-ip"); a.add_argument("value")
b = sub.add_parser("route-lookup"); b.add_argument("address"); b.add_argument("file")
c = sub.add_parser("summarize-inventory"); c.add_argument("file")
args = p.parse_args()

if args.cmd == "validate-ip": validate_ip(args.value)
elif args.cmd == "route-lookup": route_lookup(args.address, args.file)
else: inventory(args.file)
