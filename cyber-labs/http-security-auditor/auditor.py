#!/usr/bin/env python3
import argparse
import json
import ssl
import urllib.error
import urllib.request
from urllib.parse import urlparse

CHECKS = {
    "strict-transport-security": "HSTS",
    "content-security-policy": "CSP",
    "x-content-type-options": "X-Content-Type-Options",
    "referrer-policy": "Referrer-Policy",
    "permissions-policy": "Permissions-Policy",
    "x-frame-options": "Frame Protection",
}

def audit(url, timeout):
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("URL must use http or https")
    req = urllib.request.Request(url, headers={"User-Agent": "security-auditor/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as res:
            headers = {k.lower(): v for k, v in res.headers.items()}
            findings = []
            for key, name in CHECKS.items():
                findings.append({
                    "check": name,
                    "present": key in headers,
                    "value": headers.get(key),
                })
            cookies = res.headers.get_all("Set-Cookie") or []
            return {"url": url, "status": res.status, "headers": headers,
                    "security_checks": findings, "set_cookie_count": len(cookies)}
    except urllib.error.HTTPError as exc:
        return {"url": url, "status": exc.code, "error": str(exc)}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--timeout", type=float, default=8)
    ap.add_argument("--json", dest="output")
    args = ap.parse_args()
    report = audit(args.url, args.timeout)
    text = json.dumps(report, indent=2)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(text)
    else:
        print(text)

if __name__ == "__main__":
    main()
