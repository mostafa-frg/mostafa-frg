#!/usr/bin/env python3
import argparse,re
RULES=[("TELNET_VTY",r"transport input telnet","Use SSH for VTY management"),("HTTP_SERVER",r"^\s*ip http server\s*$","Disable cleartext HTTP management"),("NO_SECRET",r"^\s*enable password\s+","Prefer enable secret"),("SNMP_PUBLIC",r"snmp-server community\s+(public|private)\b","Replace default SNMP communities")]
def main():
    ap=argparse.ArgumentParser(description="Offline network device configuration auditor"); ap.add_argument("config"); args=ap.parse_args()
    try: text=open(args.config,encoding="utf-8",errors="replace").read()
    except OSError as exc: ap.error(f"cannot read config: {exc}")
    findings=0
    for code,pattern,fix in RULES:
        if re.search(pattern,text,re.I|re.M): findings+=1; print(f"[FINDING] {code}: {fix}")
    if not findings: print("[OK] No configured checks triggered.")
    print(f"Findings: {findings}")
if __name__=="__main__": main()
