#!/usr/bin/env python3
import argparse
import csv

REQUIRED = {"a", "b", "link"}

def esc(value):
    return value.replace("\\", "\\\\").replace('"', '\"').replace("\n", " ")

def main():
    p = argparse.ArgumentParser(description="Build an offline Graphviz network topology")
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

    print("graph network {")
    valid = 0
    for line, r in enumerate(rows, 2):
        a, b, link = (r.get(k, "").strip() for k in ("a", "b", "link"))
        if not a or not b:
            print(f"  // ERROR line {line}: endpoints are required")
            continue
        print(f'  "{esc(a)}" -- "{esc(b)}" [label="{esc(link)}"];')
        valid += 1
    print("}")
    print(f"// Valid links: {valid}/{len(rows)}")

if __name__ == "__main__":
    main()
