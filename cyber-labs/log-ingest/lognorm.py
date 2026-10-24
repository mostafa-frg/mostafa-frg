#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("LOG INGEST")
except Exception:
    pass
"""Log Ingest: turn raw logs into structured JSONL, then summarize them.

  normalize FILE [--format auto|auth|access|syslog]   -> JSONL on stdout (pipe it to the detection engine)
  report    FILE.jsonl [--html OUT.html] [--top N]    -> summary of normalized events

Supported inputs: OpenSSH auth logs, Apache/Nginx combined access logs, generic syslog.
Offline and read-only. Banner output goes to stderr, so stdout stays pure JSONL.
"""
import argparse
import html
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone, timedelta
from pathlib import Path

MONTHS = {m: i for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), 1)}
SYSLOG = re.compile(r"^(?P<mon>[A-Z][a-z]{2})\s+(?P<day>\d{1,2}) (?P<time>\d\d:\d\d:\d\d) (?P<host>\S+) (?P<prog>[^\s:\[]+)(?:\[(?P<pid>\d+)\])?: (?P<msg>.*)$")
ACCESS = re.compile(r'^(?P<ip>\S+) \S+ (?P<user>\S+) \[(?P<ts>[^\]]+)\] "(?P<method>[A-Z]+) (?P<path>\S+)(?: (?P<proto>[^"]*))?" (?P<status>\d{3}) (?P<bytes>\d+|-)(?: "(?P<ref>[^"]*)" "(?P<ua>[^"]*)")?')
SSH_FAIL = re.compile(r"Failed (?P<method>\S+) for (?:invalid user )?(?P<user>\S+) from (?P<ip>\S+) port (?P<port>\d+)")
SSH_OK = re.compile(r"Accepted (?P<method>\S+) for (?P<user>\S+) from (?P<ip>\S+) port (?P<port>\d+)")
SSH_INVALID = re.compile(r"Invalid user (?P<user>\S*) from (?P<ip>\S+)(?: port (?P<port>\d+))?")


def syslog_time(m, year, offset):
    try:
        dt = datetime(year, MONTHS[m["mon"]], int(m["day"]), *map(int, m["time"].split(":")), tzinfo=timezone(timedelta(hours=offset)))
    except (ValueError, KeyError):
        return None
    return dt.timestamp()


def parse_auth(line, year, offset):
    m = SYSLOG.match(line)
    if not m or not m["prog"].startswith("sshd"):
        return None
    msg, base = m["msg"], {"time": syslog_time(m, year, offset), "host": m["host"], "source": "auth"}
    for rx, name in ((SSH_FAIL, "ssh_failed"), (SSH_OK, "ssh_accepted"), (SSH_INVALID, "ssh_invalid_user")):
        s = rx.search(msg)
        if s:
            d = s.groupdict()
            ev = {**base, "event": name, "user": d["user"], "src_ip": d["ip"]}
            if d.get("port"):
                ev["port"] = int(d["port"])
            if d.get("method"):
                ev["auth_method"] = d["method"]
            return ev
    return None


def parse_access(line, year=None, offset=0):
    m = ACCESS.match(line)
    if not m:
        return None
    try:
        ts = datetime.strptime(m["ts"], "%d/%b/%Y:%H:%M:%S %z").timestamp()
    except ValueError:
        ts = None
    ev = {"time": ts, "event": "http_request", "source": "access", "src_ip": m["ip"], "method": m["method"], "path": m["path"],
          "status": int(m["status"]), "bytes": 0 if m["bytes"] == "-" else int(m["bytes"])}
    if m["ua"] is not None:
        ev["user_agent"] = m["ua"]
    if m["user"] != "-":
        ev["user"] = m["user"]
    return ev


def parse_syslog(line, year, offset):
    m = SYSLOG.match(line)
    if not m:
        return None
    ev = {"time": syslog_time(m, year, offset), "event": "syslog", "source": "syslog", "host": m["host"], "program": m["prog"], "message": m["msg"]}
    if m["pid"]:
        ev["pid"] = int(m["pid"])
    return ev


PARSERS = {"auth": parse_auth, "access": parse_access, "syslog": parse_syslog}


def parse_line(line, fmt, year, offset):
    order = ["auth", "access", "syslog"] if fmt == "auto" else [fmt]
    for name in order:
        ev = PARSERS[name](line, year, offset)
        if ev:
            return ev
    return None


def cmd_normalize(a):
    try:
        fh = sys.stdin if a.file == "-" else open(a.file, encoding="utf-8", errors="replace")
    except OSError as exc:
        raise SystemExit(f"lognorm: cannot read {a.file}: {exc.strerror}")
    ok = skipped = 0
    with fh:
        for n, line in enumerate(fh, 1):
            line = line.rstrip("\n")
            if not line.strip():
                continue
            ev = parse_line(line, a.format, a.year, a.tz_offset)
            if ev is None:
                skipped += 1
                continue
            ev["line"] = n
            print(json.dumps(ev, separators=(",", ":")))
            ok += 1
    print(f"lognorm: {ok} events, {skipped} unparsed lines", file=sys.stderr)
    return 0 if ok else 1


def load_events(path):
    try:
        with open(path, encoding="utf-8") as fh:
            events = []
            for line in fh:
                try:
                    obj = json.loads(line)
                except ValueError:
                    continue
                if isinstance(obj, dict):
                    events.append(obj)
            return events
    except OSError as exc:
        raise SystemExit(f"lognorm: cannot read {path}: {exc.strerror}")


def summarize(events, top):
    c = lambda it: Counter(it).most_common(top)
    times = [e["time"] for e in events if isinstance(e.get("time"), (int, float))]
    fails = [e for e in events if e.get("event") == "ssh_failed"]
    http = [e for e in events if e.get("event") == "http_request"]
    return {
        "events": len(events),
        "first": min(times) if times else None, "last": max(times) if times else None,
        "by_event": c(e.get("event", "?") for e in events),
        "top_sources": c(e["src_ip"] for e in events if "src_ip" in e),
        "failed_logins_by_ip": c(e["src_ip"] for e in fails),
        "failed_logins_by_user": c(e.get("user", "?") for e in fails),
        "http_status_classes": sorted(Counter(f"{e['status'] // 100}xx" for e in http if isinstance(e.get("status"), int)).items()),
        "top_paths": c(e["path"] for e in http if "path" in e),
        "http_errors_by_ip": c(e["src_ip"] for e in http if isinstance(e.get("status"), int) and e["status"] >= 400),
    }


def fmt_ts(t):
    return datetime.fromtimestamp(t, timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ") if t is not None else "n/a"


SECTIONS = (("Events by type", "by_event"), ("Top sources", "top_sources"), ("Failed SSH logins by IP", "failed_logins_by_ip"),
            ("Failed SSH logins by user", "failed_logins_by_user"), ("HTTP status classes", "http_status_classes"),
            ("Top requested paths", "top_paths"), ("HTTP errors (4xx/5xx) by IP", "http_errors_by_ip"))


def render_text(s):
    out = [f"Events: {s['events']}   Range: {fmt_ts(s['first'])} .. {fmt_ts(s['last'])}"]
    for title, key in SECTIONS:
        if s[key]:
            out.append(f"\n{title}")
            out.extend(f"  {v:>6}  {k}" for k, v in s[key])
    return "\n".join(out)


def render_html(s):
    parts = []
    for title, key in SECTIONS:
        rows = s[key]
        if not rows:
            continue
        peak = max(v for _, v in rows) or 1
        body = "".join(f'<tr><td class="k">{html.escape(str(k))}</td><td class="v">{v}</td><td class="b"><span style="width:{max(2, round(100 * v / peak))}%"></span></td></tr>' for k, v in rows)
        parts.append(f"<section><h2>{html.escape(title)}</h2><table>{body}</table></section>")
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Log report</title><style>
:root{{--bg:#0d1117;--fg:#c9d1d9;--mut:#8b949e;--card:#161b22;--bd:#30363d;--ac:#58a6ff}}
@media (prefers-color-scheme:light){{:root{{--bg:#fff;--fg:#1f2328;--mut:#59636e;--card:#f6f8fa;--bd:#d1d9e0;--ac:#0969da}}}}
body{{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}}
main{{max-width:900px;margin:auto}}h1{{margin:0 0 4px}}p.m{{color:var(--mut);margin:0 0 20px}}
section{{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:12px 16px;margin:0 0 14px}}
h2{{font-size:15px;margin:0 0 8px;color:var(--ac)}}table{{width:100%;border-collapse:collapse}}td{{padding:3px 6px;vertical-align:middle}}
td.k{{font-family:ui-monospace,monospace;word-break:break-all}}td.v{{text-align:right;width:70px}}td.b{{width:35%}}
td.b span{{display:block;height:8px;background:var(--ac);border-radius:4px}}
</style></head><body><main><h1>Log report</h1><p class="m">{s['events']} events &middot; {fmt_ts(s['first'])} to {fmt_ts(s['last'])}</p>{''.join(parts)}</main></body></html>"""


def cmd_report(a):
    s = summarize(load_events(a.file), a.top)
    if not s["events"]:
        raise SystemExit("lognorm: no events found in input")
    if a.json:
        print(json.dumps(s, indent=2))
    else:
        print(render_text(s))
    if a.html:
        Path(a.html).write_text(render_html(s), encoding="utf-8")
        print(f"HTML report: {a.html}", file=sys.stderr)
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="Normalize raw logs to JSONL and summarize them (offline)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    n = sub.add_parser("normalize", help="parse raw logs into JSONL")
    n.add_argument("file", help="log file, or - for stdin")
    n.add_argument("--format", choices=["auto", "auth", "access", "syslog"], default="auto")
    n.add_argument("--year", type=int, default=datetime.now().year, help="year for syslog timestamps (default: current)")
    n.add_argument("--tz-offset", type=float, default=0.0, help="hours from UTC for syslog timestamps (default 0)")
    n.set_defaults(fn=cmd_normalize)
    r = sub.add_parser("report", help="summarize normalized JSONL")
    r.add_argument("file")
    r.add_argument("--html", metavar="OUT", help="also write a self-contained HTML report")
    r.add_argument("--top", type=int, default=10)
    r.add_argument("--json", action="store_true")
    r.set_defaults(fn=cmd_report)
    a = ap.parse_args(argv)
    return a.fn(a)


def _run():
    try:
        return main()
    except BrokenPipeError:  # e.g. `lognorm normalize ... | head`: exit quietly like standard tools
        try:
            sys.stdout = None
        finally:
            return 0


if __name__ == "__main__":
    sys.exit(_run())
