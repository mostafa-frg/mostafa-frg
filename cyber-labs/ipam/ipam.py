#!/usr/bin/env python3
import argparse,csv,ipaddress,os
DB="allocations.csv"
def load():
    if not os.path.exists(DB): return []
    with open(DB,newline="",encoding="utf-8") as f:return list(csv.DictReader(f))
def save(rows):
    with open(DB,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=["network","name","address"]);w.writeheader();w.writerows(rows)
def main():
    p=argparse.ArgumentParser();s=p.add_subparsers(dest="cmd",required=True)
    x=s.add_parser("init");x.add_argument("network")
    x=s.add_parser("add");x.add_argument("network");x.add_argument("name");x.add_argument("address",nargs="?")
    s.add_parser("list");a=p.parse_args();rows=load()
    if a.cmd=="init": print(ipaddress.ip_network(a.network,strict=False)); return
    if a.cmd=="list":
        for r in rows: print(f'{r["network"]:18} {r["address"]:15} {r["name"]}'); return
    n=ipaddress.ip_network(a.network,strict=False); used={ipaddress.ip_address(r["address"]) for r in rows if r["network"]==str(n)}
    ip=ipaddress.ip_address(a.address) if a.address else next((x for x in n.hosts() if x not in used),None)
    if ip is None or ip not in n or ip in used: raise SystemExit("address unavailable")
    rows.append({"network":str(n),"name":a.name,"address":str(ip)});save(rows);print(ip)
if __name__=="__main__":main()
