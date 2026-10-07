#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("DNS & DHCP LAB")
except Exception:
    pass
import argparse
import json
import socket
import time

def serve(host: str, port: int) -> None:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.settimeout(1.0)
        sock.bind((host, port))
        print(f"DNS lab listening on {host}:{port}")
        try:
            while True:
                try:
                    data, addr = sock.recvfrom(4096)
                except socket.timeout:
                    continue
                reply = {"source": addr[0], "bytes": len(data), "received": time.time()}
                sock.sendto(json.dumps(reply).encode("utf-8"), addr)
                print(reply)
        except KeyboardInterrupt:
            print("\nStopped.")

def main():
    p = argparse.ArgumentParser(description="Local UDP transport lab; not a real DNS/DHCP server.")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=53535)
    a = p.parse_args()
    if not 1 <= a.port <= 65535:
        p.error("--port must be 1-65535")
    if not a.host.strip():
        p.error("--host cannot be empty")
    try:
        serve(a.host, a.port)
    except OSError as exc:
        p.error(f"cannot start UDP lab: {exc}")

if __name__ == "__main__":
    main()
