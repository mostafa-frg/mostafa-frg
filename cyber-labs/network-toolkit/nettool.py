#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("NETWORK TOOLKIT")
except Exception:
    pass
import argparse,csv,socket,time,ipaddress
from pathlib import Path
def subnet(value):
 try: n=ipaddress.ip_network(value,strict=False)
 except ValueError as exc: raise SystemExit(f"Invalid network: {exc}")
 if n.version!=4: raise SystemExit("Only IPv4 networks are supported")
 total=max(n.num_addresses-2,0) if n.prefixlen<=30 else (1 if n.prefixlen==31 else 0)
 print("Network:",n.network_address); print("Netmask:",n.netmask); print("Broadcast:",n.broadcast_address); print("Prefix:",n.prefixlen); print("Usable hosts:",total)
 if total: print("Host range:",n.network_address+1,"-",n.broadcast_address-1)
 elif n.prefixlen==31: print("Host range:",n.network_address,"-",n.broadcast_address)
 else: print("Host range: none")
def dns(name):
 name=name.strip()
 if not name: raise SystemExit("Hostname cannot be empty")
 start=time.perf_counter()
 try: answers=socket.getaddrinfo(name,None)
 except socket.gaierror as exc: raise SystemExit(f"DNS lookup failed: {exc}")
 print(f"Name: {name}"); print(f"Latency: {(time.perf_counter()-start)*1000:.2f} ms")
 for value in sorted({a[4][0] for a in answers}): print(value)
def tcp(host,port,timeout):
 if not host.strip(): raise SystemExit("Host cannot be empty")
 if not 1<=port<=65535: raise SystemExit("Port must be between 1 and 65535")
 if timeout<=0: raise SystemExit("Timeout must be greater than 0")
 start=time.perf_counter()
 try:
  with socket.create_connection((host,port),timeout=timeout): state="reachable"
 except (socket.gaierror,OSError) as exc: state=f"unreachable ({exc})"
 print(f"{host}:{port} -> {state} ({(time.perf_counter()-start)*1000:.2f} ms)")
def inventory(path):
 try:
  with Path(path).open(newline="",encoding="utf-8") as f:
   reader=csv.DictReader(f); fields=set(reader.fieldnames or [])
   if "status" not in fields: raise SystemExit("Inventory CSV must contain a 'status' column")
   rows=list(reader)
 except OSError as exc: raise SystemExit(f"Cannot read inventory: {exc}")
 if not rows: raise SystemExit("Inventory contains no data rows")
 for i,r in enumerate(rows,2):
  if not r.get("status","").strip(): raise SystemExit(f"line {i}: status cannot be empty")
 online=sum(r["status"].strip().lower() in {"up","online","ok"} for r in rows)
 print(f"Devices: {len(rows)}"); print(f"Reported healthy: {online}"); print(f"Other states: {len(rows)-online}")
p=argparse.ArgumentParser(description="Network administration toolkit"); sub=p.add_subparsers(dest="cmd",required=True)
a=sub.add_parser("subnet"); a.add_argument("value")
a=sub.add_parser("dns"); a.add_argument("name")
a=sub.add_parser("tcp"); a.add_argument("host"); a.add_argument("port",type=int); a.add_argument("--timeout",type=float,default=2)
a=sub.add_parser("inventory"); a.add_argument("csv")
args=p.parse_args()
if args.cmd=="subnet": subnet(args.value)
elif args.cmd=="dns": dns(args.name)
elif args.cmd=="tcp": tcp(args.host,args.port,args.timeout)
else: inventory(args.csv)
