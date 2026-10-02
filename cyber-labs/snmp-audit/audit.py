#!/usr/bin/env python3
import argparse,re
p=argparse.ArgumentParser();p.add_argument("config");a=p.parse_args()
text=open(a.config,encoding="utf-8",errors="ignore").read()
checks=[(r'community\s+(public|private)\b',"default community string"),(r'\bv1\b',"SNMPv1 configured"),(r'\bv2c\b',"SNMPv2c configured")]
for pat,msg in checks:
 if re.search(pat,text,re.I): print("[FINDING]",msg)
print("[INFO] SNMP config audit complete")
