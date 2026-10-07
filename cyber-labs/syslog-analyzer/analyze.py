#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("SYSLOG ANALYZER")
except Exception:
    pass
import argparse
import re
import collections

PATTERN = re.compile(r"(?P<device>\S+)\s+%\w+-(?P<level>\d+)-\w+:\s*(?P<msg>.*)")

def main():
    p = argparse.ArgumentParser(description="Offline Cisco-style syslog analyzer")
    p.add_argument("log")
    args = p.parse_args()
    try:
        fh = open(args.log, encoding="utf-8", errors="ignore")
    except OSError as exc:
        p.error(f"cannot read log: {exc}")
    sev, dev, msg = collections.Counter(), collections.Counter(), collections.Counter()
    parsed = 0
    with fh:
        for line in fh:
            m = PATTERN.search(line)
            if m:
                parsed += 1
                sev[m["level"]] += 1
                dev[m["device"]] += 1
                msg[m["msg"]] += 1
    print("parsed:", parsed)
    print("severity:", dict(sev))
    print("devices:", dict(dev))
    print("top messages:")
    for k, v in msg.most_common(10):
        print(v, k)

if __name__ == "__main__":
    main()
