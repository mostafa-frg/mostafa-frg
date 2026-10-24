import json
import tempfile
import unittest
from pathlib import Path
from log_normalizer import normalize_line, normalize_file

class LogNormalizerTests(unittest.TestCase):
    def test_ssh_failed_authentication(self):
        record = normalize_line(
            "Oct  8 01:12:04 web01 sshd[1842]: Failed password for admin from 192.0.2.44 port 55221 ssh2",
            "sample.log", 1)
        self.assertEqual(record["event_type"], "authentication")
        self.assertEqual(record["action"], "failed")
        self.assertEqual(record["user"], "admin")
        self.assertEqual(record["src_ip"], "192.0.2.44")
        self.assertEqual(record["src_port"], 55221)

    def test_json_aliases(self):
        record = normalize_line(
            json.dumps({"ts":"2026-10-08T01:13:00Z","hostname":"api01","username":"m"}),
            "sample.jsonl", 2)
        self.assertEqual(record["timestamp"], "2026-10-08T01:13:00Z")
        self.assertEqual(record["host"], "api01")
        self.assertEqual(record["user"], "m")

    def test_unknown_text_is_preserved(self):
        record = normalize_line("hello security log", "sample.log", 3)
        self.assertEqual(record["event_type"], "text")
        self.assertEqual(record["message"], "hello security log")

    def test_file_normalization(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.log"
            path.write_text("hello\n\n{\"event\":\"test\"}\n", encoding="utf-8")
            records = normalize_file(path)
            self.assertEqual(len(records), 2)
            self.assertEqual(records[0]["event_type"], "text")
            self.assertEqual(records[1]["event_type"], "test")

if __name__ == "__main__":
    unittest.main()


class SyslogTimestampTests(unittest.TestCase):
    def test_syslog_lines_get_utc_timestamps(self):
        from log_normalizer import normalize_line, syslog_timestamp
        rec = normalize_line("Oct  8 01:12:01 web01 sshd[1]: Failed password for admin from 192.0.2.44 port 55221 ssh2", "t", 1, year=2026)
        self.assertEqual(rec["timestamp"], "2026-10-08T01:12:01Z")
        self.assertEqual(syslog_timestamp("Oct  8 03:00:00", 2026, 2), "2026-10-08T01:00:00Z")
        self.assertIsNone(syslog_timestamp("Feb 30 00:00:00", 2026))

    def test_pipeline_detects_syslog_bruteforce(self):
        import json, tempfile
        from pathlib import Path
        from pipeline import run_pipeline
        with tempfile.TemporaryDirectory() as tmp:
            log, rules = Path(tmp) / "a.log", Path(tmp) / "r.json"
            log.write_text("".join(f"Oct  8 01:12:{i:02d} h sshd[1]: Failed password for root from 203.0.113.9 port {4000 + i} ssh2\n" for i in range(6)))
            rules.write_text(json.dumps([{"id": "BF", "level": "high", "match": {"all": [{"field": "action", "op": "eq", "value": "failed"}]},
                                          "threshold": {"count": 5, "window": 300, "group_by": ["src_ip"]}}]))
            _, alerts = run_pipeline(log, rules, year=2026)
            self.assertEqual(len(alerts), 1)
            self.assertEqual(alerts[0]["count"], 6)
