#!/usr/bin/env python3
import argparse
import csv
from collections import Counter, defaultdict

p=argparse.ArgumentParser()
p.add_argument("csv")
args=p.parse_args()

events=list(csv.DictReader(open(args.csv,newline="",encoding="utf-8")))
by_device=defaultdict(list)
severity=Counter()

for e in events:
    by_device[e["device"]].append(e)
    severity[e["severity"].upper()] += 1

print("EVENTS", len(events))
print("SEVERITY", dict(severity))
for device, rows in sorted(by_device.items()):
    print(f"\n[{device}]")
    for e in sorted(rows, key=lambda x:x["timestamp"]):
        print(f'{e["timestamp"]} {e["severity"].upper():8} {e["message"]}')
