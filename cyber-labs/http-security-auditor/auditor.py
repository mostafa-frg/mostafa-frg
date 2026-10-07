#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("HTTP SECURITY AUDITOR")
except Exception:
    pass
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
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("URL must include a valid http or https host")
    if timeout <= 0:
        raise ValueError("Timeout must be greater than 0")
    req = urllib.request.Request(url, headers={"User-Agent": "security-auditor/1.0"})
    try:
        context = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=timeout, context=context) as res:
            headers = {k.lower(): v for k, v in res.headers.items()}
            findings = [{"check": name, "present": key in headers, "value": headers.get(key)}
                        for key, name in CHECKS.items()]
            cookies = res.headers.get_all("Set-Cookie") or []
            return {"url": url, "status": res.status, "headers": headers,
                    "security_checks": findings, "set_cookie_count": len(cookies)}
    except urllib.error.HTTPError as exc:
        return {"url": url, "status": exc.code, "error": str(exc)}
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return {"url": url, "error": str(exc)}

def main():
    ap = argparse.ArgumentParser(description="HTTP response security-header auditor")
    ap.add_argument("url")
    ap.add_argument("--timeout", type=float, default=8)
    ap.add_argument("--json", dest="output")
    args = ap.parse_args()
    try:
        report = audit(args.url, args.timeout)
    except ValueError as exc:
        raise SystemExit(str(exc))
    text = json.dumps(report, indent=2)
    if args.output:
        try:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(text)
        except OSError as exc:
            raise SystemExit(f"Cannot write report: {exc}")
    else:
        print(text)

if __name__ == "__main__":
    main()
