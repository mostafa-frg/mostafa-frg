#!/usr/bin/env python3
import argparse, csv, ipaddress

def validate_ip(value):
    try:
        ip = ipaddress.ip_interface(value)
    except ValueError as exc:
        raise SystemExit(f"Invalid IP/interface: {exc}")
    print(f"address={ip.ip}")
    print(f"network={ip.network}")
    print(f"prefix={ip.network.prefixlen}")
    print(f"usable_hosts={max(ip.network.num_addresses - 2, 0)}")

def route_lookup(address, filename):
    try:
        target = ipaddress.ip_address(address)
    except ValueError as exc:
        raise SystemExit(f"Invalid target address: {exc}")
    try:
        with open(filename, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            required = {"prefix", "next_hop", "metric"}
            missing = required - set(reader.fieldnames or [])
            if missing:
                raise SystemExit(f"Missing CSV columns: {', '.join(sorted(missing))}")
            matches = []
            for row in reader:
                try:
                    net = ipaddress.ip_network(row["prefix"].strip(), strict=False)
                    if net.version == target.version and target in net:
                        matches.append((net.prefixlen, row))
                except ValueError as exc:
                    print(f"[ERROR] invalid route {row.get('prefix','?')}: {exc}")
    except OSError as exc:
        raise SystemExit(f"Cannot read route file: {exc}")
    for _, row in sorted(matches, key=lambda item: item[0], reverse=True):
        print(f"match {row['prefix']} via {row['next_hop']} metric={row['metric']}")
    if not matches:
        print("no route match")

def inventory(filename):
    try:
        with open(filename, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            required = {"name", "ip", "role"}
            missing = required - set(reader.fieldnames or [])
            if missing:
                raise SystemExit(f"Missing CSV columns: {', '.join(sorted(missing))}")
            rows = list(reader)
    except OSError as exc:
        raise SystemExit(f"Cannot read inventory: {exc}")
    print(f"devices={len(rows)}")
    for i, row in enumerate(rows, 1):
        try:
            ipaddress.ip_address(row["ip"].strip())
        except ValueError as exc:
            print(f"[ERROR] line {i}: invalid IP: {exc}")
            continue
        print(f"{row['name']:12} {row['ip']:15} {row['role']}")

p = argparse.ArgumentParser(description="Network engineering utilities")
sub = p.add_subparsers(dest="cmd", required=True)
a = sub.add_parser("validate-ip"); a.add_argument("value")
b = sub.add_parser("route-lookup"); b.add_argument("address"); b.add_argument("file")
c = sub.add_parser("summarize-inventory"); c.add_argument("file")
args = p.parse_args()

if args.cmd == "validate-ip":
    validate_ip(args.value)
elif args.cmd == "route-lookup":
    route_lookup(args.address, args.file)
else:
    inventory(args.file)
