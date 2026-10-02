#!/usr/bin/env python3
import argparse,csv
def main():
 p=argparse.ArgumentParser(description="Offline AD audit of exported account data")
 p.add_argument("csv"); a=p.parse_args()
 rows=list(csv.DictReader(open(a.csv,encoding="utf-8")))
 print(f"Accounts: {len(rows)}")
 for r in rows:
  flags=[]
  if r.get("enabled","").lower()=="true" and r.get("password_never_expires","").lower()=="true": flags.append("password-never-expires")
  if r.get("admin","").lower()=="true": flags.append("privileged-account")
  if flags: print(f"[REVIEW] {r.get('username','?')}: {', '.join(flags)}")
if __name__=="__main__": main()
