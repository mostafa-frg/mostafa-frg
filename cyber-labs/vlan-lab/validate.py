#!/usr/bin/env python3
import argparse,csv
def vlan_set(value):
 result=set()
 for raw in (value or "").split(";"):
  raw=raw.strip()
  if not raw: continue
  try: value=int(raw)
  except ValueError: raise ValueError(f"invalid VLAN ID: {raw}")
  if not 1<=value<=4094: raise ValueError(f"invalid VLAN ID: {value}")
  result.add(value)
 return result
def main():
 p=argparse.ArgumentParser(description="Validate access/trunk VLAN CSV"); p.add_argument("csv"); a=p.parse_args()
 try:
  with open(a.csv,newline="",encoding="utf-8") as f:
   reader=csv.DictReader(f); fields=set(reader.fieldnames or []); required={"port","mode","allowed","vlan"}
   if not required.issubset(fields): raise SystemExit(f"CSV must contain columns: {', '.join(sorted(required-fields))}")
   rows=list(reader)
 except OSError as e: raise SystemExit(f"cannot read CSV: {e}")
 if not rows: raise SystemExit("CSV contains no data rows")
 seen={}
 for i,r in enumerate(rows,1):
  mode=(r.get("mode") or "").strip().lower()
  if mode not in {"access","trunk"}: raise SystemExit(f"line {i}: mode must be access or trunk")
  try: allowed=vlan_set(r.get("allowed",""))
  except ValueError as e: raise SystemExit(f"line {i}: {e}")
  raw_vlan=(r.get("vlan") or "").strip()
  if raw_vlan:
   try: v=int(raw_vlan)
   except ValueError: raise SystemExit(f"line {i}: invalid access VLAN: {raw_vlan}")
   if not 1<=v<=4094: raise SystemExit(f"line {i}: invalid VLAN ID: {v}")
   seen.setdefault(v,[]).append(r.get("port","?"))
  if mode=="access" and allowed: print(f'[WARN] {r["port"]}: access port has trunk VLAN list')
  if mode=="trunk" and not allowed: print(f'[WARN] {r["port"]}: trunk has no allowed VLANs')
  if mode=="trunk" and raw_vlan: print(f'[WARN] {r["port"]}: trunk has an access VLAN field')
 for v,ports in seen.items():
  if len(ports)>1: print(f'[INFO] VLAN {v} appears on: {", ".join(ports)}')
if __name__=="__main__": main()
