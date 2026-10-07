#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("ROUTING LAB")
except Exception:
    pass
import argparse,csv,ipaddress
REQUIRED={"id","prefix","next_hop","metric"}
def main():
 p=argparse.ArgumentParser(description="Offline routing table validator"); p.add_argument("csv"); a=p.parse_args()
 try:
  with open(a.csv,newline="",encoding="utf-8") as f:
   reader=csv.DictReader(f); missing=REQUIRED-set(reader.fieldnames or [])
   if missing: raise SystemExit(f"Missing CSV columns: {', '.join(sorted(missing))}")
   rows=list(reader)
 except OSError as exc: raise SystemExit(f"Cannot read CSV: {exc}")
 if not rows: raise SystemExit("CSV contains no data rows")
 routes=[]
 for i,r in enumerate(rows,2):
  try:
   net=ipaddress.ip_network(r["prefix"].strip(),strict=False); nh=ipaddress.ip_address(r["next_hop"].strip()); metric=int(r["metric"])
   if metric<0: raise ValueError("metric must be non-negative")
   if nh.version!=net.version: raise ValueError("next-hop/address-family mismatch")
  except ValueError as exc: print(f"[ERROR] line {i}: {exc}"); continue
  rid=r["id"].strip()
  if not rid: print(f"[ERROR] line {i}: id is required"); continue
  routes.append((rid,net,nh,metric))
 for i,(rid,n,nh,metric) in enumerate(routes):
  for prid,pn,_,_ in routes[:i]:
   if n==pn: print(f"[DUPLICATE] {rid} and {prid}: {n}")
   elif n.overlaps(pn): print(f"[OVERLAP] {rid}: {n} overlaps {prid}: {pn}")
  print(f"{rid:8} {str(n):18} via {nh} metric={metric}")
if __name__=="__main__": main()
