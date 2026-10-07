#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("SOC LOG ANALYZER")
except Exception:
    pass
import argparse
import json
import re
from collections import Counter
from pathlib import Path
PATTERN=re.compile(r"^(?P<ts>\w{3}\s+\d+\s[\d:]+).*sshd.*(?:Failed password for (?:invalid user )?(?P<user>\S+) from (?P<ip>[0-9a-fA-F:.]+)|Accepted \S+ for (?P<ok_user>\S+) from (?P<ok_ip>[0-9a-fA-F:.]+))")
def parse(path):
    try: lines=Path(path).read_text(errors="replace").splitlines()
    except OSError as exc: raise ValueError(f"cannot read log: {exc}") from exc
    events=[]
    for line in lines:
        m=PATTERN.search(line)
        if m:
            failed=bool(m.group("ip"))
            events.append({"timestamp":m.group("ts"),"source_ip":m.group("ip") or m.group("ok_ip"),"username":m.group("user") or m.group("ok_user"),"event":"failed_login" if failed else "successful_login"})
    return events
def main():
    ap=argparse.ArgumentParser(description="Offline SSH authentication log analyzer")
    ap.add_argument("logfile"); ap.add_argument("--threshold",type=int,default=5); ap.add_argument("--json",action="store_true")
    args=ap.parse_args()
    if args.threshold<1: ap.error("--threshold must be >= 1")
    try: events=parse(args.logfile)
    except ValueError as exc: ap.error(str(exc))
    failures=[e for e in events if e["event"]=="failed_login"]; counts=Counter(e["source_ip"] for e in failures)
    alerts=[{"source_ip":ip,"failed_attempts":count,"reason":"threshold_exceeded"} for ip,count in counts.items() if count>=args.threshold]
    report={"events_parsed":len(events),"failed_logins":len(failures),"unique_sources":len(counts),"alerts":sorted(alerts,key=lambda x:x["failed_attempts"],reverse=True)}
    if args.json: print(json.dumps(report,indent=2))
    else:
        print(f"Parsed events: {report['events_parsed']}"); print(f"Failed logins: {report['failed_logins']}")
        for alert in report["alerts"]: print(f"[ALERT] {alert['source_ip']} -> {alert['failed_attempts']} failures")
if __name__=="__main__": main()
