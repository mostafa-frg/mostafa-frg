#!/usr/bin/env python3
import argparse,csv
p=argparse.ArgumentParser();p.add_argument("csv");a=p.parse_args()
print("graph network {")
with open(a.csv,newline="") as f:
 for r in csv.DictReader(f):
  a1=r["a"].replace('"','');b=r["b"].replace('"','')
  print(f'  "{a1}" -- "{b}" [label="{r["link"]}"];')
print("}")
