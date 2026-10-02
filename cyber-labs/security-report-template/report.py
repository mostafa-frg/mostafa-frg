#!/usr/bin/env python3
import argparse,datetime
p=argparse.ArgumentParser(); p.add_argument("--title",required=True); p.add_argument("--output",default="report.md"); a=p.parse_args()
text=f"""# {a.title}

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
open(a.output,"w",encoding="utf-8").write(text)
print(f"Wrote {a.output}")
