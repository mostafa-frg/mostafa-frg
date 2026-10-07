"""Shared Mosta start-up banner for the Python tools.

The banner goes to stderr and is only drawn on an interactive terminal, so piped
output, JSON files and tests are never polluted.

Environment variables:
  MOSTA_BANNER=never|always|auto   (default: auto = only on a TTY)
  NO_COLOR=1                       disable colors
  MOSTA_ASCII=1                    force a plain-ASCII frame
  MOSTA_BANNER_SHOWN=1             set by launchers to avoid a duplicate banner
"""
import os
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_FALLBACK_LOGO = "MOSTA"
_TAGLINE = "Network & Security Toolkit"
_NOTICE = "Authorized use only"
_AUTHOR = "Mostafa Mahmoud"


def _read(name, default):
    try:
        return (_HERE / name).read_text(encoding="utf-8").rstrip("\n")
    except OSError:
        return default


def version():
    return _read("VERSION", "dev").strip()


def _unicode_ok():
    if os.environ.get("MOSTA_ASCII"):
        return False
    loc = (os.environ.get("LC_ALL") or os.environ.get("LC_CTYPE") or os.environ.get("LANG") or "").upper()
    return "UTF-8" in loc or "UTF8" in loc or bool(os.environ.get("TERMUX_VERSION"))


def _gradient(color):
    """256-color blue->cyan ramp when supported, plain cyan otherwise."""
    term = os.environ.get("TERM", "")
    if "256color" in term or os.environ.get("COLORTERM"):
        return [f"\033[1;38;5;{n}m" for n in (27, 33, 39, 45, 51, 87)]
    return ["\033[1;36m"] * 6


def render(tool, color=False):
    """Return the banner text for *tool* (no I/O)."""
    bold, dim, off = ("\033[1m", "\033[2m", "\033[0m") if color else ("", "", "")
    accent, warn = ("\033[1;36m", "\033[33m") if color else ("", "")
    uni = _unicode_ok()
    tl, tr, bl, br, h, v = ("\u256d", "\u256e", "\u2570", "\u256f", "\u2500", "\u2502") if uni else ("+", "+", "+", "+", "-", "|")
    bullet, dot, sign = ("\u25b8", "\u00b7", "\u26a0") if uni else (">", "-", "!")
    width = 38
    tool = tool if len(tool) <= width - 4 else tool[: width - 7] + "..."
    rows = [
        (f"{bullet} {tool}", f" {accent}{bullet} {tool}{off}"),
        (f"{_TAGLINE} {dot} v{version()}", f" {bold}{_TAGLINE}{off} {dim}{dot}{off} v{version()}"),
        (f"by {_AUTHOR}", f" {dim}by {_AUTHOR}{off}"),
        (f"{sign} {_NOTICE}", f" {warn}{sign} {_NOTICE}{off}"),
    ]
    logo = _read("logo.txt", _FALLBACK_LOGO).split("\n")
    ramp = _gradient(color)
    out = [""]
    for i, line in enumerate(logo):
        out.append(f"  {ramp[min(i, len(ramp) - 1)] if color else ''}{line}{off}")
    out.append(f"{dim}{tl}{h * (width)}{tr}{off}")
    for plain, styled in rows:
        pad = max(0, width - len(plain) - 1)
        out.append(f"{dim}{v}{off}{styled}{' ' * pad}{dim}{v}{off}")
    out.append(f"{dim}{bl}{h * (width)}{br}{off}")
    out.append("")
    return "\n".join(out)


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


if __name__ == "__main__":  # used by the shell launchers: python3 mosta_banner.py "TOOL NAME"
    show(" ".join(sys.argv[1:]) or "TOOL")
