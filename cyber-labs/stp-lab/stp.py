#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("STP LAB")
except Exception:
    pass
import argparse
import csv

REQUIRED = {"switch", "priority", "bridge_id"}

def main():
    p = argparse.ArgumentParser(description="Offline STP consistency checker")
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

    seen = {}
    valid = 0
    for line, r in enumerate(rows, 2):
        switch, bridge = r.get("switch","").strip(), r.get("bridge_id","").strip()
        if not switch or not bridge or not r.get("priority","").strip():
            print(f"[ERROR] line {line}: switch, priority and bridge_id are required")
            continue
        try:
            pr = int(r["priority"])
        except ValueError:
            print(f"[ERROR] {switch}: invalid priority")
            continue
        if not 0 <= pr <= 61440:
            print(f"[ERROR] {switch}: priority must be 0-61440")
            continue
        if pr % 4096:
            print(f"[WARN] {switch}: priority {pr} is not aligned to 4096")
        seen.setdefault(bridge, []).append(switch)
        valid += 1

    for bid, switches in seen.items():
        if len(switches) > 1:
            print(f"[DUPLICATE-BRIDGE-ID] {bid}: {', '.join(switches)}")
    for r in rows:
        if r.get("switch","").strip():
            print(f'{r["switch"]:12} priority={r["priority"]:5} bridge={r["bridge_id"]}')
    print(f"Valid records: {valid}/{len(rows)}")

if __name__ == "__main__":
    main()
