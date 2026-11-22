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

    def test_rejects_duplicate_alias_and_duplicate_entry(self):
        path = self.write_catalog([
            dict(name="Nmap", alias="mnmap", platform="Kali", category="network", purpose="discovery"),
            dict(name="nmap", alias="mnmap", platform="Termux", category="network", purpose="discovery"),
        ])
        errors = validate(path)
        self.assertTrue(any("duplicate tool entry" in item for item in errors))
        self.assertTrue(any("duplicate alias" in item for item in errors))

    def test_allows_one_package_to_expose_multiple_commands(self):
        path = self.write_catalog([
            dict(name="procps", alias="mps", platform="Linux", category="system", purpose="process list"),
            dict(name="procps", alias="mtop", platform="Linux", category="system", purpose="process monitor"),
        ])
        self.assertEqual(validate(path), [])

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

    def test_rejects_rows_with_extra_csv_fields(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        path = Path(temp.name) / "extra.csv"
        path.write_text(
            "name,alias,platform,category,purpose\n"
            "Nmap,mnmap,Kali,network,discovery,unexpected\n",
            encoding="utf-8",
        )
        self.assertTrue(any("unexpected extra CSV fields" in item for item in validate(path)))

    def test_rejects_malformed_csv_quoting(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        path = Path(temp.name) / "malformed.csv"
        path.write_text(
            'name,alias,platform,category,purpose\n'
            'Nmap,mnmap,Kali,network,"unterminated\n',
            encoding="utf-8",
        )
        self.assertTrue(any("cannot read catalog" in item for item in validate(path)))


if __name__ == "__main__":
    unittest.main()
