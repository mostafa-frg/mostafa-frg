#!/usr/bin/env python3
import argparse
import csv
import ipaddress

REQUIRED = {"id", "type", "inside", "outside"}

def main():
    p = argparse.ArgumentParser(description="Offline NAT policy validator")
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

    seen = set()
    for line, r in enumerate(rows, 2):
        ident, typ = r["id"].strip(), r["type"].strip().lower()
        if not ident or not typ:
            print(f"[ERROR] line {line}: id and type are required")
            continue
        if typ not in {"static", "dynamic", "pat", "nat", "overload"}:
            print(f"[WARN] {ident}: unrecognized NAT type {r['type']!r}")
        try:
            src = ipaddress.ip_network(r["inside"].strip(), strict=False)
            pool = ipaddress.ip_network(r["outside"].strip(), strict=False)
        except ValueError as exc:
            print(f"[ERROR] {ident}: {exc}")
            continue
        key = (str(src), str(pool), typ)
        if key in seen:
            print(f"[DUPLICATE] {ident}")
        seen.add(key)
        if src.version != pool.version:
            print(f"[ERROR] {ident}: address family mismatch")
        print(f'{ident:8} {typ:8} {src} -> {pool}')

if __name__ == "__main__":
    main()
