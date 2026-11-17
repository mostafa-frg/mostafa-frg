import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class DesktopCatalogDocumentationTests(unittest.TestCase):
    def test_catalog_is_desktop_only_and_has_broad_coverage(self):
        text = (ROOT / "CLI-CATALOG.md").read_text(encoding="utf-8")
        for term in ("Windows", "Linux", "macOS", "Nmap", "Wireshark", "OWASP ZAP",
                     "Zeek", "Suricata", "YARA", "Volatility", "Ghidra",
                     "John the Ripper", "Hashcat", "Docker", "Terraform", "kubectl"):
            self.assertIn(term, text)
        self.assertNotRegex(text.lower(), r"termux|android terminal")
        self.assertIn("explicit written authorization", text)
        self.assertGreaterEqual(text.count("| ["), 45)

    def test_install_guide_does_not_require_personal_data_or_mobile_devices(self):
        text = (ROOT / "INSTALL.md").read_text(encoding="utf-8")
        for term in ("Download ZIP", "Windows", "Linux", "macOS", "does not collect"):
            self.assertIn(term, text)
        self.assertNotRegex(text.lower(), r"termux|android")

if __name__ == "__main__":
    unittest.main()
