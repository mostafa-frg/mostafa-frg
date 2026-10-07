#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("FIREWALL RULE VALIDATOR")
except Exception:
    pass
import argparse,csv,ipaddress
from dataclasses import dataclass
@dataclass
class Rule: rid:str; action:str; proto:str; src:object; dst:object; port:str
def net(v): return ipaddress.ip_network(v.strip(),strict=False)
def scope_contains(a,b): return b.subnet_of(a)
def port_matches(a,b): return a==b or a=="any" or b=="any"
def main():
 p=argparse.ArgumentParser(description="Offline firewall rule validator"); p.add_argument("csv"); a=p.parse_args(); required={"id","action","protocol","source","destination","dport"}
 try:
  with open(a.csv,newline="",encoding="utf-8") as f:
   reader=csv.DictReader(f); missing=required-set(reader.fieldnames or [])
   if missing: raise SystemExit(f"Missing CSV columns: {', '.join(sorted(missing))}")
   raw=list(reader)
 except OSError as exc: raise SystemExit(f"Cannot read CSV: {exc}")
 if not raw: raise SystemExit("CSV contains no data rows")
 rules=[]
 for i,r in enumerate(raw,2):
  try:
   src,dst=net(r["source"]),net(r["destination"])
   if src.version!=dst.version: raise ValueError("source/destination address families differ")
   action=r["action"].strip().lower(); proto=r["protocol"].strip().lower(); port=r["dport"].strip().lower()
   if action not in {"allow","deny","permit","drop"}: raise ValueError(f"invalid action '{action}'")
   if proto not in {"tcp","udp","icmp","ip","any"}: raise ValueError(f"invalid protocol '{proto}'")
   if port!="any" and not 1<=int(port)<=65535: raise ValueError("port must be 1-65535 or any")
   rules.append(Rule(r["id"].strip(),action,proto,src,dst,port))
  except (ValueError,KeyError) as exc: print(f"[ERROR] line {i}: {exc}")
 for i,r in enumerate(rules):
  if r.src.prefixlen==0 or r.dst.prefixlen==0: print(f"[BROAD] {r.rid}: any/any scope")
  for prev in rules[:i]:
   scope=scope_contains(prev.src,r.src) and scope_contains(prev.dst,r.dst) and (prev.proto==r.proto or prev.proto=="any") and port_matches(prev.port,r.port)
   if scope and prev.action==r.action: print(f"[SHADOWED-SCOPE] {r.rid} is covered by {prev.rid}")
   elif scope and prev.action!=r.action: print(f"[CONFLICT] {r.rid} overlaps earlier {prev.rid}")
   if (r.action,r.proto,r.src,r.dst,r.port)==(prev.action,prev.proto,prev.src,prev.dst,prev.port): print(f"[DUPLICATE] {r.rid} duplicates {prev.rid}")
if __name__=="__main__": main()
