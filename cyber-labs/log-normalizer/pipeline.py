#!/usr/bin/env python3
"""End-to-end offline pipeline: raw logs -> normalized JSONL -> detection alerts."""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent
ENGINE_PATH = HERE.parent / "detection-rules-engine" / "engine.py"


def load_engine():
    spec = importlib.util.spec_from_file_location("mosta_detection_engine", ENGINE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load detection engine: {ENGINE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_pipeline(input_path: Path, rules_path: Path, output_path: Path | None = None):
    from log_normalizer import normalize_file

    engine = load_engine()
    records = normalize_file(input_path)

    # The detection engine accepts either time or timestamp. Keep the normalized
    # schema intact and add the compatible 'time' field only in pipeline memory.
    events = []
    for record in records:
        event = dict(record)
        if event.get("timestamp") and not event.get("time"):
            event["time"] = event["timestamp"]
        events.append((record["line"], event))

    rules = engine.validate_rules(
        json.loads(rules_path.read_text(encoding="utf-8"))
    )
    alerts = engine.run(rules, events)

    if output_path:
        payload = "".join(
            json.dumps(record, ensure_ascii=False) + "\n" for record in records
        )
        output_path.write_text(payload, encoding="utf-8")

    return records, alerts


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Normalize raw security logs and run detection rules offline."
    )
    parser.add_argument("input", help="Raw log file")
    parser.add_argument("rules", help="Detection rules JSON file")
    parser.add_argument(
        "-o", "--output", help="Write normalized JSONL to this file"
    )
    parser.add_argument("--json", action="store_true", help="Machine-readable output")
    args = parser.parse_args(argv)

    input_path = Path(args.input)
    rules_path = Path(args.rules)
    if not input_path.is_file():
        print(f"error: input file not found: {input_path}", file=sys.stderr)
        return 2
    if not rules_path.is_file():
        print(f"error: rules file not found: {rules_path}", file=sys.stderr)
        return 2

    try:
        records, alerts = run_pipeline(
            input_path, rules_path, Path(args.output) if args.output else None
        )
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"pipeline: {exc}", file=sys.stderr)
        return 2

    result = {"records": len(records), "alerts": alerts}
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"Normalized records: {len(records)}")
        print(f"Alerts: {len(alerts)}")
        for alert in alerts:
            print(
                f"[{alert['level'].upper()}] {alert['rule']}: "
                f"{alert['title']} x{alert['count']} lines={alert['lines']}"
            )
    return 1 if alerts else 0


if __name__ == "__main__":
    raise SystemExit(main())
