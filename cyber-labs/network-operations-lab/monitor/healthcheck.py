#!/usr/bin/env python3
import socket
import time

TARGETS = [("web01", 80), ("dns01", 53)]

def check(host, port, timeout=2):
    start = time.perf_counter()
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True, round((time.perf_counter() - start) * 1000, 2), ""
    except OSError as exc:
        return False, None, str(exc)

for host, port in TARGETS:
    ok, latency, error = check(host, port)
    state = "UP" if ok else "DOWN"
    suffix = f" latency_ms={latency}" if ok else f" error={error}"
    print(f"{state:4} {host}:{port}{suffix}")
