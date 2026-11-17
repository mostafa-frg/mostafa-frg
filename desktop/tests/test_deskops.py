import json
import socket
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import deskops


class DeskOpsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_sha256_known_vector(self):
        item = self.root / "sample.txt"
        item.write_bytes(b"abc")
        result = deskops.file_hash(item)
        self.assertEqual(result["digest"], "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
        self.assertEqual(result["size"], 3)

    def test_manifest_detects_modified_added_and_missing(self):
        target = self.root / "data"
        target.mkdir()
        (target / "keep.txt").write_text("original", encoding="utf-8")
        (target / "remove.txt").write_text("remove", encoding="utf-8")
        manifest = self.root / "baseline.json"
        deskops.manifest_create(target, manifest, "sha256")
        (target / "keep.txt").write_text("changed", encoding="utf-8")
        (target / "remove.txt").unlink()
        (target / "new.txt").write_text("new", encoding="utf-8")
        result = deskops.manifest_verify(target, manifest)
        self.assertFalse(result["ok"])
        self.assertEqual(result["modified"], ["keep.txt"])
        self.assertEqual(result["missing"], ["remove.txt"])
        self.assertEqual(result["added"], ["new.txt"])

    def test_manifest_rejects_parent_traversal(self):
        target = self.root / "data"
        target.mkdir()
        manifest = self.root / "bad.json"
        manifest.write_text(json.dumps({
            "format": deskops.FORMAT, "algorithm": "sha256",
            "files": [{"path": "../outside", "size": 0, "digest": "0"}]
        }), encoding="utf-8")
        with self.assertRaises(ValueError):
            deskops.manifest_verify(target, manifest)

    @patch("deskops.socket.getaddrinfo")
    def test_dns_deduplicates_addresses(self, lookup):
        lookup.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.0.2.10", 0)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.0.2.10", 0)),
        ]
        self.assertEqual(deskops.dns_lookup("example.test")["addresses"], ["192.0.2.10"])

    @patch("deskops.socket.create_connection")
    def test_tcp_success_closes_socket(self, connect):
        connection = Mock()
        connect.return_value = connection
        result = deskops.tcp_check("example.test", 443)
        self.assertTrue(result["open"])
        connection.close.assert_called_once()

    def test_tcp_rejects_invalid_port(self):
        with self.assertRaises(ValueError):
            deskops.tcp_check("example.test", 70000)

    @patch("deskops.urllib.request.urlopen")
    def test_http_audit_checks_headers_and_closes_response(self, urlopen):
        response = Mock()
        response.status = 200
        response.headers.items.return_value = [
            ("Strict-Transport-Security", "max-age=31536000"),
            ("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'"),
            ("X-Content-Type-Options", "nosniff"),
            ("Referrer-Policy", "strict-origin-when-cross-origin"),
            ("Permissions-Policy", "camera=()"),
        ]
        response.geturl.return_value = "https://example.test/"
        urlopen.return_value = response
        result = deskops.http_audit("https://example.test/")
        self.assertEqual(result["status_code"], 200)
        self.assertEqual(result["review"], 0)
        response.close.assert_called_once()

    def test_http_audit_rejects_embedded_credentials(self):
        with self.assertRaises(ValueError):
            deskops.http_audit("https://user:secret@example.test/")

    def test_log_summary_does_not_disclose_client_addresses(self):
        log = self.root / "access.log"
        log.write_text(
            '192.0.2.10 - - [17/Nov/2026:10:00:00 +0000] "GET /index.html?token=secret HTTP/1.1" 200 10\n'
            '192.0.2.11 - - [17/Nov/2026:10:00:01 +0000] "POST /login HTTP/1.1" 401 0\n'
            'invalid line\n',
            encoding="utf-8",
        )
        result = deskops.log_summary(log)
        self.assertEqual(result["parsed_lines"], 2)
        self.assertEqual(result["malformed_lines"], 1)
        self.assertEqual(result["unique_clients"], 2)
        serialized = json.dumps(result)
        self.assertNotIn("192.0.2.10", serialized)
        self.assertNotIn("token=secret", serialized)

if __name__ == "__main__":
    unittest.main()
