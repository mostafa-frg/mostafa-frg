import json
from contextlib import redirect_stdout
from io import StringIO
import socket
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch
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


    @patch("deskops.ssl.create_default_context")
    @patch("deskops.socket.create_connection")
    def test_tls_check_reports_verified_certificate(self, connect, make_context):
        raw = Mock()
        connect.return_value = raw
        tls = MagicMock()
        tls.__enter__.return_value = tls
        tls.getpeercert.side_effect = [
            {"subject": ((("commonName", "example.test"),),),
             "issuer": ((("commonName", "Example Test CA"),),),
             "notAfter": "Jan  1 00:00:00 2030 GMT",
             "subjectAltName": (("DNS", "example.test"),)},
            b"test-certificate",
        ]
        tls.version.return_value = "TLSv1.3"
        tls.cipher.return_value = ("TLS_AES_128_GCM_SHA256", "TLSv1.3", 128)
        context = Mock()
        context.wrap_socket.return_value = tls
        make_context.return_value = context
        result = deskops.tls_check("example.test")
        self.assertEqual(result["tls_version"], "TLSv1.3")
        self.assertEqual(result["verification"], "passed")
        self.assertIn("example.test", result["subject_alt_names"])
        raw.close.assert_called_once()


    @patch("deskops.urllib.request.urlopen")
    def test_http_audit_flags_https_redirect_downgrade(self, urlopen):
        response = Mock()
        response.status = 200
        response.headers.items.return_value = []
        response.geturl.return_value = "http://example.test/"
        urlopen.return_value = response
        result = deskops.http_audit("https://example.test/")
        control = next(x for x in result["checks"] if x["control"] == "HTTPS redirect integrity")
        self.assertEqual(control["status"], "review")

    def test_emit_supports_human_and_json_output(self):
        human = StringIO()
        with redirect_stdout(human):
            deskops._emit({"digest": "abc123", "size": 3})
        self.assertIn("Digest: abc123", human.getvalue())
        machine = StringIO()
        with redirect_stdout(machine):
            deskops._emit({"digest": "abc123"}, as_json=True)
        self.assertEqual(json.loads(machine.getvalue()), {"digest": "abc123"})

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


    def test_pcap_summary_counts_udp_without_disclosing_addresses(self):
        import struct
        capture = self.root / "sample.pcap"
        ethernet = bytes.fromhex("00112233445566778899aabb0800")
        ipv4 = bytes.fromhex("4500001c0000000040110000c0000201c0000202")
        udp = struct.pack("!HHHH", 53000, 53, 8, 0)
        frame = ethernet + ipv4 + udp
        global_header = bytes.fromhex("d4c3b2a1") + struct.pack("<HHIIII", 2, 4, 0, 0, 65535, 1)
        record = struct.pack("<IIII", 1, 0, len(frame), len(frame))
        capture.write_bytes(global_header + record + frame)
        result = deskops.pcap_summary(capture)
        self.assertEqual(result["packets"], 1)
        self.assertEqual(result["ipv4_packets"], 1)
        self.assertEqual(result["protocols"], {"udp": 1})
        self.assertEqual(result["top_destination_ports"], [{"port": 53, "packets": 1}])
        serialized = json.dumps(result)
        self.assertNotIn("192.0.2.1", serialized)
        self.assertNotIn("192.0.2.2", serialized)

    def test_pcap_summary_rejects_pcapng_and_non_ethernet(self):
        capture = self.root / "unsupported.pcap"
        capture.write_bytes(b"\x0a\x0d\x0d\x0a" + bytes(40))
        with self.assertRaisesRegex(ValueError, "classic PCAP"):
            deskops.pcap_summary(capture)
        global_header = bytes.fromhex("d4c3b2a1") + __import__("struct").pack("<HHIIII", 2, 4, 0, 0, 65535, 101)
        capture.write_bytes(global_header)
        with self.assertRaisesRegex(ValueError, "Ethernet"):
            deskops.pcap_summary(capture)

    def test_pcap_summary_rejects_truncated_record_header(self):
        capture = self.root / "truncated.pcap"
        capture.write_bytes(
            bytes.fromhex("d4c3b2a1") + __import__("struct").pack("<HHIIII", 2, 4, 0, 0, 65535, 1) + b"short"
        )
        with self.assertRaisesRegex(ValueError, "record header"):
            deskops.pcap_summary(capture)

if __name__ == "__main__":
    unittest.main()
