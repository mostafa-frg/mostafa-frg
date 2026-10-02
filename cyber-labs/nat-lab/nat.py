#!/usr/bin/env python3
import argparse,csv,ipaddress
p=argparse.ArgumentParser();p.add_argument("csv");a=p.parse_args()
rows=list(csv.DictReader(open(a.csv,newline="",encoding="utf-8")));seen=set()
for r in rows:
 try:
  src=ipaddress.ip_network(r["inside"],strict=False);pool=ipaddress.ip_network(r["outside"],strict=False)
 except ValueError as e: print(f'[ERROR] {r["id"]}: {e}');continue
 key=(str(src),str(pool),r["type"])
 if key in seen: print(f'[DUPLICATE] {r["id"]}')
 seen.add(key)
 if src.version!=pool.version: print(f'[ERROR] {r["id"]}: address family mismatch')
 print(f'{r["id"]:8} {r["type"]:8} {src} -> {pool}')
