#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("ACTIVE DIRECTORY AUDIT")
except Exception:
    pass
import argparse,csv
REQUIRED={"username","enabled","password_never_expires","admin"}
def main():
 p=argparse.ArgumentParser(description="Offline AD audit of exported account data"); p.add_argument("csv"); a=p.parse_args()
 try:
  with open(a.csv,newline="",encoding="utf-8") as f:
   reader=csv.DictReader(f); missing=REQUIRED-set(reader.fieldnames or [])
   if missing: raise SystemExit(f"Missing CSV columns: {', '.join(sorted(missing))}")
   rows=list(reader)
 except OSError as exc: raise SystemExit(f"Cannot read CSV: {exc}")
 if not rows: raise SystemExit("CSV contains no data rows")
 print(f"Accounts: {len(rows)}")
 for i,r in enumerate(rows,2):
  username=r.get("username","").strip() or "?"
  vals=[r.get(k,"").strip().lower() for k in ("enabled","password_never_expires","admin")]
  if any(v not in {"true","false"} for v in vals): print(f"[ERROR] line {i}: boolean fields must be true/false"); continue
  enabled,never,admin=vals; flags=[]
  if enabled=="true" and never=="true": flags.append("password-never-expires")
  if admin=="true": flags.append("privileged-account")
  if flags: print(f"[REVIEW] {username}: {', '.join(flags)}")
if __name__=="__main__": main()
