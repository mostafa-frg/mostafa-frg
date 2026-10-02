#!/usr/bin/env python3
from pathlib import Path
import re
import sys

RULES = [
    ("TELNET", re.compile(r"transport input .*telnet", re.I), "SSH-only management is preferred"),
    ("HTTP", re.compile(r"^ip http server$", re.M | re.I), "Disable cleartext HTTP management"),
    ("DEFAULT_SNMP", re.compile(r"community\s+(public|private)\b", re.I), "Replace default SNMP communities"),
    ("ENABLE_PASSWORD", re.compile(r"^enable password\b", re.M | re.I), "Use stronger secret storage"),
]

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("configs")
for path in sorted(root.glob("*.conf")):
    text = path.read_text(encoding="utf-8", errors="ignore")
    print(f"\n## {path.name}")
    findings = 0
    for code, pattern, advice in RULES:
        if pattern.search(text):
            findings += 1
            print(f"[{code}] {advice}")
    print("status=PASS" if findings == 0 else f"status=FINDINGS count={findings}")
