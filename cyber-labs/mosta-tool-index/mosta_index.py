#!/usr/bin/env python3
"""Search and browse the MOSTA upstream CLI tool index. Never executes tools."""
from __future__ import annotations
import argparse, csv, json, sys
from pathlib import Path
FIELDS = ("name", "alias", "platform", "category", "purpose")
DEFAULT_CATALOG = Path(__file__).with_name("tools.csv")

def load_catalog(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if tuple(reader.fieldnames or ()) != FIELDS:
            raise ValueError("Unexpected catalog schema.")
        rows = []
        for row in reader:
            item = {key: (row.get(key) or "").strip() for key in FIELDS}
            if not all(item.values()):
                raise ValueError("Catalog contains an incomplete entry.")
            rows.append(item)
        return rows

def select(rows: list[dict[str, str]], query: str = "", category: str = "", platform: str = "") -> list[dict[str, str]]:
    q, cat, plat = query.casefold().strip(), category.casefold().strip(), platform.casefold().strip()
    return [row for row in rows if
        (not q or any(q in row[key].casefold() for key in FIELDS)) and
        (not cat or row["category"].casefold() == cat) and
        (not plat or plat in row["platform"].casefold())]

def render(rows: list[dict[str, str]], as_json: bool = False) -> str:
    if as_json:
        return json.dumps(rows, ensure_ascii=False, indent=2)
    if not rows:
        return "No matching CLI tools."
    widths = {key: min(limit, max(minimum, max(len(r[key]) for r in rows)))
              for key, limit, minimum in (("name",24,4),("alias",16,5),("platform",18,8),("category",16,8))}
    header = f"{'TOOL':<{widths['name']}}  {'ALIAS':<{widths['alias']}}  {'PLATFORM':<{widths['platform']}}  {'CATEGORY':<{widths['category']}}  PURPOSE"
    lines = [header, "-" * len(header)]
    for row in rows:
        lines.append(f"{row['name'][:widths['name']]:<{widths['name']}}  {row['alias'][:widths['alias']]:<{widths['alias']}}  {row['platform'][:widths['platform']]:<{widths['platform']}}  {row['category'][:widths['category']]:<{widths['category']}}  {row['purpose']}")
    return "\n".join(lines) + f"\n\n{len(rows)} catalog entries. Reference only; no command was executed."

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    sub = parser.add_subparsers(dest="action")
    list_cmd = sub.add_parser("list", help="List indexed CLI tools")
    list_cmd.add_argument("--category", default="")
    list_cmd.add_argument("--platform", default="")
    list_cmd.add_argument("--json", action="store_true")
    search_cmd = sub.add_parser("search", help="Search names, aliases, platforms, categories and purposes")
    search_cmd.add_argument("query")
    search_cmd.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    action = args.action or "list"
    try:
        rows = load_catalog(args.catalog)
        if action == "search":
            matches, as_json = select(rows, query=args.query), args.json
        else:
            matches = select(rows, category=getattr(args,"category",""), platform=getattr(args,"platform",""))
            as_json = getattr(args,"json",False)
        print(render(matches, as_json))
        return 0 if matches or action == "list" else 1
    except (OSError, UnicodeError, csv.Error, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
