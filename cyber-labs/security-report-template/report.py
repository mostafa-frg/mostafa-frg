#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("SECURITY REPORT")
except Exception:
    pass
import argparse,datetime
from pathlib import Path
def main():
    p=argparse.ArgumentParser(description="Generate a Markdown security assessment report template"); p.add_argument("--title",required=True); p.add_argument("--output",default="report.md"); a=p.parse_args()
    title=a.title.strip()
    if not title: p.error("--title cannot be empty")
    output=Path(a.output)
    if output.exists() and output.is_dir(): p.error("--output must be a file path")
    text=f"""# {title}

## Assessment Metadata
- Date: {datetime.date.today().isoformat()}
- Scope: Authorized environment
- Methodology: Manual validation and documented evidence

## Executive Summary

## Findings

### Finding 1
- Description:
- Evidence:
- Impact:
- Remediation:

## Retest

## Appendix
"""
    try: output.write_text(text,encoding="utf-8")
    except OSError as exc: p.error(f"cannot write report: {exc}")
    print(f"Wrote {output}")
if __name__=="__main__": main()
