#!/usr/bin/env python3
import argparse,json,os
def build(d):
 out=[f"hostname {d['hostname']}","no ip http server","ip ssh version 2"]
 out += ["service timestamps log datetime msec","ntp server 192.168.10.1"]
 for v in d["vlans"]: out += [f"vlan {v['id']}",f" name {v['name']}"," exit"]
 out += [f"interface Vlan99",f" ip address {d['management_ip']}"," no shutdown"," exit"]
 out += [f"ip default-gateway {d['gateway']}","line vty 0 4"," transport input ssh"," login local"," exit"]
 for i in d["interfaces"]: out += [f"interface {i['name']}",f" description {i['description']}"," exit"]
 return "\n".join(out)+"\n"
p=argparse.ArgumentParser(); p.add_argument("inventory"); p.add_argument("--out",default="output"); a=p.parse_args()
d=json.load(open(a.inventory,encoding="utf-8")); os.makedirs(a.out,exist_ok=True)
path=os.path.join(a.out,d["hostname"]+".cfg"); open(path,"w",encoding="utf-8").write(build(d)); print(path)
