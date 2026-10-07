import os
import subprocess
import csv
from pathlib import Path

ROOT = Path(__file__).parents[1]
TERM = ROOT / "mosta-terminal"

LAB_COMMANDS = {
    "mvlan": "vlan-lab/validate.py", "mfw": "firewall-rule-validator/validator.py",
    "mospf": "ospf-lab/ospf.py", "mstp": "stp-lab/stp.py", "mnat": "nat-lab/nat.py",
    "macl": "acl-policy-lab/acl.py", "msnmp": "snmp-audit/audit.py",
    "msyslog": "syslog-analyzer/analyze.py", "mflow": "netflow-parser/flow.py",
    "mipam": "ipam/ipam.py", "msubnet": "subnet-planner/planner.py",
    "mtopo": "topology-builder/topology.py", "mad": "active-directory-security-lab/audit.py",
    "mpriv": "privilege-escalation-lab/check.py", "mreport": "security-report-template/report.py",
    "mcfg": "network-config-auditor/audit.py", "mdns": "dns-dhcp-lab/dns_lab.py",
    "mmon": "network-monitor/monitor.py", "mscan": "network-security-lab/scanner.py",
    "mauto": "network-automation-lab/build.py", "mfim": "file-integrity-monitor/fim.py",
}


def _install(tmp_path):
    env = dict(os.environ, HOME=str(tmp_path))
    subprocess.run(["bash", str(TERM / "install.sh")], env=env, check=True, capture_output=True, text=True)
    env["PATH"] = f"{tmp_path}/.local/bin:{env['PATH']}"
    return env


def test_lab_command_targets_exist():
    for cmd, rel in LAB_COMMANDS.items():
        assert (ROOT / rel).is_file(), f"{cmd} -> {rel}"
        assert (TERM / cmd).is_file(), cmd


def test_installed_lab_commands_run(tmp_path):
    env = _install(tmp_path)
    for cmd in LAB_COMMANDS:
        link = tmp_path / ".local" / "bin" / cmd
        assert link.is_symlink(), f"{cmd} not installed"
        r = subprocess.run([cmd, "--help"], env=dict(env, MOSTA_BANNER="always"), text=True, capture_output=True, timeout=30)
        assert "Network & Security Toolkit" in r.stderr, f"{cmd}: no Mosta banner ({r.stderr[-200:]})"
        assert r.stderr.count("Network & Security Toolkit") == 1, f"{cmd}: banner drawn twice"
        assert "Network & Security Toolkit" not in r.stdout, f"{cmd}: banner leaked to stdout"


def test_mosta_lists_all_lab_commands():
    out = subprocess.run(["bash", str(TERM / "mosta")], text=True, capture_output=True, check=True).stdout
    for cmd in LAB_COMMANDS:
        assert cmd in out, cmd


def test_external_aliases_have_index_rows_and_wrappers():
    wrapper = (TERM / "mosta-external").read_text(encoding="utf-8")
    with open(ROOT / "mosta-tool-index" / "tools.csv", encoding="utf-8", newline="") as fh:
        rows = list(csv.DictReader(fh))
    assert rows and all(len(r) == 5 for r in rows)
    aliases = [r["alias"] for r in rows]
    assert len(aliases) == len(set(aliases))
    # Aliases for tools without GUI/special launchers must be handled by the wrapper.
    for alias in ("mmasscan", "mwhatweb", "mwifite", "mdnsrecon", "mdnsenum", "mnslookup", "mss"):
        assert alias in aliases
        assert f"  {alias})" in wrapper
