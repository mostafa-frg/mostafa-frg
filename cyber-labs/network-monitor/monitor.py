#!/usr/bin/env python3
import argparse,csv,json,socket,time
def check(host,port,timeout):
 start=time.perf_counter()
 try:
  with socket.create_connection((host,port),timeout=timeout): ok=True; err=""
 except OSError as e: ok=False; err=str(e)
 return {"host":host,"port":port,"up":ok,"latency_ms":round((time.perf_counter()-start)*1000,2),"error":err}
p=argparse.ArgumentParser(description="Periodic TCP endpoint monitor"); p.add_argument("inventory"); p.add_argument("--interval",type=float,default=30); p.add_argument("--timeout",type=float,default=2); p.add_argument("--once",action="store_true"); p.add_argument("--out",default="events.jsonl"); a=p.parse_args()
if a.interval<0 or a.timeout<=0: raise SystemExit("interval must be >= 0 and timeout must be > 0")
try:
 with open(a.inventory,newline="",encoding="utf-8") as f:
  reader=csv.DictReader(f); fields=set(reader.fieldnames or []); required={"host","port"}
  if not required.issubset(fields): raise SystemExit("inventory must contain host,port columns")
  rows=list(reader)
except OSError as e: raise SystemExit(f"cannot read inventory: {e}")
if not rows: raise SystemExit("inventory contains no data rows")
for i,r in enumerate(rows,1):
 host=r.get("host","").strip()
 if not host: raise SystemExit(f"line {i}: host cannot be empty")
 try: port=int(r["port"])
 except (ValueError,TypeError): raise SystemExit(f"line {i}: invalid port")
 if not 1<=port<=65535: raise SystemExit(f"line {i}: invalid port")
while True:
 with open(a.out,"a",encoding="utf-8") as f:
  for r in rows:
   e={"ts":time.time(),**check(r["host"].strip(),int(r["port"]),a.timeout)}; f.write(json.dumps(e)+"\n"); print(e)
 if a.once: break
 time.sleep(a.interval)
