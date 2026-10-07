import json
import os
import subprocess
import sys
from pathlib import Path

FIM = Path(__file__).parents[1] / "file-integrity-monitor" / "fim.py"


def run(*args, env=None):
    e = {k: v for k, v in os.environ.items() if not k.startswith("MOSTA_")}
    e.update(env or {})
    return subprocess.run([sys.executable, str(FIM), *args], text=True, capture_output=True, env=e)


def make_tree(tmp_path):
    d = tmp_path / "tree"
    (d / "sub").mkdir(parents=True)
    (d / "a.txt").write_text("alpha")
    (d / "sub" / "b.txt").write_text("bravo")
    (d / "skip.log").write_text("noise")
    return d


def test_clean_then_detects_every_change_type(tmp_path):
    d, base = make_tree(tmp_path), tmp_path / "base.json"
    assert run("init", str(d), "--baseline", str(base), "--exclude", "*.log").returncode == 0
    r = run("check", str(d), "--baseline", str(base), "--exclude", "*.log")
    assert r.returncode == 0 and "OK: no changes" in r.stdout
    (d / "a.txt").write_text("ALPHA")           # modified
    (d / "sub" / "b.txt").unlink()               # removed
    (d / "new.txt").write_text("new")            # added
    (d / "skip.log").write_text("still ignored")
    r = run("check", str(d), "--baseline", str(base), "--exclude", "*.log")
    assert r.returncode == 1
    for line in ("[MODIFIED] a.txt", "[REMOVED] sub/b.txt", "[ADDED] new.txt"):
        assert line in r.stdout
    assert "skip.log" not in r.stdout


def test_permission_change_and_json_output(tmp_path):
    d, base = make_tree(tmp_path), tmp_path / "base.json"
    run("init", str(d), "--baseline", str(base))
    os.chmod(d / "a.txt", 0o600)
    out = json.loads(run("check", str(d), "--baseline", str(base), "--json").stdout)
    assert out["clean"] is False and out["permissions"] == ["a.txt"]


def test_baseline_is_not_part_of_the_scan_when_inside_tree(tmp_path):
    d = make_tree(tmp_path)
    base = d / "base.json"
    run("init", str(d), "--baseline", str(base))
    assert run("check", str(d), "--baseline", str(base)).returncode == 0


def test_hmac_detects_tampered_baseline(tmp_path):
    d, base = make_tree(tmp_path), tmp_path / "base.json"
    env = {"MOSTA_FIM_KEY": "secret"}
    run("init", str(d), "--baseline", str(base), env=env)
    assert run("check", str(d), "--baseline", str(base), env=env).returncode == 0
    data = json.loads(base.read_text())
    data["files"]["a.txt"]["sha256"] = "0" * 64
    base.write_text(json.dumps(data))
    r = run("check", str(d), "--baseline", str(base), env=env)
    assert r.returncode == 2 and "signature mismatch" in r.stderr
    assert run("check", str(d), "--baseline", str(base), env={"MOSTA_FIM_KEY": "wrong"}).returncode == 2


def test_friendly_errors(tmp_path):
    r = run("check", str(tmp_path), "--baseline", str(tmp_path / "missing.json"))
    assert r.returncode != 0 and "Traceback" not in r.stderr and "cannot read baseline" in r.stderr
    r = run("init", str(tmp_path / "nope"), "--baseline", str(tmp_path / "b.json"))
    assert r.returncode != 0 and "not a directory" in r.stderr


def test_symlinks_are_not_followed(tmp_path):
    d, base = make_tree(tmp_path), tmp_path / "base.json"
    (d / "link").symlink_to("/etc/hostname")
    run("init", str(d), "--baseline", str(base))
    assert "link" not in json.loads(base.read_text())["files"]
