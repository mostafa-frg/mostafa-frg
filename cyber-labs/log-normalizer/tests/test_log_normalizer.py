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
