# Detection Rules Engine

Runs JSON detection rules over JSONL logs, offline. Rules can match single events or require a **threshold** (N matches inside a time window, grouped by fields) before alerting; rules carry a severity and ATT&CK-style tags. Standard library only.

## Run

```bash
python3 engine.py sample_rules.json sample_events.jsonl
python3 engine.py rules.json logs.jsonl --min-level high --json
python3 engine.py rules.json logs.jsonl --validate-only
```

With the Mosta command layer: `mdet RULES LOGS`. Exit code: `0` no alerts, `1` alerts, non-zero with a message on bad input.

## Rule format

```json
{"id": "SSH-BRUTE", "title": "SSH brute force", "level": "high", "tags": ["attack.t1110"],
 "match": {"all": [{"field": "event", "op": "eq", "value": "ssh_failed"}]},
 "threshold": {"count": 5, "window": 300, "group_by": ["src_ip"]}}
```

- `match.all`: every condition must hold; `match.any`: at least one must hold (both may be combined).
- Operators: `eq ne contains startswith endswith regex in gt ge lt le exists`. Fields can be nested with dots (`process.cmdline`).
- `level`: `info low medium high critical`.
- `threshold` needs `time` (ISO-8601 or epoch seconds) in the event; events without it are ignored by threshold rules. Repeated matches inside one window extend a single alert instead of creating many.
- Malformed log lines are skipped and counted.

Rules are matched as written: they detect what they describe, nothing more. Tune them against your own logs. Use only on logs you are authorized to analyze.
