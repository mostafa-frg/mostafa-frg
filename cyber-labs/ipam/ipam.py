#!/usr/bin/env python3
import argparse,csv,ipaddress,os

DB=os.path.join(os.path.dirname(os.path.abspath(__file__)), "allocations.csv")
FIELDS=["network","name","address"]

def load():
    if not os.path.exists(DB):
        return []
    with open(DB,newline="",encoding="utf-8") as f:
        return list(csv.DictReader(f))

def save(rows):
    with open(DB,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)

def parse_network(value):
    try:
        return ipaddress.ip_network(value,strict=False)
    except ValueError as e:
        raise SystemExit(f"invalid network: {e}")

def main():
    p=argparse.ArgumentParser(description="Small CSV-backed IPv4 IPAM")
    s=p.add_subparsers(dest="cmd",required=True)
    x=s.add_parser("init"); x.add_argument("network")
    x=s.add_parser("add"); x.add_argument("network"); x.add_argument("name"); x.add_argument("address",nargs="?")
    s.add_parser("list")
    a=p.parse_args()
    rows=load()

    if a.cmd=="init":
        n=parse_network(a.network)
        if not os.path.exists(DB):
            save([])
        print(f"database={DB}")
        print(f"network={n}")
        return

    if a.cmd=="list":
        for r in rows:
            print(f'{r["network"]:18} {r["address"]:15} {r["name"]}')
        return

    n=parse_network(a.network)
    used=set()
    for r in rows:
        if r.get("network")==str(n):
            try: used.add(ipaddress.ip_address(r["address"]))
            except ValueError: raise SystemExit(f'invalid stored address: {r.get("address")}')
    if a.address:
        try: ip=ipaddress.ip_address(a.address)
        except ValueError as e: raise SystemExit(f"invalid address: {e}")
    else:
        ip=next((x for x in n.hosts() if x not in used),None)
    if ip is None or ip not in n or ip in used:
        raise SystemExit("address unavailable")
    if any(r.get("address")==str(ip) for r in rows):
        raise SystemExit("address already allocated in the database")
    rows.append({"network":str(n),"name":a.name,"address":str(ip)})
    save(rows)
    print(ip)

if __name__=="__main__":
    main()
