import compileall
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).parents[1]

def test_all_python_sources_compile():
    assert compileall.compile_dir(str(ROOT), quiet=1)

def test_network_engineering_suite_ip():
    script = ROOT / "network-engineering-suite" / "suite.py"
    r = subprocess.run([sys.executable, str(script), "validate-ip", "10.10.20.15/24"], text=True, capture_output=True, check=True)
    assert "network=10.10.20.0/24" in r.stdout

def test_route_lookup_uses_longest_prefix():
    script = ROOT / "network-engineering-suite" / "suite.py"
    routes = ROOT / "network-engineering-suite" / "sample_routes.csv"
    r = subprocess.run([sys.executable, str(script), "route-lookup", "10.10.20.140", str(routes)], text=True, capture_output=True, check=True)
    assert "10.10.20.128/25" in r.stdout

def test_config_compliance_detects_legacy_config():
    script = ROOT / "config-compliance" / "check.py"
    cfg = ROOT / "config-compliance" / "configs"
    r = subprocess.run([sys.executable, str(script), str(cfg)], text=True, capture_output=True, check=True)
    assert "[TELNET]" in r.stdout
    assert "[DEFAULT_SNMP]" in r.stdout
    assert "[HTTP]" in r.stdout

def test_incident_triage_reads_fixture():
    script = ROOT / "incident-network-triage" / "triage.py"
    data = ROOT / "incident-network-triage" / "sample_events.csv"
    r = subprocess.run([sys.executable, str(script), str(data)], text=True, capture_output=True, check=True)
    assert "EVENTS 4" in r.stdout
    assert "routing adjacency lost" in r.stdout
