#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("PRIVILEGE CHECK")
except Exception:
    pass
import argparse, os, stat

def main():
    p = argparse.ArgumentParser(description="Offline local privilege-boundary checks")
    p.add_argument("--path", action="append", default=[])
    a = p.parse_args()
    paths = a.path or ["/etc/passwd", "/etc/shadow", "/etc/sudoers"]
    for path in paths:
        try:
            st = os.stat(path)
            mode = stat.S_IMODE(st.st_mode)
            kind = "directory" if stat.S_ISDIR(st.st_mode) else "file"
            print(f"{path}: type={kind} owner={st.st_uid} group={st.st_gid} mode={oct(mode)}")
            if mode & stat.S_IWOTH:
                print("  [REVIEW] world-writable")
            if mode & stat.S_IWGRP:
                print("  [REVIEW] group-writable")
        except OSError as exc:
            print(f"{path}: unavailable ({exc})")

if __name__ == "__main__":
    main()
