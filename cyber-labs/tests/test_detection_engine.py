import json
import os
import subprocess
import sys
from pathlib import Path

D = Path(__file__).parents[1] / "detection-rules-engine"
sys.path.insert(0, str(D))
import engine  # noqa: E402


def cli(*args):
    env = {k: v for k, v in os.environ.items() if not k.startswith("MOSTA_")}
    return subprocess.run([sys.executable, str(D / "engine.py"), *args], text=True, capture_output=True, env=env)


def test_sample_data_produces_exactly_the_expected_alerts():
    out = json.loads(cli(str(D / "sample_rules.json"), str(D / "sample_events.jsonl"), "--json").stdout)
    got = {a["rule"]: a for a in out["alerts"]}
    assert set(got) == {"SSH-BRUTE", "ROOT-LOGIN", "SUSP-CMD", "ADMIN-ADD"}
    assert got["SSH-BRUTE"]["group"] == {"src_ip": "203.0.113.9"} and got["SSH-BRUTE"]["count"] == 6
    assert out["alerts"][0]["level"] == "critical"  # sorted by severity


def test_threshold_respects_window_and_groups():
    rule = {"id": "R", "level": "high", "match": {"all": [{"field": "e", "op": "eq", "value": "x"}]},
            "threshold": {"count": 3, "window": 10, "group_by": ["ip"]}}
    spread = [(i + 1, {"time": i * 20, "e": "x", "ip": "1.1.1.1"}) for i in range(5)]   # 20s apart: never 3 in 10s
    assert engine.run([rule], spread) == []
    mixed = [(1, {"time": 0, "e": "x", "ip": "a"}), (2, {"time": 1, "e": "x", "ip": "b"}), (3, {"time": 2, "e": "x", "ip": "a"})]
    assert engine.run([rule], mixed) == []                                            # 2 per group only
    burst = [(i + 1, {"time": i, "e": "x", "ip": "a"}) for i in range(7)]
    alerts = engine.run([rule], burst)
    assert len(alerts) == 1 and alerts[0]["count"] == 7                               # one extended alert, not five


def test_operators_and_nested_fields():
    ev = {"n": 5, "s": "Hello World", "p": {"q": "abc"}}
    c = lambda f, op, v=None: engine.cond_matches({"field": f, "op": op, "value": v}, ev)
    assert c("n", "gt", 4) and not c("n", "lt", 4) and c("s", "contains", "world") and c("p.q", "startswith", "ab")
    assert c("p.q", "regex", "^a.c$") and c("n", "in", [1, 5]) and c("p.missing", "exists", False) and not c("zz", "eq", 1)
    assert not c("s", "gt", 1)  # non-numeric comparison is a non-match, not a crash


def test_validation_errors_are_clear(tmp_path):
    bad = tmp_path / "bad.json"
    for payload, msg in (([], "non-empty"), ([{"id": "A", "match": {"all": [{"field": "f", "op": "nope"}]}}], "bad condition"),
                         ([{"id": "A", "match": {"all": [{"field": "f", "op": "regex", "value": "("}]}}], "invalid regex"),
                         ([{"id": "A", "level": "huge", "match": {"all": [{"field": "f", "op": "eq", "value": 1}]}}], "level"),
                         ([{"id": "A", "match": {"all": [{"field": "f", "op": "eq"}]}, "threshold": {"count": 0, "window": 5}}], "threshold")):
        bad.write_text(json.dumps(payload))
        r = cli(str(bad), str(D / "sample_events.jsonl"))
        assert r.returncode != 0 and msg in r.stderr and "Traceback" not in r.stderr


def test_bad_log_lines_are_skipped_and_exit_codes(tmp_path):
    logs = tmp_path / "l.jsonl"
    logs.write_text('not json\n[1,2]\n{"event":"nothing"}\n')
    r = cli(str(D / "sample_rules.json"), str(logs))
    assert r.returncode == 0 and "Skipped: 2" in r.stdout and "Alerts: 0" in r.stdout
    assert cli(str(D / "sample_rules.json"), str(tmp_path / "missing.jsonl")).returncode != 0
    out = cli(str(D / "sample_rules.json"), str(D / "sample_events.jsonl"), "--min-level", "critical").stdout
    assert "[CRITICAL]" in out and "[HIGH]" not in out and "Alerts: 1" in out
