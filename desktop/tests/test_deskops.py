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


    def test_subnet_calculates_standard_ipv4_network(self):
        result = deskops.subnet_info("192.168.10.77/24")
        self.assertEqual(result["network"], "192.168.10.0")
        self.assertEqual(result["broadcast"], "192.168.10.255")
        self.assertEqual(result["netmask"], "255.255.255.0")
        self.assertEqual(result["wildcard_mask"], "0.0.0.255")
        self.assertEqual(result["usable_hosts"], 254)
        self.assertEqual(result["first_usable"], "192.168.10.1")
        self.assertEqual(result["last_usable"], "192.168.10.254")

    def test_subnet_handles_point_to_point_and_single_host_prefixes(self):
        point_to_point = deskops.subnet_info("192.0.2.0/31")
        self.assertEqual(point_to_point["usable_hosts"], 2)
        self.assertEqual(point_to_point["first_usable"], "192.0.2.0")
        self.assertEqual(point_to_point["last_usable"], "192.0.2.1")
        single = deskops.subnet_info("192.0.2.7/32")
        self.assertEqual(single["usable_hosts"], 1)
        self.assertEqual(single["first_usable"], "192.0.2.7")
        self.assertEqual(single["last_usable"], "192.0.2.7")

    def test_subnet_rejects_ipv6_and_malformed_input(self):
        with self.assertRaisesRegex(ValueError, "IPv4 only"):
            deskops.subnet_info("2001:db8::1/64")
        with self.assertRaises(ValueError):
            deskops.subnet_info("192.168.1.1/99")


    def test_auth_summary_aggregates_linux_auth_events_without_leaking_identity(self):
        log = self.root / "auth.log"
        log.write_text(
            "Nov 17 host sshd[101]: Failed password for invalid user intruder from 203.0.113.9 port 22 ssh2\n"
            "Nov 17 host sshd[102]: Accepted publickey for alice from 198.51.100.22 port 22 ssh2\n"
            "Nov 17 host sshd[103]: Invalid user guest from 203.0.113.77 port 22\n"
            "Nov 17 host sshd[104]: pam_unix(sshd:auth): authentication failure; rhost=2001:db8::5 user=secret\n"
            "Nov 17 host sudo[105]: operator : TTY=pts/0 ; COMMAND=cat /etc/shadow\n"
            "Nov 17 host kernel: unrelated system event\n",
            encoding="utf-8",
        )
        result = deskops.auth_summary(log)
        self.assertEqual(result["lines_scanned"], 6)
        self.assertEqual(result["ssh_failed"], 1)
        self.assertEqual(result["ssh_accepted"], 1)
        self.assertEqual(result["pam_failures"], 1)
        self.assertEqual(result["invalid_user_events"], 2)
        self.assertEqual(result["sudo_events"], 1)
        self.assertEqual(result["failed_auth_total"], 2)
        self.assertEqual(result["unique_source_networks"], 3)
        networks = {item["network"] for item in result["top_source_networks"]}
        self.assertIn("203.0.113.0/24", networks)
        self.assertIn("198.51.100.0/24", networks)
        self.assertIn("2001:db8::/48", networks)
        serialized = json.dumps(result)
        for private_value in ("intruder", "alice", "guest", "secret", "203.0.113.9",
                              "198.51.100.22", "2001:db8::5", "/etc/shadow"):
            self.assertNotIn(private_value, serialized)

    def test_auth_summary_rejects_missing_files_and_symlinks(self):
        with self.assertRaises(ValueError):
            deskops.auth_summary(self.root / "missing.log")
        target = self.root / "real.log"
        target.write_text("empty\n", encoding="utf-8")
        link = self.root / "linked.log"
        try:
            link.symlink_to(target)
        except (OSError, NotImplementedError):
            self.skipTest("Symlinks are unavailable on this platform")
        with self.assertRaisesRegex(ValueError, "regular"):
            deskops.auth_summary(link)

    def test_auth_summary_cli_emits_json(self):
        log = self.root / "auth-cli.log"
        log.write_text(
            "Nov 17 host sshd[201]: Failed password for root from 192.0.2.55 port 22 ssh2\n",
            encoding="utf-8",
        )
        output = StringIO()
        with redirect_stdout(output):
            code = deskops.main(["auth-summary", str(log), "--json"])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(output.getvalue())["ssh_failed"], 1)


    def test_auth_summary_aggregates_ssh_pam_and_sudo_without_usernames(self):
        log = self.root / "auth.log"
        log.write_text(
            "Nov 17 10:00:00 host sshd[100]: Failed password for invalid user admin from 192.0.2.55 port 44000 ssh2\n"
            "Nov 17 10:00:01 host sshd[101]: Accepted publickey for operator from 192.0.2.88 port 44001 ssh2\n"
            "Nov 17 10:00:02 host sshd[102]: Invalid user guest from 2001:db8:abcd:12::1 port 44002\n"
            "Nov 17 10:00:03 host sudo[103]: operator : TTY=pts/0 ; PWD=/root ; USER=root ; COMMAND=/bin/id\n"
            "Nov 17 10:00:04 host pam_unix(sshd:auth): authentication failure; rhost=192.0.2.99 user=root\n",
            encoding="utf-8",
        )
        result = deskops.auth_summary(log)
        self.assertEqual(result["ssh_failed"], 1)
        self.assertEqual(result["ssh_accepted"], 1)
        self.assertEqual(result["invalid_user_events"], 2)
        self.assertEqual(result["pam_failures"], 1)
        self.assertEqual(result["sudo_events"], 1)
        self.assertEqual(result["failed_auth_total"], 2)
        serialized = json.dumps(result)
        for secret in ("operator", "admin", "guest", "192.0.2.55", "/bin/id", "2001:db8:abcd:12::1"):
            self.assertNotIn(secret, serialized)

    def test_auth_summary_rejects_symlink_and_missing_file(self):
        missing = self.root / "missing.log"
        with self.assertRaises(ValueError):
            deskops.auth_summary(missing)
        target = self.root / "real.log"
        target.write_text("no events\n", encoding="utf-8")
        link = self.root / "link.log"
        try:
            link.symlink_to(target)
        except (OSError, NotImplementedError):
            self.skipTest("Symlink creation is unavailable on this platform")
        with self.assertRaisesRegex(ValueError, "regular"):
            deskops.auth_summary(link)


    def test_archive_audit_flags_traversal_absolute_paths_and_executables(self):
        import zipfile
        archive = self.root / "unsafe.zip"
        with zipfile.ZipFile(archive, "w") as bundle:
            bundle.writestr("../outside.txt", "outside")
            bundle.writestr("C:\\Windows\\startup.bat", "echo unsafe")
            bundle.writestr("payload/tool.exe", "not executed")
        result = deskops.archive_audit(archive)
        codes = {item["code"] for item in result["findings"]}
        self.assertIn("path_traversal", codes)
        self.assertIn("absolute_path", codes)
        self.assertIn("executable_extension", codes)
        self.assertEqual(result["assessment"], "block_extraction_pending_review")

    def test_archive_audit_flags_symlinks_duplicate_names_and_compression_ratio(self):
        import stat
        import zipfile
        archive = self.root / "metadata-hazards.zip"
        with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
            bundle.writestr("same.txt", "one")
            bundle.writestr("SAME.txt", "two")
            bundle.writestr("compressed.txt", "A" * 100_000)
            link = zipfile.ZipInfo("link-out")
            link.create_system = 3
            link.external_attr = (stat.S_IFLNK | 0o777) << 16
            bundle.writestr(link, "../outside")
        result = deskops.archive_audit(archive)
        codes = {item["code"] for item in result["findings"]}
        self.assertIn("duplicate_path", codes)
        self.assertIn("symbolic_link", codes)
        self.assertIn("extreme_compression_ratio", codes)

    def test_archive_audit_clean_archive_and_cli_json(self):
        import zipfile
        archive = self.root / "normal.zip"
        with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_STORED) as bundle:
            bundle.writestr("docs/readme.txt", "safe metadata")
        result = deskops.archive_audit(archive)
        self.assertEqual(result["assessment"], "no_metadata_hazards_detected")
        self.assertEqual(result["files"], 1)
        output = StringIO()
        with redirect_stdout(output):
            code = deskops.main(["archive-audit", str(archive), "--json"])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(output.getvalue())["format"], "zip")

    def test_archive_audit_rejects_invalid_zip_and_symlink_input(self):
        invalid = self.root / "broken.zip"
        invalid.write_bytes(b"not a zip")
        with self.assertRaisesRegex(ValueError, "Invalid or unsupported ZIP"):
            deskops.archive_audit(invalid)
        target = self.root / "valid.zip"
        target.write_bytes(b"not read because symlink rejected")
        link = self.root / "alias.zip"
        try:
            link.symlink_to(target)
        except (OSError, NotImplementedError):
            self.skipTest("Symlinks are unavailable on this platform")
        with self.assertRaisesRegex(ValueError, "regular ZIP"):
            deskops.archive_audit(link)


    def test_archive_audit_cli_exit_codes_distinguish_high_and_review_findings(self):
        import zipfile
        high_archive = self.root / "high-risk.zip"
        with zipfile.ZipFile(high_archive, "w") as bundle:
            bundle.writestr("../escape.txt", "x")
        with redirect_stdout(StringIO()):
            self.assertEqual(deskops.main(["archive-audit", str(high_archive), "--json"]), 2)
        review_archive = self.root / "review.zip"
        with zipfile.ZipFile(review_archive, "w") as bundle:
            bundle.writestr("installer.exe", "binary")
        with redirect_stdout(StringIO()):
            self.assertEqual(deskops.main(["archive-audit", str(review_archive), "--json"]), 1)

if __name__ == "__main__":
    unittest.main()
