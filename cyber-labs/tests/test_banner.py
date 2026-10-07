import os
import pty
import select
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "common"))
import mosta_banner  # noqa: E402

PY_TOOLS = sorted(
    p for p in ROOT.glob("*/*.py")
    if "mosta_banner" in p.read_text(encoding="utf-8") and p.parent.name != "tests"
)


def _run_on_tty(argv, env_extra=None, timeout=4):
    """Run argv with stderr attached to a pseudo-terminal; return what was written to it."""
    master, slave = pty.openpty()
    env = {k: v for k, v in os.environ.items() if not k.startswith("MOSTA_")}
    env.update(TERM="xterm", **(env_extra or {}))
    proc = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=slave, env=env, cwd=ROOT)
    os.close(slave)
    chunks = []
    try:
        while True:
            r, _, _ = select.select([master], [], [], timeout)
            if not r:
                break
            try:
                data = os.read(master, 4096)
            except OSError:
                break
            if not data:
                break
            chunks.append(data)
            if b"authorized to test" in b"".join(chunks):
                break
    finally:
        proc.kill()
        proc.wait()
        os.close(master)
    return b"".join(chunks).decode("utf-8", "replace"), proc


def test_banner_render_contains_logo_version_and_tool():
    text = mosta_banner.render("DEMO TOOL")
    assert "DEMO TOOL" in text and mosta_banner.version() in text
    assert "|_|  |_|" in text  # logo
    assert "\033[" not in text  # no colors unless requested
    assert "\033[" in mosta_banner.render("X", color=True)


def test_banner_is_silent_when_not_a_tty():
    r = subprocess.run([sys.executable, str(ROOT / "network-toolkit" / "nettool.py"), "subnet", "10.0.0.1/24"],
                       text=True, capture_output=True, env={k: v for k, v in os.environ.items() if not k.startswith("MOSTA_")})
    assert r.returncode == 0 and r.stderr == ""
    assert "Network: 10.0.0.0" in r.stdout


def test_every_python_tool_shows_banner_on_a_terminal():
    assert len(PY_TOOLS) >= 30
    for script in PY_TOOLS:
        out, _ = _run_on_tty([sys.executable, str(script), "--help"])
        assert "Network & Security Toolkit" in out, f"{script.relative_to(ROOT)} has no banner on a TTY"


def test_banner_can_be_disabled():
    out, _ = _run_on_tty([sys.executable, str(ROOT / "vlan-lab" / "validate.py"), "--help"],
                         {"MOSTA_BANNER": "never"})
    assert "Network & Security Toolkit" not in out


def test_pcap_demo_and_invalid_file(tmp_path):
    script = ROOT / "pcap-analysis" / "analyze.py"
    env = {k: v for k, v in os.environ.items() if not k.startswith("MOSTA_")}
    r = subprocess.run([sys.executable, str(script), "--demo"], text=True, capture_output=True, env=env)
    assert r.returncode == 0 and "Packets: 3" in r.stdout and "example.test" in r.stdout
    bad = tmp_path / "not-a-pcap.txt"
    bad.write_text("hello", encoding="utf-8")
    r = subprocess.run([sys.executable, str(script), str(bad)], text=True, capture_output=True, env=env)
    assert r.returncode == 2 and "Traceback" not in r.stderr and "cannot read PCAP" in r.stderr


def test_web_labs_actually_serve_requests():
    import socket
    import time
    import urllib.request
    env = {k: v for k, v in os.environ.items() if not k.startswith("MOSTA_")}
    for rel, port, path in (("web-security-lab/app.py", 5000, "/"), ("api-security-lab/app.py", 5001, "/api/user/1"),
                            ("ctf-web-lab/app.py", None, "/profile/1")):
        script = ROOT / rel
        src = script.read_text(encoding="utf-8")
        import re
        m = re.search(r"app\.run\([^)]*?(\d{4})", src)
        port = int(m.group(1))
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", port)) == 0:
                continue  # port already taken by something else; skip rather than interfere
        proc = subprocess.Popen([sys.executable, str(script)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
        try:
            code = None
            for _ in range(40):
                try:
                    code = urllib.request.urlopen(f"http://127.0.0.1:{port}{path}", timeout=1).status
                    break
                except urllib.error.HTTPError as exc:
                    code = exc.code  # e.g. 401 from the API lab proves it is serving
                    break
                except Exception:
                    time.sleep(0.25)
            assert code in (200, 401), f"{rel} did not serve on {port}"
        finally:
            proc.kill()
            proc.wait()
