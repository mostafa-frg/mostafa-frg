#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("NETWORK CONFIG COMPLIANCE")
except Exception:
    pass
from pathlib import Path
import argparse
import re

RULES = [
    ("TELNET", re.compile(r"transport input .*telnet", re.I), "SSH-only management is preferred"),
    ("HTTP", re.compile(r"^ip http server$", re.M | re.I), "Disable cleartext HTTP management"),
    ("DEFAULT_SNMP", re.compile(r"community\s+(public|private)\b", re.I), "Replace default SNMP communities"),
    ("ENABLE_PASSWORD", re.compile(r"^enable password\b", re.M | re.I), "Use stronger secret storage"),
]

def main():
    p = argparse.ArgumentParser(description="Offline Cisco configuration compliance checker")
    p.add_argument("root", nargs="?", default="configs")
    args = p.parse_args()
    root = Path(args.root)
    if not root.exists():
        p.error(f"config directory does not exist: {root}")
    if not root.is_dir():
        p.error(f"not a directory: {root}")
    paths = sorted(root.glob("*.conf"))
    if not paths:
        p.error(f"no .conf files found in {root}")

    for path in paths:
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError as exc:
            print(f"[ERROR] {path.name}: {exc}")
            continue
        print(f"\n## {path.name}")
        findings = 0
        for code, pattern, advice in RULES:
            if pattern.search(text):
                findings += 1
                print(f"[{code}] {advice}")
        print("status=PASS" if findings == 0 else f"status=FINDINGS count={findings}")

if __name__ == "__main__":
    main()
