#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("SNMP AUDIT")
except Exception:
    pass
import argparse
import re

def main():
    p = argparse.ArgumentParser(description="Offline SNMP configuration audit")
    p.add_argument("config")
    args = p.parse_args()
    try:
        text = open(args.config, encoding="utf-8", errors="ignore").read()
    except OSError as exc:
        p.error(f"cannot read config: {exc}")

    checks = [
        (r"community\s+(public|private)\b", "default community string"),
        (r"\bv1\b", "SNMPv1 configured"),
        (r"\bv2c\b", "SNMPv2c configured"),
    ]
    findings = 0
    for pattern, msg in checks:
        if re.search(pattern, text, re.I):
            findings += 1
            print("[FINDING]", msg)
    print(f"[SUMMARY] findings={findings}")
    print("[INFO] SNMP config audit complete")

if __name__ == "__main__":
    main()
