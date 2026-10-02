#!/usr/bin/env python3
import argparse,csv
p=argparse.ArgumentParser();p.add_argument("csv");a=p.parse_args()
rows=list(csv.DictReader(open(a.csv,newline="",encoding="utf-8")))
seen={}
for r in rows:
 seen.setdefault(r["bridge_id"],[]).append(r["switch"])
 try: pr=int(r["priority"])
 except ValueError: print(f'[ERROR] {r["switch"]}: invalid priority');continue
 if pr%4096: print(f'[WARN] {r["switch"]}: priority {pr} is not aligned to 4096')
for bid,sw in seen.items():
 if len(sw)>1: print(f'[DUPLICATE-BRIDGE-ID] {bid}: {", ".join(sw)}')
for r in rows: print(f'{r["switch"]:12} priority={r["priority"]:5} bridge={r["bridge_id"]}')
