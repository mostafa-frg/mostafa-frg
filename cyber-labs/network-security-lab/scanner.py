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
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            start, end = map(int, part.split("-", 1))
            if start < 1 or end > 65535 or start > end:
                raise ValueError("Invalid port range")
            ports.update(range(start, end + 1))
        else:
            port = int(part)
            if not 1 <= port <= 65535:
                raise ValueError("Invalid port")
            ports.add(port)
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

    ports = parse_ports(args.ports)
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
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    for item in report["open_ports"]:
        banner = f" | {item['banner']}" if item.get("banner") else ""
        print(f"[OPEN] {item['port']}{banner}")

    print(f"Saved {len(report['open_ports'])} open-port results to {args.output}")


if __name__ == "__main__":
    main()
