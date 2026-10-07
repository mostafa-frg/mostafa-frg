"""Shared Mosta start-up banner for the Python tools.

The banner goes to stderr and is only drawn on an interactive terminal, so piped
output, JSON files and tests are never polluted.

Environment variables:
  MOSTA_BANNER=never|always|auto   (default: auto = only on a TTY)
  NO_COLOR=1                       disable colors
  MOSTA_BANNER_SHOWN=1             set by launchers to avoid a duplicate banner
"""
import os
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_FALLBACK_LOGO = "MOSTA"
_TAGLINE = "Network & Security Toolkit"
_NOTICE = "Use only on systems you are authorized to test."


def _read(name, default):
    try:
        return (_HERE / name).read_text(encoding="utf-8").rstrip("\n")
    except OSError:
        return default


def version():
    return _read("VERSION", "dev").strip()


def render(tool, color=False):
    """Return the banner text for *tool* (no I/O)."""
    cyan, bold, dim, off = ("\033[36m", "\033[1m", "\033[2m", "\033[0m") if color else ("", "", "", "")
    rule = "=" * 40
    lines = [
        "",
        f"{cyan}{bold}{_read('logo.txt', _FALLBACK_LOGO)}{off}",
        f"{dim}{rule}{off}",
        f" {bold}{_TAGLINE}{off}  v{version()}",
        f" Tool : {cyan}{bold}{tool}{off}",
        f" {dim}{_NOTICE}{off}",
        f"{dim}{rule}{off}",
        "",
    ]
    return "\n".join(lines)


def show(tool, stream=None):
    """Draw the banner once per process tree. Returns True if it was drawn."""
    stream = stream or sys.stderr
    mode = os.environ.get("MOSTA_BANNER", "auto").lower()
    if mode in ("never", "0", "off", "no") or os.environ.get("MOSTA_BANNER_SHOWN"):
        return False
    tty = bool(getattr(stream, "isatty", lambda: False)())
    if mode != "always" and not tty:
        return False
    color = tty and not os.environ.get("NO_COLOR") and os.environ.get("TERM", "") != "dumb"
    stream.write(render(tool, color) + "\n")
    stream.flush()
    os.environ["MOSTA_BANNER_SHOWN"] = "1"
    return True
