#!/usr/bin/env python3
import argparse,platform,socket,subprocess

def run(cmd):
    try: return subprocess.check_output(cmd,text=True,stderr=subprocess.STDOUT).strip()
    except Exception as e: return f"unavailable: {e}"

p=argparse.ArgumentParser(prog="MostaNet")
s=p.add_subparsers(dest="cmd",required=True)
s.add_parser("interfaces"); s.add_parser("routes")
d=s.add_parser("dns"); d.add_argument("host")
t=s.add_parser("tcp"); t.add_argument("host"); t.add_argument("port",type=int)
a=p.parse_args()

if a.cmd=="interfaces":
    print(run(["ip","addr"]) if platform.system()!="Windows" else run(["ipconfig"]))
elif a.cmd=="routes":
    print(run(["ip","route"]) if platform.system()!="Windows" else run(["route","print"]))
elif a.cmd=="dns":
    print(socket.gethostbyname_ex(a.host))
else:
    with socket.create_connection((a.host,a.port),timeout=3): print(f"[OK] TCP {a.host}:{a.port}")
