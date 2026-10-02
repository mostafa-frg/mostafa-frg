#!/usr/bin/env python3
import argparse,csv,ipaddress
def main():
 p=argparse.ArgumentParser();p.add_argument("csv");a=p.parse_args()
 with open(a.csv,newline="",encoding="utf-8") as f: rows=list(csv.DictReader(f))
 seen=set()
 for i,r in enumerate(rows,1):
  src=ipaddress.ip_network(r["source"],strict=False);dst=ipaddress.ip_network(r["destination"],strict=False)
  key=tuple(r[k] for k in ("action","protocol","source","destination","port"))
  if key in seen: print(f"[DUPLICATE] line {i}")
  seen.add(key)
  if src.prefixlen==0 or dst.prefixlen==0: print(f"[BROAD] line {i}: any source/destination")
  if r.get("log","").lower() not in ("yes","true","1"): print(f"[NO-LOG] line {i}: {r['action']} {r['protocol']} {src}->{dst}:{r['port']}")
  print(f"{i:03} {r['action']:5} {r['protocol']:4} {src} -> {dst}:{r['port']}")
if __name__=="__main__":main()
