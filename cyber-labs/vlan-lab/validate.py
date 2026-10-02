#!/usr/bin/env python3
import argparse,csv
def main():
 p=argparse.ArgumentParser();p.add_argument("csv");a=p.parse_args()
 with open(a.csv,newline="") as f:
  rows=list(csv.DictReader(f))
 vlans=set();seen={}
 for r in rows:
  mode=r["mode"].lower(); allowed={int(x) for x in r["allowed"].split(";") if x}
  if r["vlan"]: 
   v=int(r["vlan"]);vlans.add(v);seen.setdefault(v,[]).append(r["port"])
  if mode=="access" and r["allowed"]: print(f'[WARN] {r["port"]}: access port has trunk VLAN list')
  if mode=="trunk" and not allowed: print(f'[WARN] {r["port"]}: trunk has no allowed VLANs')
  if any(v<1 or v>4094 for v in allowed): print(f'[ERROR] {r["port"]}: invalid VLAN ID')
 for v,ports in seen.items():
  if len(ports)>1: print(f'[INFO] VLAN {v} appears on: {", ".join(ports)}')
if __name__=="__main__":main()
