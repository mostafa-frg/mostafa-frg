#!/usr/bin/env python3
import argparse,csv,ipaddress
from dataclasses import dataclass

@dataclass
class Rule:
    rid:str; action:str; proto:str; src:object; dst:object; port:str

def net(v):
    return ipaddress.ip_network(v,strict=False)

def covers(a,b):
    return a.subnet_of(b)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("csv")
    a=p.parse_args()
    rules=[]
    with open(a.csv,newline="",encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rules.append(Rule(r["id"],r["action"].lower(),r["protocol"].lower(),net(r["source"]),net(r["destination"]),r["dport"]))
    for i,r in enumerate(rules):
        if r.src.prefixlen==0 or r.dst.prefixlen==0: print(f"[BROAD] {r.rid}: any/any scope")
        for prev in rules[:i]:
            same_scope=covers(r.src,prev.src) and covers(r.dst,prev.dst) and (r.proto==prev.proto or prev.proto=="any") and (r.port==prev.port or prev.port=="any")
            if same_scope and prev.action==r.action: print(f"[SHADOWED-SCOPE] {r.rid} is covered by {prev.rid}")
            elif same_scope and prev.action!=r.action: print(f"[CONFLICT] {r.rid} overlaps earlier {prev.rid}")
        for other in rules[:i]:
            if (r.action,r.proto,r.src,r.dst,r.port)==(other.action,other.proto,other.src,other.dst,other.port):
                print(f"[DUPLICATE] {r.rid} duplicates {other.rid}")
if __name__=="__main__": main()
