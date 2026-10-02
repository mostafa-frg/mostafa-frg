#!/usr/bin/env python3
import argparse,re,collections
p=argparse.ArgumentParser();p.add_argument("log");a=p.parse_args()
sev=collections.Counter();dev=collections.Counter();msg=collections.Counter()
for line in open(a.log,encoding="utf-8",errors="ignore"):
 m=re.search(r'(?P<device>\S+)\s+%\w+-(?P<level>\d+)-\w+:\s*(?P<msg>.*)',line)
 if m: sev[m["level"]]+=1;dev[m["device"]]+=1;msg[m["msg"]]+=1
print("severity:",dict(sev));print("devices:",dict(dev))
print("top messages:")
for k,v in msg.most_common(10): print(v,k)
