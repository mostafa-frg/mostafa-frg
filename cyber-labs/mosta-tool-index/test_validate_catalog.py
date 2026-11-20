import csv
import tempfile
import unittest
from pathlib import Path

from validate_catalog import validate


class CatalogValidationTests(unittest.TestCase):
    def write_catalog(self, rows):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        path = Path(temp.name) / "tools.csv"
        with path.open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=("name", "alias", "platform", "category", "purpose"))
            writer.writeheader()
            writer.writerows(rows)
        return path

    def test_accepts_valid_unique_entries(self):
        path = self.write_catalog([
            dict(name="Nmap", alias="mnmap", platform="Kali", category="network", purpose="authorized discovery"),
            dict(name="Tcpdump", alias="mtcpdump", platform="Termux", category="packet", purpose="local packet analysis"),
        ])
        self.assertEqual(validate(path), [])

    def test_rejects_duplicate_alias_and_name(self):
        path = self.write_catalog([
            dict(name="Nmap", alias="mnmap", platform="Kali", category="network", purpose="discovery"),
            dict(name="nmap", alias="mnmap", platform="Termux", category="network", purpose="discovery"),
        ])
        errors = validate(path)
        self.assertTrue(any("duplicate tool name" in item for item in errors))
        self.assertTrue(any("duplicate alias" in item for item in errors))

    def test_rejects_invalid_alias_and_missing_fields(self):
        path = self.write_catalog([
            dict(name="Example", alias="bad alias", platform="Kali", category="network", purpose=""),
        ])
        errors = validate(path)
        self.assertTrue(any("all fields are required" in item for item in errors))
        self.assertTrue(any("invalid MOSTA alias" in item for item in errors))

    def test_rejects_wrong_header(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        path = Path(temp.name) / "bad.csv"
        path.write_text("name,alias\nNmap,mnmap\n", encoding="utf-8")
        self.assertIn("header must be exactly: name,alias,platform,category,purpose", validate(path))


if __name__ == "__main__":
    unittest.main()
