#!/usr/bin/env python3
import argparse, csv

REQUIRED = {"username", "enabled", "password_never_expires", "admin"}

def main():
    p = argparse.ArgumentParser(description="Offline AD audit of exported account data")
    p.add_argument("csv")
    a = p.parse_args()
    try:
        with open(a.csv, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            missing = REQUIRED - set(reader.fieldnames or [])
            if missing:
                raise SystemExit(f"Missing CSV columns: {', '.join(sorted(missing))}")
            rows = list(reader)
    except OSError as exc:
        raise SystemExit(f"Cannot read CSV: {exc}")

    print(f"Accounts: {len(rows)}")
    for i, r in enumerate(rows, 2):
        username = r.get("username", "").strip() or "?"
        enabled = r.get("enabled", "").strip().lower()
        never = r.get("password_never_expires", "").strip().lower()
        admin = r.get("admin", "").strip().lower()
        valid = {"true", "false"}
        if enabled not in valid or never not in valid or admin not in valid:
            print(f"[ERROR] line {i}: boolean fields must be true/false")
            continue
        flags = []
        if enabled == "true" and never == "true":
            flags.append("password-never-expires")
        if admin == "true":
            flags.append("privileged-account")
        if flags:
            print(f"[REVIEW] {username}: {', '.join(flags)}")

if __name__ == "__main__":
    main()
