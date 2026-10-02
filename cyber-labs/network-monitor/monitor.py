#!/usr/bin/env python3
import argparse,csv,json,socket,time
def check(host,port,timeout):
 s=socket.socket(); s.settimeout(timeout); start=time.perf_counter()
 try: s.connect((host,port)); ok=True; err=""
 except OSError as e: ok=False; err=str(e)
 finally: s.close()
 return {"host":host,"port":port,"up":ok,"latency_ms":round((time.perf_counter()-start)*1000,2),"error":err}
p=argparse.ArgumentParser(); p.add_argument("inventory"); p.add_argument("--interval",type=int,default=30); p.add_argument("--once",action="store_true"); p.add_argument("--out",default="events.jsonl"); a=p.parse_args()
rows=list(csv.DictReader(open(a.inventory,encoding="utf-8")))
while True:
 with open(a.out,"a",encoding="utf-8") as f:
  for r in rows:
   e={"ts":time.time(),**check(r["host"],int(r["port"]),2)}; f.write(json.dumps(e)+"\n"); print(e)
 if a.once: break
 time.sleep(a.interval)
