#!/usr/bin/env python3
import argparse
import json
import re
from collections import Counter
from pathlib import Path

PATTERN = re.compile(
    r"^(?P<ts>\w{3}\s+\d+\s[\d:]+).*sshd.*"
    r"(?:Failed password for (?:invalid user )?(?P<user>\S+) from (?P<ip>[0-9a-fA-F:.]+)|"
    r"Accepted \S+ for (?P<ok_user>\S+) from (?P<ok_ip>[0-9a-fA-F:.]+))"
)

def parse(path):
    events = []
    for line in Path(path).read_text(errors="replace").splitlines():
        match = PATTERN.search(line)
        if not match:
            continue
        failed = bool(match.group("ip"))
        events.append({
            "timestamp": match.group("ts"),
            "source_ip": match.group("ip") or match.group("ok_ip"),
            "username": match.group("user") or match.group("ok_user"),
            "event": "failed_login" if failed else "successful_login",
        })
    return events

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("logfile")
    ap.add_argument("--threshold", type=int, default=5)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    events = parse(args.logfile)
    failures = [e for e in events if e["event"] == "failed_login"]
    counts = Counter(e["source_ip"] for e in failures)
    alerts = [
        {"source_ip": ip, "failed_attempts": count, "reason": "threshold_exceeded"}
        for ip, count in counts.items() if count >= args.threshold
    ]
    report = {
        "events_parsed": len(events),
        "failed_logins": len(failures),
        "unique_sources": len(counts),
        "alerts": sorted(alerts, key=lambda x: x["failed_attempts"], reverse=True),
    }
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"Parsed events: {report['events_parsed']}")
        print(f"Failed logins: {report['failed_logins']}")
        for alert in report["alerts"]:
            print(f"[ALERT] {alert['source_ip']} -> {alert['failed_attempts']} failures")

if __name__ == "__main__":
    main()
