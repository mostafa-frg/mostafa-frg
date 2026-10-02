#!/usr/bin/env python3
import argparse,os,stat
def main():
 p=argparse.ArgumentParser(description="Offline local privilege-boundary checks")
 p.add_argument("--path",action="append",default=[]); a=p.parse_args()
 paths=a.path or ["/etc/passwd","/etc/shadow","/etc/sudoers"]
 for path in paths:
  try:
   st=os.stat(path); mode=stat.S_IMODE(st.st_mode)
   print(f"{path}: owner={st.st_uid} mode={oct(mode)}")
   if mode & stat.S_IWOTH: print("  [REVIEW] world-writable")
  except OSError as e: print(f"{path}: {e}")
if __name__=="__main__": main()
