#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("FILE INTEGRITY MONITOR")
except Exception:
    pass
"""File Integrity Monitor: baseline a directory with SHA-256, then detect changes.

Commands:
  init  DIR  [--baseline FILE]   record a baseline of every regular file under DIR
  check DIR  [--baseline FILE]   compare DIR with the baseline (exit 1 if anything differs)
  show       [--baseline FILE]   print baseline metadata

Offline and read-only: it never modifies the monitored directory.
Optional HMAC protection: set MOSTA_FIM_KEY so a tampered baseline is detected.
"""
import argparse
import fnmatch
import hashlib
import hmac
import json
import os
import stat
import sys
import time
from pathlib import Path

DEFAULT_BASELINE = "fim-baseline.json"
CHUNK = 1024 * 1024


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(CHUNK), b""):
            h.update(block)
    return h.hexdigest()


def excluded(rel, patterns):
    name = os.path.basename(rel)
    return any(fnmatch.fnmatch(rel, p) or fnmatch.fnmatch(name, p) for p in patterns)


def scan(root, patterns=(), baseline_path=None):
    """Return {relative_posix_path: {sha256,size,mode}} for regular files (symlinks are not followed)."""
    root = Path(root)
    skip = Path(baseline_path).resolve() if baseline_path else None
    result, errors = {}, []
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        dirnames.sort()
        for name in sorted(filenames):
            full = Path(dirpath) / name
            rel = full.relative_to(root).as_posix()
            if excluded(rel, patterns) or (skip and full.resolve() == skip):
                continue
            try:
                st = full.lstat()
                if not stat.S_ISREG(st.st_mode):
                    continue
                result[rel] = {"sha256": sha256_file(full), "size": st.st_size, "mode": oct(stat.S_IMODE(st.st_mode))}
            except OSError as exc:
                errors.append(f"{rel}: {exc.strerror or exc}")
    return result, errors


def _sign(files):
    key = os.environ.get("MOSTA_FIM_KEY")
    if not key:
        return None
    payload = json.dumps(files, sort_keys=True, separators=(",", ":")).encode()
    return hmac.new(key.encode(), payload, hashlib.sha256).hexdigest()


def compare(old, new):
    added = sorted(set(new) - set(old))
    removed = sorted(set(old) - set(new))
    changed = sorted(p for p in set(old) & set(new) if old[p]["sha256"] != new[p]["sha256"])
    perms = sorted(p for p in set(old) & set(new) if old[p]["sha256"] == new[p]["sha256"] and old[p]["mode"] != new[p]["mode"])
    return {"added": added, "removed": removed, "modified": changed, "permissions": perms}


def load_baseline(path):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        files = data["files"]
        if not isinstance(files, dict):
            raise ValueError("files must be an object")
    except (OSError, ValueError, KeyError) as exc:
        raise SystemExit(f"fim: cannot read baseline '{path}': {exc}")
    return data, files


def cmd_init(args):
    root = Path(args.dir)
    if not root.is_dir():
        raise SystemExit(f"fim: not a directory: {root}")
    files, errors = scan(root, args.exclude, args.baseline)
    data = {"version": 1, "created": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "root": str(root.resolve()), "count": len(files), "files": files}
    sig = _sign(files)
    if sig:
        data["hmac"] = sig
    Path(args.baseline).write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Baseline written: {args.baseline} ({len(files)} files){' [HMAC-protected]' if sig else ''}")
    for e in errors:
        print(f"[WARN] unreadable: {e}", file=sys.stderr)
    return 0


def cmd_check(args):
    root = Path(args.dir)
    if not root.is_dir():
        raise SystemExit(f"fim: not a directory: {root}")
    data, old = load_baseline(args.baseline)
    key_set = bool(os.environ.get("MOSTA_FIM_KEY"))
    if "hmac" in data and not key_set:
        print("[WARN] baseline is HMAC-protected but MOSTA_FIM_KEY is not set; signature not verified", file=sys.stderr)
    elif "hmac" in data and not hmac.compare_digest(data["hmac"], _sign(old) or ""):
        print("[ALERT] baseline signature mismatch: the baseline file was modified or the key is wrong", file=sys.stderr)
        return 2
    elif "hmac" not in data and key_set:
        print("[WARN] MOSTA_FIM_KEY is set but the baseline is not signed", file=sys.stderr)
    new, errors = scan(root, args.exclude, args.baseline)
    diff = compare(old, new)
    total = sum(len(v) for v in diff.values())
    if args.json:
        print(json.dumps({"clean": total == 0, "summary": {k: len(v) for k, v in diff.items()}, **diff, "unreadable": errors}, indent=2))
    else:
        for label, key in (("ADDED", "added"), ("REMOVED", "removed"), ("MODIFIED", "modified"), ("PERMISSIONS", "permissions")):
            for p in diff[key]:
                print(f"[{label}] {p}")
        for e in errors:
            print(f"[UNREADABLE] {e}")
        print("OK: no changes detected" if total == 0 else f"CHANGES: {total} (added={len(diff['added'])} removed={len(diff['removed'])} modified={len(diff['modified'])} permissions={len(diff['permissions'])})")
    return 0 if total == 0 else 1


def cmd_show(args):
    data, files = load_baseline(args.baseline)
    print(f"Baseline : {args.baseline}\nCreated  : {data.get('created', '?')}\nRoot     : {data.get('root', '?')}\nFiles    : {len(files)}\nSigned   : {'yes' if 'hmac' in data else 'no'}")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="SHA-256 file integrity monitor (read-only, offline)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name, fn in (("init", cmd_init), ("check", cmd_check)):
        sp = sub.add_parser(name, help=f"{name} a directory")
        sp.add_argument("dir")
        sp.add_argument("--baseline", default=DEFAULT_BASELINE)
        sp.add_argument("--exclude", action="append", default=[], metavar="GLOB", help="glob to ignore (repeatable)")
        if name == "check":
            sp.add_argument("--json", action="store_true")
        sp.set_defaults(fn=fn)
    sp = sub.add_parser("show", help="show baseline metadata")
    sp.add_argument("--baseline", default=DEFAULT_BASELINE)
    sp.set_defaults(fn=cmd_show)
    args = ap.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
