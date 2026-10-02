#!/usr/bin/env python3
import argparse,socket,json,time

def serve(host,port):
 s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.bind((host,port))
 print(f"DNS lab listening on {host}:{port}")
 try:
  while True:
   data,addr=s.recvfrom(4096)
   reply={"source":addr[0],"bytes":len(data),"received":time.time()}
   s.sendto(json.dumps(reply).encode(),addr)
   print(reply)
 except KeyboardInterrupt: pass
 finally: s.close()

p=argparse.ArgumentParser(); p.add_argument("--host",default="127.0.0.1"); p.add_argument("--port",type=int,default=53535)
a=p.parse_args(); serve(a.host,a.port)
