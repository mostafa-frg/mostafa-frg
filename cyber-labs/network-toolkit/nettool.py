#!/usr/bin/env python3
import argparse, csv, socket, time, ipaddress
from pathlib import Path

def subnet(value):
    n=ipaddress.ip_network(value, strict=False)
    hosts=list(n.hosts())
    print("Network:", n.network_address)
    print("Netmask:", n.netmask)
    print("Broadcast:", n.broadcast_address)
    print("Prefix:", n.prefixlen)
    print("Usable hosts:", len(hosts))
    if hosts: print("Host range:", hosts[0], "-", hosts[-1])

def dns(name):
    start=time.perf_counter()
    answers=socket.getaddrinfo(name,None)
    elapsed=(time.perf_counter()-start)*1000
    values=sorted({a[4][0] for a in answers})
    print(f"Name: {name}")
    print(f"Latency: {elapsed:.2f} ms")
    for value in values: print(value)

def tcp(host,port,timeout):
    start=time.perf_counter()
    s=socket.socket(socket.AF_INET,socket.SOCK_STREAM); s.settimeout(timeout)
    try:
        s.connect((host,port)); state="reachable"
    except OSError as e:
        state=f"unreachable ({e})"
    finally: s.close()
    print(f"{host}:{port} -> {state} ({(time.perf_counter()-start)*1000:.2f} ms)")

def inventory(path):
    rows=list(csv.DictReader(Path(path).open(newline="",encoding="utf-8")))
    online=sum(r.get("status","").lower() in {"up","online","ok"} for r in rows)
    print(f"Devices: {len(rows)}")
    print(f"Reported healthy: {online}")
    print(f"Other states: {len(rows)-online}")

p=argparse.ArgumentParser(description="Network administration toolkit")
sub=p.add_subparsers(dest="cmd",required=True)
a=sub.add_parser("subnet"); a.add_argument("value")
a=sub.add_parser("dns"); a.add_argument("name")
a=sub.add_parser("tcp"); a.add_argument("host"); a.add_argument("port",type=int); a.add_argument("--timeout",type=float,default=2)
a=sub.add_parser("inventory"); a.add_argument("csv")
args=p.parse_args()
if args.cmd=="subnet": subnet(args.value)
elif args.cmd=="dns": dns(args.name)
elif args.cmd=="tcp": tcp(args.host,args.port,args.timeout)
else: inventory(args.csv)
