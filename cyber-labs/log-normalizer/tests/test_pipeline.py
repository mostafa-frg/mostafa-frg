import json
import tempfile
import unittest
from pathlib import Path

from pipeline import run_pipeline


class PipelineTests(unittest.TestCase):
    def test_normalize_then_detect(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            log = root / "input.jsonl"
            rules = root / "rules.json"
            log.write_text(
                '{"time":"2026-10-08T01:00:00Z","event_type":"authentication","action":"failed","src_ip":"192.0.2.10"}\n'
                '{"time":"2026-10-08T01:01:00Z","event_type":"authentication","action":"failed","src_ip":"192.0.2.10"}\n',
                encoding="utf-8",
            )
            rules.write_text(
                json.dumps([{
                    "id": "TEST-THRESHOLD",
                    "title": "Repeated matching events",
                    "level": "high",
                    "match": {"all": [
                        {"field": "event_type", "op": "eq", "value": "authentication"},
                        {"field": "action", "op": "eq", "value": "failed"}
                    ]},
                    "threshold": {"count": 2, "window": 300, "group_by": ["src_ip"]}
                }]),
                encoding="utf-8",
            )
            records, alerts = run_pipeline(log, rules)
            self.assertEqual(len(records), 2)
            self.assertEqual(len(alerts), 1)
            self.assertEqual(alerts[0]["rule"], "TEST-THRESHOLD")


if __name__ == "__main__":
    unittest.main()
