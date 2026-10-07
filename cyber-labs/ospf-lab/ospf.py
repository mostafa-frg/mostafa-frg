#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("OSPF LAB")
except Exception:
    pass
import argparse
import csv
import ipaddress
from collections import defaultdict

REQUIRED = {"router", "router_id", "area", "network"}

def main():
    p = argparse.ArgumentParser(description="Offline OSPF-style inventory consistency checker")
    p.add_argument("csv")
    args = p.parse_args()
    try:
        with open(args.csv, newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
    except OSError as exc:
        p.error(f"cannot read CSV: {exc}")
    if not rows:
        p.error("CSV contains no data rows")
    missing = REQUIRED - set(rows[0])
    if missing:
        p.error(f"missing columns: {', '.join(sorted(missing))}")

    ids = defaultdict(list)
    nets = defaultdict(list)
    valid = 0
    for line, r in enumerate(rows, 2):
        router, rid, area, network = (r.get(k, "").strip() for k in ("router", "router_id", "area", "network"))
        if not router or not rid or not area or not network:
            print(f"[ERROR] line {line}: router, router_id, area and network are required")
            continue
        try:
            ipaddress.ip_address(rid)
            net = ipaddress.ip_network(network, strict=False)
        except ValueError as exc:
            print(f"[ERROR] line {line}: invalid router_id/network: {exc}")
            continue
        ids[rid].append(router)
        nets[str(net)].append(router)
        valid += 1

    for rid, routers in ids.items():
        if len(routers) > 1:
            print(f"[DUPLICATE-RID] {rid}: {', '.join(routers)}")
    for net, routers in nets.items():
        if len(routers) > 1:
            print(f"[SHARED-NET] {net}: {', '.join(routers)}")
    for r in rows:
        if r.get("router","").strip() and r.get("network","").strip():
            print(f'{r["router"]:12} area={r["area"]:5} rid={r["router_id"]:15} net={r["network"]}')
    print(f"Valid records: {valid}/{len(rows)}")

if __name__ == "__main__":
    main()
