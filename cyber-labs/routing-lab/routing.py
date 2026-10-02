#!/usr/bin/env python3
import argparse,csv,ipaddress
def main():
 p=argparse.ArgumentParser();p.add_argument("csv");a=p.parse_args()
 routes=[]
 with open(a.csv,newline="",encoding="utf-8") as f:
  for r in csv.DictReader(f):
   net=ipaddress.ip_network(r["prefix"],strict=False)
   nh=ipaddress.ip_address(r["next_hop"])
   routes.append((r["id"],net,nh,r["metric"]))
 for i,(rid,n,nh,m) in enumerate(routes):
  if nh.version!=n.version: print(f"[ERROR] {rid}: address-family mismatch")
  for prid,pn,_,_ in routes[:i]:
   if n==pn: print(f"[DUPLICATE] {rid} and {prid}: {n}")
   elif n.overlaps(pn): print(f"[OVERLAP] {rid}: {n} overlaps {prid}: {pn}")
  print(f"{rid:8} {n!s:18} via {nh} metric={m}")
if __name__=="__main__":main()
