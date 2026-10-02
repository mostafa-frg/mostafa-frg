#!/usr/bin/env python3
import argparse,csv,ipaddress,collections
p=argparse.ArgumentParser();p.add_argument("csv");a=p.parse_args()
rows=list(csv.DictReader(open(a.csv,newline="",encoding="utf-8")))
ids=collections.defaultdict(list);nets={}
for r in rows:
 ids[r["router_id"]].append(r["router"])
 n=ipaddress.ip_network(r["network"],strict=False);nets.setdefault(str(n),[]).append(r["router"])
for rid,routers in ids.items():
 if len(routers)>1: print(f"[DUPLICATE-RID] {rid}: {', '.join(routers)}")
for n,routers in nets.items():
 if len(routers)>1: print(f"[SHARED-NET] {n}: {', '.join(routers)}")
for r in rows: print(f'{r["router"]:12} area={r["area"]:5} rid={r["router_id"]:15} net={r["network"]}')
