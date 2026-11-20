#!/usr/bin/env python3
"""Validate the MOSTA CLI tool index without installing or executing tools."""
from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

REQUIRED = ("name", "alias", "platform", "category", "purpose")
ALIAS = re.compile(r"^m[a-z][a-z0-9-]{1,30}$")
CATEGORY = re.compile(r"^[a-z][a-z0-9-]{1,30}$")


def validate(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            if tuple(reader.fieldnames or ()) != REQUIRED:
                return [f"header must be exactly: {','.join(REQUIRED)}"]
            seen_names: set[str] = set()
            seen_aliases: set[str] = set()
            count = 0
            for line, row in enumerate(reader, start=2):
                count += 1
                values = {key: (row.get(key) or "").strip() for key in REQUIRED}
                if any(not value for value in values.values()):
                    errors.append(f"line {line}: all fields are required")
                    continue
                name_key = values["name"].casefold()
                alias_key = values["alias"].casefold()
                if name_key in seen_names:
                    errors.append(f"line {line}: duplicate tool name {values['name']!r}")
                if alias_key in seen_aliases:
                    errors.append(f"line {line}: duplicate alias {values['alias']!r}")
                if not ALIAS.fullmatch(values["alias"]):
                    errors.append(f"line {line}: invalid MOSTA alias {values['alias']!r}")
                if not CATEGORY.fullmatch(values["category"]):
                    errors.append(f"line {line}: invalid category slug {values['category']!r}")
                if any(ord(ch) < 32 for value in values.values() for ch in value):
                    errors.append(f"line {line}: control characters are not allowed")
                seen_names.add(name_key)
                seen_aliases.add(alias_key)
            if count == 0:
                errors.append("catalog must contain at least one tool")
    except (OSError, UnicodeError, csv.Error) as exc:
        errors.append(f"cannot read catalog: {exc}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_file", nargs="?", type=Path,
                        default=Path(__file__).with_name("tools.csv"))
    args = parser.parse_args()
    errors = validate(args.csv_file)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    with args.csv_file.open("r", encoding="utf-8-sig", newline="") as stream:
        count = sum(1 for _ in csv.DictReader(stream))
    print(f"OK: {count} unique CLI catalog entries validated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
