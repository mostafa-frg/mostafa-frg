#!/usr/bin/env python3
"""Authorized TCP inventory scanner.

Default target is localhost. Use only against systems you own or are
explicitly authorized to assess.
"""

import argparse
import json
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

def parse_ports(spec):
    ports = set()
    if not spec or not spec.strip():
        raise ValueError("Port specification cannot be empty")
    for part in spec.split(","):
        part = part.strip()
        if not part:
            raise ValueError("Empty port entry")
        try:
            if "-" in part:
                start, end = map(int, part.split("-", 1))
                if start < 1 or end > 65535 or start > end:
                    raise ValueError
                ports.update(range(start, end + 1))
            else:
                port = int(part)
                if not 1 <= port <= 65535:
                    raise ValueError
                ports.add(port)
        except ValueError:
            raise ValueError(f"Invalid port specification: {part}")
    return sorted(ports)

def probe(target, port, timeout):
    result = {"port": port, "state": "closed"}
    try:
        with socket.create_connection((target, port), timeout=timeout) as sock:
            result["state"] = "open"
            sock.settimeout(0.4)
            try:
                data = sock.recv(128)
                if data:
                    result["banner"] = data.decode("utf-8", errors="replace").strip()
            except (socket.timeout, ConnectionError):
                pass
    except (socket.timeout, ConnectionRefusedError, OSError):
        pass
    return result

def main():
    parser = argparse.ArgumentParser(description="Safe TCP inventory scanner")
    parser.add_argument("--target", default="127.0.0.1")
    parser.add_argument("--ports", default="1-1024")
    parser.add_argument("--timeout", type=float, default=0.5)
    parser.add_argument("--workers", type=int, default=32)
    parser.add_argument("--output", default="report.json")
    args = parser.parse_args()
    if args.workers < 1 or args.workers > 128:
        raise SystemExit("--workers must be between 1 and 128")
    if args.timeout <= 0:
        raise SystemExit("--timeout must be greater than 0")
    try:
        ports = parse_ports(args.ports)
    except ValueError as exc:
        raise SystemExit(str(exc))
    if not args.target.strip():
        raise SystemExit("--target cannot be empty")
    try:
        socket.getaddrinfo(args.target, None)
    except socket.gaierror as exc:
        raise SystemExit(f"Target resolution failed: {exc}")
    results = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        jobs = [pool.submit(probe, args.target, p, args.timeout) for p in ports]
        for job in as_completed(jobs):
            results.append(job.result())
    results.sort(key=lambda x: x["port"])
    report = {
        "target": args.target,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "ports_requested": len(ports),
        "open_ports": [r for r in results if r["state"] == "open"],
    }
    try:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
    except OSError as exc:
        raise SystemExit(f"Cannot write report: {exc}")
    for item in report["open_ports"]:
        banner = f" | {item['banner']}" if item.get("banner") else ""
        print(f"[OPEN] {item['port']}{banner}")
    print(f"Saved {len(report['open_ports'])} open-port results to {args.output}")

if __name__ == "__main__":
    main()
