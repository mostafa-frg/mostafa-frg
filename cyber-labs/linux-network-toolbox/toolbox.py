#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("LINUX NETWORK TOOLBOX")
except Exception:
    pass
import argparse
import platform
import socket
import subprocess

def run(cmd):
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT).strip()
    except FileNotFoundError:
        return f"unavailable: command not found: {cmd[0]}"
    except subprocess.CalledProcessError as e:
        return f"command failed ({e.returncode}): {e.output.strip()}"

def main():
    p=argparse.ArgumentParser(prog="MostaNet", description="Linux/Termux network diagnostics")
    s=p.add_subparsers(dest="cmd", required=True)
    s.add_parser("interfaces")
    s.add_parser("routes")
    d=s.add_parser("dns"); d.add_argument("host")
    t=s.add_parser("tcp"); t.add_argument("host"); t.add_argument("port",type=int)
    a=p.parse_args()

    print("\n========================================")
    print("                 MOSTA")
    print("            LINUX NETWORK TOOLBOX")
    print("========================================\n")

    if a.cmd=="interfaces":
        print(run(["ip","addr"]) if platform.system()!="Windows" else run(["ipconfig"]))
    elif a.cmd=="routes":
        print(run(["ip","route"]) if platform.system()!="Windows" else run(["route","print"]))
    elif a.cmd=="dns":
        try:
            print(socket.gethostbyname_ex(a.host))
        except socket.gaierror as e:
            raise SystemExit(f"DNS lookup failed: {e}")
    else:
        try:
            with socket.create_connection((a.host,a.port),timeout=3):
                print(f"[OK] TCP {a.host}:{a.port}")
        except OSError as e:
            raise SystemExit(f"[FAIL] TCP {a.host}:{a.port} - {e}")

if __name__=="__main__":
    main()
