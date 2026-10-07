#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("DETECTION RULES ENGINE")
except Exception:
    pass
"""Detection Rules Engine: run JSON detection rules over JSONL logs (offline).

A rule matches events (all/any conditions) and may require a threshold
(N matches within a time window, grouped by fields) before it alerts.
"""
import argparse
import json
import re
import sys
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path

LEVELS = {"info": 0, "low": 1, "medium": 2, "high": 3, "critical": 4}
OPS = {"eq", "ne", "contains", "startswith", "endswith", "regex", "in", "gt", "ge", "lt", "le", "exists"}


class RuleError(ValueError):
    pass


def get_field(event, dotted):
    cur = event
    for part in dotted.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None, False
    return cur, True


def parse_time(value):
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        text = value.strip().replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(text)
        except ValueError:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()
    return None


def cond_matches(cond, event):
    value, present = get_field(event, cond["field"])
    op = cond["op"]
    if op == "exists":
        return present == bool(cond.get("value", True))
    if not present:
        return False
    want = cond.get("value")
    try:
        if op == "eq": return value == want
        if op == "ne": return value != want
        if op == "in": return value in want
        if op == "contains": return str(want).lower() in str(value).lower()
        if op == "startswith": return str(value).startswith(str(want))
        if op == "endswith": return str(value).endswith(str(want))
        if op == "regex": return re.search(want, str(value)) is not None
        if op == "gt": return float(value) > float(want)
        if op == "ge": return float(value) >= float(want)
        if op == "lt": return float(value) < float(want)
        if op == "le": return float(value) <= float(want)
    except (TypeError, ValueError):
        return False
    return False


def validate_rules(rules):
    if not isinstance(rules, list) or not rules:
        raise RuleError("rules file must contain a non-empty JSON list")
    seen = set()
    for i, r in enumerate(rules):
        where = f"rule #{i + 1}"
        if not isinstance(r, dict) or not r.get("id"):
            raise RuleError(f"{where}: missing 'id'")
        rid = r["id"]; where = f"rule '{rid}'"
        if rid in seen:
            raise RuleError(f"{where}: duplicate id")
        seen.add(rid)
        if r.get("level", "medium") not in LEVELS:
            raise RuleError(f"{where}: level must be one of {', '.join(LEVELS)}")
        match = r.get("match")
        if not isinstance(match, dict) or not (match.get("all") or match.get("any")):
            raise RuleError(f"{where}: 'match' needs a non-empty 'all' or 'any' list")
        for key in ("all", "any"):
            for c in match.get(key, []):
                if not isinstance(c, dict) or "field" not in c or c.get("op") not in OPS:
                    raise RuleError(f"{where}: bad condition {c!r} (op must be one of {', '.join(sorted(OPS))})")
                if c["op"] == "regex":
                    try:
                        re.compile(c.get("value", ""))
                    except re.error as exc:
                        raise RuleError(f"{where}: invalid regex: {exc}")
        t = r.get("threshold")
        if t is not None:
            if not (isinstance(t.get("count"), int) and t["count"] >= 1 and isinstance(t.get("window"), (int, float)) and t["window"] > 0):
                raise RuleError(f"{where}: threshold needs integer count>=1 and window>0 (seconds)")
    return rules


def event_matches(rule, event):
    m = rule["match"]
    return all(cond_matches(c, event) for c in m.get("all", [])) and (not m.get("any") or any(cond_matches(c, event) for c in m["any"]))


def run(rules, events, min_level="info"):
    """Return alerts. Each alert: rule id/title/level/tags, group, count, first/last time, line numbers."""
    alerts = []
    windows = defaultdict(deque)       # (rule, group) -> deque of (ts, line)
    fired = {}                          # (rule, group) -> last alert index (avoid alert storms per window)
    for line_no, event in events:
        ts = None
        for r in rules:
            if LEVELS[r.get("level", "medium")] < LEVELS[min_level] or not event_matches(r, event):
                continue
            t = r.get("threshold")
            if not t:
                alerts.append(_alert(r, {}, 1, [line_no], event.get("time")))
                continue
            if ts is None:
                ts = parse_time(event.get("time", event.get("timestamp")))
            if ts is None:
                continue  # threshold rules need a usable timestamp
            group = tuple((f, str(get_field(event, f)[0])) for f in t.get("group_by", []))
            key = (r["id"], group)
            dq = windows[key]
            dq.append((ts, line_no))
            while dq and ts - dq[0][0] > t["window"]:
                dq.popleft()
            if len(dq) >= t["count"]:
                idx = fired.get(key)
                if idx is not None and alerts[idx]["last_seen_ts"] >= dq[0][0]:
                    a = alerts[idx]                      # extend the existing alert instead of spamming
                    a["count"] = len(dq); a["lines"] = [l for _, l in dq]; a["last_seen_ts"] = ts
                else:
                    fired[key] = len(alerts)
                    alerts.append(_alert(r, dict(group), len(dq), [l for _, l in dq], ts))
                    alerts[-1]["last_seen_ts"] = ts
    for a in alerts:
        a.pop("last_seen_ts", None)
    alerts.sort(key=lambda a: (-LEVELS[a["level"]], a["rule"]))
    return alerts


def _alert(rule, group, count, lines, ts):
    return {"rule": rule["id"], "title": rule.get("title", rule["id"]), "level": rule.get("level", "medium"),
            "tags": rule.get("tags", []), "group": group, "count": count, "lines": lines, "last_seen_ts": ts if isinstance(ts, (int, float)) else None, "time": ts if not isinstance(ts, (int, float)) else None}


def read_events(path):
    events, bad = [], 0
    try:
        with open(path, encoding="utf-8") as fh:
            for n, line in enumerate(fh, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except ValueError:
                    bad += 1
                    continue
                if isinstance(obj, dict):
                    events.append((n, obj))
                else:
                    bad += 1
    except OSError as exc:
        raise SystemExit(f"engine: cannot read logs: {exc}")
    return events, bad


def main(argv=None):
    ap = argparse.ArgumentParser(description="Run JSON detection rules over JSONL logs (offline)")
    ap.add_argument("rules", help="JSON rules file")
    ap.add_argument("logs", help="JSONL log file (one JSON object per line)")
    ap.add_argument("--min-level", choices=list(LEVELS), default="info")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    ap.add_argument("--validate-only", action="store_true", help="only validate the rules file")
    a = ap.parse_args(argv)
    try:
        rules = validate_rules(json.loads(Path(a.rules).read_text(encoding="utf-8")))
    except (OSError, ValueError) as exc:  # RuleError is a ValueError
        raise SystemExit(f"engine: invalid rules: {exc}")
    if a.validate_only:
        print(f"OK: {len(rules)} rules valid")
        return 0
    events, bad = read_events(a.logs)
    alerts = run(rules, events, a.min_level)
    if a.json:
        print(json.dumps({"events": len(events), "skipped_lines": bad, "alerts": alerts}, indent=2))
    else:
        for al in alerts:
            grp = ", ".join(f"{k}={v}" for k, v in al["group"].items())
            tags = f" [{', '.join(al['tags'])}]" if al["tags"] else ""
            print(f"[{al['level'].upper()}] {al['rule']}: {al['title']}{tags}" + (f" ({grp})" if grp else "") + f" x{al['count']} lines={al['lines'][:5]}")
        print(f"Events: {len(events)}  Skipped: {bad}  Alerts: {len(alerts)}")
    return 1 if alerts else 0


if __name__ == "__main__":
    sys.exit(main())
