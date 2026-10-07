#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("NETWORK INCIDENT TRIAGE")
except Exception:
    pass
import argparse
import csv
from collections import Counter, defaultdict

REQUIRED = {"timestamp", "device", "severity", "message"}

def main():
    p = argparse.ArgumentParser(description="Offline network incident triage")
    p.add_argument("csv")
    args = p.parse_args()
    try:
        with open(args.csv, newline="", encoding="utf-8") as f:
            events = list(csv.DictReader(f))
    except OSError as exc:
        p.error(f"cannot read CSV: {exc}")
    if not events:
        p.error("CSV contains no data rows")
    missing = REQUIRED - set(events[0])
    if missing:
        p.error(f"missing columns: {', '.join(sorted(missing))}")

    by_device = defaultdict(list)
    severity = Counter()
    valid = 0
    for line, e in enumerate(events, 2):
        if not all(e.get(k, "").strip() for k in REQUIRED):
            print(f"[ERROR] line {line}: all required fields must be non-empty")
            continue
        sev = e["severity"].strip().upper()
        if sev not in {"INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"}:
            print(f"[WARN] line {line}: unknown severity {sev}")
        by_device[e["device"].strip()].append(e)
        severity[sev] += 1
        valid += 1

    print("EVENTS", valid)
    print("SEVERITY", dict(severity))
    for device, rows in sorted(by_device.items()):
        print(f"\n[{device}]")
        for e in sorted(rows, key=lambda x: x["timestamp"]):
            print(f'{e["timestamp"]} {e["severity"].upper():8} {e["message"]}')

if __name__ == "__main__":
    main()
