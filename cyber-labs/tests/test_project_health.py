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

PYTHON_CLIS = [
    "acl-policy-lab/acl.py",
    "active-directory-security-lab/audit.py",
    "config-compliance/check.py",
    "dns-dhcp-lab/dns_lab.py",
    "firewall-rule-validator/validator.py",
    "http-security-auditor/auditor.py",
    "incident-network-triage/triage.py",
    "ipam/ipam.py",
    "linux-network-toolbox/toolbox.py",
    "nat-lab/nat.py",
    "netflow-parser/flow.py",
    "network-config-auditor/audit.py",
    "network-engineering-suite/suite.py",
    "network-monitor/monitor.py",
    "network-security-lab/scanner.py",
    "network-toolkit/nettool.py",
    "ospf-lab/ospf.py",
    "pcap-analysis/analyze.py",
    "privilege-escalation-lab/check.py",
    "routing-lab/routing.py",
    "security-report-template/report.py",
    "snmp-audit/audit.py",
    "soc-log-analyzer/analyzer.py",
    "stp-lab/stp.py",
    "subnet-planner/planner.py",
    "syslog-analyzer/analyze.py",
    "topology-builder/topology.py",
    "vlan-lab/validate.py",
]

def test_all_cli_entrypoints_show_help():
    for rel in PYTHON_CLIS:
        script = ROOT / rel
        assert script.is_file(), rel
        r = subprocess.run(
            [sys.executable, str(script), "--help"],
            text=True, capture_output=True
        )
        assert r.returncode == 0, f"{rel}: {r.stderr}"

def test_ipam_end_to_end(tmp_path):
    script = ROOT / "ipam" / "ipam.py"
    import os
    old = os.getcwd()
    try:
        os.chdir(tmp_path)
        # Run a copied script so its CSV database stays isolated.
        copied = tmp_path / "ipam.py"
        copied.write_text(script.read_text(encoding="utf-8"), encoding="utf-8")
        subprocess.run([sys.executable, str(copied), "init", "10.40.0.0/29"], check=True)
        r = subprocess.run([sys.executable, str(copied), "add", "10.40.0.0/29", "ci"], text=True, capture_output=True, check=True)
        assert r.stdout.strip() == "10.40.0.1"
    finally:
        os.chdir(old)

def test_subnet_planner_rejects_bad_prefix():
    script = ROOT / "subnet-planner" / "planner.py"
    r = subprocess.run([sys.executable, str(script), "10.0.0.0/24", "23"], text=True, capture_output=True)
    assert r.returncode != 0
    assert "between /24 and /32" in r.stderr

def test_vlan_validator_rejects_bad_vlan():
    script = ROOT / "vlan-lab" / "validate.py"
    bad = ROOT / "vlan-lab" / "_ci_bad.csv"
    bad.write_text("port,mode,allowed,vlan\nGi0/1,access,,5000\n", encoding="utf-8")
    try:
        r = subprocess.run([sys.executable, str(script), str(bad)], text=True, capture_output=True)
        assert r.returncode != 0
        assert "invalid VLAN ID" in r.stderr
    finally:
        bad.unlink(missing_ok=True)

def test_network_monitor_rejects_bad_port():
    script = ROOT / "network-monitor" / "monitor.py"
    bad = ROOT / "network-monitor" / "_ci_bad.csv"
    bad.write_text("host,port\n127.0.0.1,70000\n", encoding="utf-8")
    try:
        r = subprocess.run([sys.executable, str(script), str(bad), "--once"], text=True, capture_output=True)
        assert r.returncode != 0
        assert "invalid port" in r.stderr
    finally:
        bad.unlink(missing_ok=True)
