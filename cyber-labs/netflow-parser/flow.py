#!/usr/bin/env python3
import argparse,csv,collections
def main():
 p=argparse.ArgumentParser();p.add_argument("csv");a=p.parse_args()
 totals=collections.Counter();ports=collections.Counter();talkers=collections.Counter()
 with open(a.csv,newline="") as f:
  for r in csv.DictReader(f):
   b=int(r["bytes"]);talkers[r["src"]]+=b;ports[r["dst_port"]]+=b;totals[r["protocol"]]+=b
 print("Bytes by protocol:",dict(totals));print("Top sources:")
 for k,v in talkers.most_common(10):print(f"  {k:20} {v}")
 print("Top destination ports:")
 for k,v in ports.most_common(10):print(f"  {k:6} {v}")
if __name__=="__main__":main()
