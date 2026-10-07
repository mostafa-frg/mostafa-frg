#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("ACL POLICY LAB")
except Exception:
    pass
import argparse,csv,ipaddress
REQUIRED={"action","protocol","source","destination","port"}; ACTIONS={"allow","deny","permit","drop"}; PROTOCOLS={"tcp","udp","icmp","ip","any"}
def main():
 p=argparse.ArgumentParser(description="Offline ACL policy validator"); p.add_argument("csv"); a=p.parse_args()
 try:
  with open(a.csv,newline="",encoding="utf-8") as f:
   reader=csv.DictReader(f); fields=set(reader.fieldnames or [])
   if not REQUIRED.issubset(fields): raise SystemExit(f"Missing CSV columns: {', '.join(sorted(REQUIRED-fields))}")
   rows=list(reader)
 except OSError as exc: raise SystemExit(f"Cannot read CSV: {exc}")
 if not rows: raise SystemExit("CSV contains no data rows")
 seen=set()
 for i,r in enumerate(rows,2):
  action=r["action"].strip().lower(); proto=r["protocol"].strip().lower()
  if action not in ACTIONS: print(f"[ERROR] line {i}: invalid action '{r['action']}'"); continue
  if proto not in PROTOCOLS: print(f"[ERROR] line {i}: invalid protocol '{r['protocol']}'"); continue
  try: src=ipaddress.ip_network(r["source"].strip(),strict=False); dst=ipaddress.ip_network(r["destination"].strip(),strict=False)
  except ValueError as exc: print(f"[ERROR] line {i}: invalid network: {exc}"); continue
  if src.version!=dst.version: print(f"[ERROR] line {i}: source/destination address families differ"); continue
  port=r["port"].strip().lower()
  if port!="any":
   try: value=int(port); assert 1<=value<=65535
   except (ValueError,AssertionError): print(f"[ERROR] line {i}: port must be 1-65535 or any"); continue
  key=(action,proto,str(src),str(dst),port)
  if key in seen: print(f"[DUPLICATE] line {i}")
  seen.add(key)
  if src.prefixlen==0 or dst.prefixlen==0: print(f"[BROAD] line {i}: any source/destination")
  if r.get("log","").strip().lower() not in {"yes","true","1"}: print(f"[NO-LOG] line {i}: {action} {proto} {src}->{dst}:{port}")
  print(f"{i:03} {action:5} {proto:4} {src} -> {dst}:{port}")
if __name__=="__main__": main()
