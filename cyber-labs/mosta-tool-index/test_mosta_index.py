import tempfile
import unittest
from pathlib import Path
from mosta_index import load_catalog, select, render

class MostaIndexTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "tools.csv"
        self.path.write_text(
            "name,alias,platform,category,purpose\n"
            "Nmap,mnmap,Kali Linux,network,authorized service discovery\n"
            "Tcpdump,mtcpdump,Termux,packet,local packet capture\n"
            "OpenSSL,mopenssl,Linux Desktop,crypto,TLS diagnostics\n",
            encoding="utf-8",
        )
    def test_load_catalog_uses_csv_schema(self):
        self.assertEqual(len(load_catalog(self.path)), 3)
    def test_search_matches_alias_and_purpose_case_insensitively(self):
        rows = select(load_catalog(self.path), query="CAPTURE")
        self.assertEqual([row["alias"] for row in rows], ["mtcpdump"])
    def test_category_and_platform_filters_compose(self):
        rows = select(load_catalog(self.path), category="network", platform="kali")
        self.assertEqual([row["name"] for row in rows], ["Nmap"])
    def test_json_render_is_machine_readable(self):
        import json
        output = render(select(load_catalog(self.path), query="nmap"), as_json=True)
        self.assertEqual(json.loads(output)[0]["alias"], "mnmap")
    def test_rejects_extra_csv_fields(self):
        self.path.write_text(
            "name,alias,platform,category,purpose\\n"
            "Nmap,mnmap,Kali,network,discovery,unexpected\\n",
            encoding="utf-8",
        )
        with self.assertRaisesRegex(ValueError, "unexpected extra CSV fields"):
            load_catalog(self.path)

    def test_rejects_malformed_csv_quoting(self):
        self.path.write_text(
            'name,alias,platform,category,purpose\\n'
            'Nmap,mnmap,Kali,network,"unterminated\\n',
            encoding="utf-8",
        )
        with self.assertRaisesRegex(ValueError, "cannot read catalog"):
            load_catalog(self.path)

    def test_rejects_incomplete_catalog_rows(self):
        self.path.write_text("name,alias,platform,category,purpose\nNmap,mnmap,Kali,network,\n", encoding="utf-8")
        with self.assertRaises(ValueError):
            load_catalog(self.path)

if __name__ == "__main__":
    unittest.main()
