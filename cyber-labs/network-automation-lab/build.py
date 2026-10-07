#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("NETWORK AUTOMATION LAB")
except Exception:
    pass
import argparse,json,ipaddress
from pathlib import Path
def build(d):
    out=[f"hostname {d['hostname']}","no ip http server","ip ssh version 2","service timestamps log datetime msec","ntp server 192.168.10.1"]
    for v in d["vlans"]: out += [f"vlan {v['id']}",f" name {v['name']}"," exit"]
    out += ["interface Vlan99",f" ip address {d['management_ip']}"," no shutdown"," exit",f"ip default-gateway {d['gateway']}","line vty 0 4"," transport input ssh"," login local"," exit"]
    for i in d["interfaces"]: out += [f"interface {i['name']}",f" description {i['description']}"," exit"]
    return "\n".join(out)+"\n"
def main():
    p=argparse.ArgumentParser(description="Build Cisco IOS-style config from offline inventory"); p.add_argument("inventory"); p.add_argument("--out",default="output"); a=p.parse_args()
    try: d=json.loads(Path(a.inventory).read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc: p.error(f"invalid inventory: {exc}")
    required={"hostname","management_ip","gateway","vlans","interfaces"}
    if not isinstance(d,dict) or (missing:=required-d.keys()): p.error(f"missing inventory fields: {', '.join(sorted(missing if isinstance(d,dict) else required))}")
    if not isinstance(d["vlans"],list) or not isinstance(d["interfaces"],list): p.error("vlans and interfaces must be lists")
    if not str(d["hostname"]).strip(): p.error("hostname cannot be empty")
    try:
        ipaddress.ip_interface(d["management_ip"]); ipaddress.ip_address(d["gateway"])
        for v in d["vlans"]:
            if not 1<=int(v["id"])<=4094 or not str(v["name"]).strip(): raise ValueError("invalid VLAN id/name")
        for i in d["interfaces"]:
            if not str(i["name"]).strip() or not str(i["description"]).strip(): raise ValueError("interface name/description cannot be empty")
    except (KeyError,TypeError,ValueError) as exc: p.error(f"invalid inventory data: {exc}")
    out=Path(a.out)
    try:
        out.mkdir(parents=True,exist_ok=True); path=out/f"{d['hostname']}.cfg"; path.write_text(build(d),encoding="utf-8")
    except OSError as exc: p.error(f"cannot write output: {exc}")
    print(path)
if __name__=="__main__": main()
