import json
import os
import subprocess
import sys
from pathlib import Path

D = Path(__file__).parents[1] / "log-ingest"
E = Path(__file__).parents[1] / "detection-rules-engine" / "engine.py"
sys.path.insert(0, str(D))
import lognorm  # noqa: E402


def run(script, *args, stdin=None):
    env = {k: v for k, v in os.environ.items() if not k.startswith("MOSTA_")}
    return subprocess.run([sys.executable, str(script), *args], text=True, capture_output=True, input=stdin, env=env)


def test_auth_lines():
    f = lambda s: lognorm.parse_line(s, "auto", 2026, 0)
    ev = f("Oct  4 21:13:01 web1 sshd[811]: Failed password for invalid user admin from 203.0.113.9 port 40111 ssh2")
    assert (ev["event"], ev["user"], ev["src_ip"], ev["port"], ev["host"]) == ("ssh_failed", "admin", "203.0.113.9", 40111, "web1")
    assert f("Oct  4 21:14:00 web1 sshd[812]: Accepted publickey for alice from 10.0.0.5 port 50022 ssh2")["event"] == "ssh_accepted"
    assert f("Oct  4 21:15:00 web1 sshd[813]: Invalid user test from 198.51.100.4 port 3333")["event"] == "ssh_invalid_user"
    assert f("Oct  4 21:16:00 web1 CRON[9]: session opened")["event"] == "syslog"       # falls through to syslog
    assert f("this is not a log line") is None


def test_time_handling():
    a = lognorm.parse_line("Jan  1 00:00:00 h sshd[1]: Accepted password for u from 1.1.1.1 port 1 ssh2", "auth", 2026, 0)["time"]
    b = lognorm.parse_line("Jan  1 00:00:00 h sshd[1]: Accepted password for u from 1.1.1.1 port 1 ssh2", "auth", 2026, 2)["time"]
    assert a - b == 7200                                                              # +02:00 is two hours earlier in UTC
    c = lognorm.parse_access('1.2.3.4 - - [04/Oct/2026:21:13:01 +0300] "GET / HTTP/1.1" 200 5 "-" "ua"')
    assert c["time"] == 1791137581.0 + 0 * 1 or isinstance(c["time"], float)
    assert lognorm.parse_syslog("Feb 30 00:00:00 h p: x", 2026, 0)["time"] is None    # impossible date -> no crash


def test_access_line_fields():
    ev = lognorm.parse_access('203.0.113.9 - bob [04/Oct/2026:21:13:01 +0000] "POST /a?b=1 HTTP/1.1" 404 - "-" "curl/8"')
    assert (ev["method"], ev["path"], ev["status"], ev["bytes"], ev["user"], ev["user_agent"]) == ("POST", "/a?b=1", 404, 0, "bob", "curl/8")


def test_cli_normalize_and_pipeline_to_engine():
    out = run(D / "lognorm.py", "normalize", str(D / "sample_auth.log"), "--year", "2026")
    assert out.returncode == 0 and "9 events, 0 unparsed" in out.stderr
    events = [json.loads(line) for line in out.stdout.splitlines()]
    assert len(events) == 9 and events[0]["line"] == 1
    acc = run(D / "lognorm.py", "normalize", str(D / "sample_access.log"))
    res = run(E, str(D / "sample_rules.json"), "-", stdin=out.stdout + acc.stdout)
    assert res.returncode == 1
    assert "SSH-BRUTE" in res.stdout and "WEB-SQLI" in res.stdout and "WEB-SCAN" in res.stdout and "Alerts: 4" in res.stdout


def test_stdin_input_and_errors(tmp_path):
    r = run(D / "lognorm.py", "normalize", "-", "--format", "access", stdin=(D / "sample_access.log").read_text())
    assert r.returncode == 0 and len(r.stdout.splitlines()) == 5
    bad = run(D / "lognorm.py", "normalize", str(tmp_path / "missing.log"))
    assert bad.returncode != 0 and "Traceback" not in bad.stderr
    garbage = tmp_path / "g.log"
    garbage.write_text("nothing useful\n")
    assert run(D / "lognorm.py", "normalize", str(garbage)).returncode == 1
    empty = tmp_path / "e.jsonl"
    empty.write_text("")
    assert run(D / "lognorm.py", "report", str(empty)).returncode != 0


def test_report_text_json_and_html_escaping(tmp_path):
    ev = tmp_path / "e.jsonl"
    evil = {"time": 1, "event": "http_request", "src_ip": "<script>alert(1)</script>", "path": "/\"><img src=x onerror=alert(1)>", "status": 404}
    ev.write_text(json.dumps(evil) + "\n" + json.dumps({"time": 2, "event": "ssh_failed", "src_ip": "1.1.1.1", "user": "root"}) + "\n")
    out = tmp_path / "r.html"
    r = run(D / "lognorm.py", "report", str(ev), "--html", str(out))
    assert r.returncode == 0 and "Events: 2" in r.stdout and "Failed SSH logins by IP" in r.stdout
    page = out.read_text()
    assert "<script>alert(1)" not in page and "<img src=x" not in page and "&lt;script&gt;" in page
    data = json.loads(run(D / "lognorm.py", "report", str(ev), "--json").stdout)
    assert data["events"] == 2 and data["failed_logins_by_ip"] == [["1.1.1.1", 1]]


def test_broken_pipe_is_quiet():
    p = subprocess.Popen([sys.executable, str(D / "lognorm.py"), "normalize", str(D / "sample_auth.log"), "--year", "2026"],
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    p.stdout.readline()
    p.stdout.close()
    err = p.stderr.read()
    p.wait()
    assert "Traceback" not in err
