#!/usr/bin/env python3
"""Normalize common security log lines into stable JSONL records."""
from __future__ import annotations
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("LOG NORMALIZER")
except Exception:
    pass
import argparse, json, re, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

SYSLOG_RE = re.compile(r"^(?P<ts>[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(?P<host>\S+)\s+(?P<process>[\w.-]+)(?:\[(?P<pid>\d+)\])?:\s*(?P<message>.*)$")
SSH_RE = re.compile(r"^(?P<action>Accepted|Failed)\s+(?P<method>\w+)\s+for\s+(?:(?:invalid user)\s+)?(?P<user>\S+)\s+from\s+(?P<src_ip>\S+)\s+port\s+(?P<port>\d+)")

MONTHS = {m: i for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), 1)}


def syslog_timestamp(text: str, year: int, tz_offset: float = 0.0):
    """Convert a syslog 'Mon DD HH:MM:SS' stamp to ISO-8601 UTC ('...Z'), or None if it is not a real date."""
    parts = text.split()
    try:
        hh, mm, ss = (int(x) for x in parts[2].split(":"))
        local = datetime(year, MONTHS[parts[0]], int(parts[1]), hh, mm, ss, tzinfo=timezone(timedelta(hours=tz_offset)))
    except (KeyError, ValueError, IndexError):
        return None
    return local.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _base(raw: str, source: str, line: int) -> dict[str, Any]:
    return {"schema_version":"1.0","timestamp":None,"source":source,"line":line,"host":None,"process":None,"pid":None,"event_type":"unknown","action":None,"user":None,"src_ip":None,"src_port":None,"message":raw}

def normalize_json(obj: dict[str, Any], source: str, line: int) -> dict[str, Any]:
    out = _base(json.dumps(obj, ensure_ascii=False), source, line)
    aliases = {
        "timestamp":("timestamp","ts","@timestamp","time"), "host":("host","hostname"),
        "process":("process","program","service"), "pid":("pid","process_id"),
        "event_type":("event_type","event","type"), "action":("action","operation"),
        "user":("user","username"), "src_ip":("src_ip","source_ip","client_ip","ip"),
        "src_port":("src_port","source_port","client_port"), "message":("message","msg")
    }
    for target, keys in aliases.items():
        for key in keys:
            if key in obj:
                out[target] = obj[key]
                break
    return out

def normalize_line(raw: str, source: str, line: int, year: int = None, tz_offset: float = 0.0) -> dict[str, Any]:
    raw = raw.rstrip("\n")
    try:
        obj = json.loads(raw)
        if isinstance(obj, dict):
            return normalize_json(obj, source, line)
    except json.JSONDecodeError:
        pass
    out = _base(raw, source, line)
    match = SYSLOG_RE.match(raw)
    if match:
        out["timestamp"] = syslog_timestamp(match.group("ts"), year or datetime.now().year, tz_offset)
        out["host"] = match.group("host")
        out["process"] = match.group("process")
        out["pid"] = int(match.group("pid")) if match.group("pid") else None
        out["message"] = match.group("message")
        out["event_type"] = "syslog"
        ssh = SSH_RE.search(out["message"])
        if ssh:
            out["event_type"] = "authentication"
            out["action"] = ssh.group("action").lower()
            out["user"] = ssh.group("user")
            out["src_ip"] = ssh.group("src_ip")
            out["src_port"] = int(ssh.group("port"))
        return out
    ssh = SSH_RE.search(raw)
    if ssh:
        out["event_type"] = "authentication"
        out["action"] = ssh.group("action").lower()
        out["user"] = ssh.group("user")
        out["src_ip"] = ssh.group("src_ip")
        out["src_port"] = int(ssh.group("port"))
        return out
    if raw.strip():
        out["event_type"] = "text"
    return out

def normalize_file(path: Path, year: int = None, tz_offset: float = 0.0) -> list[dict[str, Any]]:
    records = []
    with path.open("r", encoding="utf-8") as handle:
        for line_no, raw in enumerate(handle, 1):
            if raw.strip():
                records.append(normalize_line(raw, str(path), line_no, year, tz_offset))
    return records

def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize JSON, JSONL, syslog, and SSH authentication logs into JSONL.")
    parser.add_argument("input", help="Input log file")
    parser.add_argument("-o", "--output", help="Write normalized JSONL to a file")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON records")
    parser.add_argument("--year", type=int, default=None, help="year for syslog timestamps (default: current year)")
    parser.add_argument("--tz-offset", type=float, default=0.0, help="hours from UTC for syslog timestamps (default 0)")
    args = parser.parse_args()
    path = Path(args.input)
    if not path.is_file():
        print(f"error: input file not found: {path}", file=sys.stderr)
        return 2
    records = normalize_file(path, args.year, args.tz_offset)
    lines = [json.dumps(r, ensure_ascii=False, indent=2 if args.pretty else None) for r in records]
    payload = "\n".join(lines) + ("\n" if lines else "")
    if args.output:
        Path(args.output).write_text(payload, encoding="utf-8")
    else:
        sys.stdout.write(payload)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
