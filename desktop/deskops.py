#!/usr/bin/env python3
"""Cross-platform, local-first desktop diagnostics. Python standard library only."""
from __future__ import annotations
import argparse, hashlib, json, re, socket, sys, urllib.error, urllib.parse, urllib.request
from collections import Counter
from pathlib import Path, PurePosixPath

FORMAT = "deskops-manifest-v1"
CHUNK = 1024 * 1024

def file_hash(path: Path, algorithm: str = "sha256") -> dict:
    if algorithm not in {"sha256", "sha512"}:
        raise ValueError("Algorithm must be sha256 or sha512")
    if path.is_symlink() or not path.is_file():
        raise ValueError("Expected an existing regular file (symlinks are skipped)")
    digest, size = hashlib.new(algorithm), 0
    with path.open("rb") as stream:
        while chunk := stream.read(CHUNK):
            digest.update(chunk); size += len(chunk)
    return {"algorithm": algorithm, "digest": digest.hexdigest(), "size": size}

def _files(root: Path, excluded: Path | None = None):
    for item in sorted(root.rglob("*")):
        if item.is_symlink() or not item.is_file():
            continue
        if excluded is not None and item.resolve() == excluded.resolve():
            continue
        yield item

def manifest_create(root: Path, output: Path, algorithm: str) -> dict:
    base = root.resolve(strict=True)
    if not base.is_dir():
        raise ValueError("Root must be a directory")
    if algorithm not in {"sha256", "sha512"}:
        raise ValueError("Algorithm must be sha256 or sha512")
    destination = output.resolve()
    entries = []
    for item in _files(base, destination):
        result = file_hash(item, algorithm)
        entries.append({"path": item.relative_to(base).as_posix(),
                        "size": result["size"], "digest": result["digest"]})
    doc = {"format": FORMAT, "algorithm": algorithm, "file_count": len(entries), "files": entries}
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(doc, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {"ok": True, "file_count": len(entries), "output": destination.name}

def manifest_verify(root: Path, manifest: Path) -> dict:
    base = root.resolve(strict=True)
    if not base.is_dir():
        raise ValueError("Root must be a directory")
    doc = json.loads(manifest.read_text(encoding="utf-8"))
    if not isinstance(doc, dict) or doc.get("format") != FORMAT:
        raise ValueError("Unsupported manifest format")
    algorithm, entries = doc.get("algorithm"), doc.get("files")
    if algorithm not in {"sha256", "sha512"} or not isinstance(entries, list):
        raise ValueError("Invalid manifest algorithm or file list")
    expected = {}
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("path"), str):
            raise ValueError("Invalid manifest entry")
        raw = entry["path"]
        rel = PurePosixPath(raw)
        if not raw or "\\" in raw or rel.is_absolute() or ".." in rel.parts or "." in rel.parts:
            raise ValueError("Manifest path escapes the selected root")
        if raw in expected:
            raise ValueError("Duplicate manifest path")
        expected[raw] = entry
    actual = {p.relative_to(base).as_posix(): p for p in _files(base, manifest.resolve())}
    missing, modified, added = [], [], []
    for name, entry in expected.items():
        item = actual.get(name)
        if item is None:
            missing.append(name); continue
        result = file_hash(item, algorithm)
        if result["digest"] != entry.get("digest") or result["size"] != entry.get("size"):
            modified.append(name)
    added = sorted(set(actual) - set(expected))
    return {"ok": not (missing or modified or added), "algorithm": algorithm,
            "expected_files": len(expected), "actual_files": len(actual),
            "missing": sorted(missing), "modified": sorted(modified), "added": added}

def dns_lookup(host: str, family: str = "any") -> dict:
    if not host or host.strip() != host or any(c.isspace() for c in host):
        raise ValueError("Provide one hostname or IP address")
    families = {"any": socket.AF_UNSPEC, "ipv4": socket.AF_INET, "ipv6": socket.AF_INET6}
    if family not in families:
        raise ValueError("Family must be any, ipv4 or ipv6")
    records = socket.getaddrinfo(host, None, family=families[family], type=socket.SOCK_STREAM)
    addresses = sorted({record[4][0] for record in records})
    if not addresses:
        raise OSError("No addresses returned")
    return {"host": host, "family": family, "addresses": addresses}

def tcp_check(host: str, port: int, timeout: float = 3.0) -> dict:
    if not host or host.strip() != host or any(c.isspace() for c in host):
        raise ValueError("Provide one hostname or IP address")
    if not 1 <= port <= 65535 or not 0.1 <= timeout <= 30:
        raise ValueError("Port must be 1–65535 and timeout 0.1–30 seconds")
    try:
        conn = socket.create_connection((host, port), timeout=timeout); conn.close()
        return {"host": host, "port": port, "open": True, "error": None}
    except OSError as exc:
        return {"host": host, "port": port, "open": False, "error": type(exc).__name__}

def http_audit(url: str, timeout: float = 8.0) -> dict:
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Use an absolute http:// or https:// URL")
    if parsed.username or parsed.password:
        raise ValueError("URLs with embedded credentials are not accepted")
    if not 0.1 <= timeout <= 30:
        raise ValueError("Timeout must be 0.1–30 seconds")
    request = urllib.request.Request(url, headers={
        "User-Agent": "DeskOps-Header-Audit/1.0", "Range": "bytes=0-0"}, method="GET")
    try:
        response = urllib.request.urlopen(request, timeout=timeout)
    except urllib.error.HTTPError as exc:
        response = exc
    try:
        status = int(response.status)
        headers = {k.lower(): v.strip() for k, v in response.headers.items()}
        scheme = urllib.parse.urlsplit(response.geturl()).scheme
    finally:
        response.close()
    if scheme not in {"http", "https"}:
        raise ValueError("Redirect target must use HTTP or HTTPS")
    checks = []
    def check(name, passed, detail):
        checks.append({"control": name, "status": "pass" if passed else "review", "detail": detail})
    https = scheme == "https"
    check("Strict-Transport-Security", not https or "strict-transport-security" in headers,
          "Present" if "strict-transport-security" in headers else ("Missing on HTTPS" if https else "Not applicable to HTTP"))
    check("Content-Security-Policy", "content-security-policy" in headers,
          "Present" if "content-security-policy" in headers else "Missing")
    check("X-Content-Type-Options", headers.get("x-content-type-options", "").lower() == "nosniff",
          "nosniff" if headers.get("x-content-type-options", "").lower() == "nosniff" else "Missing or not nosniff")
    csp = headers.get("content-security-policy", "").lower()
    framed = "x-frame-options" in headers or "frame-ancestors" in csp
    check("Clickjacking protection", framed, "X-Frame-Options or CSP frame-ancestors present" if framed else "No framing control found")
    for name in ("referrer-policy", "permissions-policy"):
        check(name, name in headers, "Present" if name in headers else "Missing")
    return {"status_code": status, "https": https, "checks": checks,
            "passed": sum(x["status"] == "pass" for x in checks),
            "review": sum(x["status"] == "review" for x in checks),
            "server_header_exposed": "server" in headers,
            "powered_by_header_exposed": "x-powered-by" in headers,
            "note": "Header review only; not a complete application security assessment."}

LOG_RE = re.compile(r'^(?P<ip>\S+) \S+ \S+ \[[^]]+\] "(?P<method>[A-Z]+) (?P<target>\S+) \S+" (?P<status>\d{3}) \S+')
def log_summary(path: Path) -> dict:
    if path.is_symlink() or not path.is_file():
        raise ValueError("Expected an existing regular log file")
    statuses, methods, paths, clients = Counter(), Counter(), Counter(), set()
    parsed = malformed = 0
    with path.open(encoding="utf-8", errors="replace") as stream:
        for line in stream:
            match = LOG_RE.match(line.rstrip("\r\n"))
            if not match:
                malformed += 1; continue
            parsed += 1; clients.add(match.group("ip"))
            statuses[match.group("status")] += 1; methods[match.group("method")] += 1
            paths[urllib.parse.urlsplit(match.group("target")).path or "/"] += 1
    return {"parsed_lines": parsed, "malformed_lines": malformed, "unique_clients": len(clients),
            "status_codes": dict(sorted(statuses.items())), "methods": dict(sorted(methods.items())),
            "top_paths": [{"path": k, "requests": v} for k, v in paths.most_common(10)],
            "privacy": "Client addresses are counted but never included in this report."}

def _emit(data, as_json=False):
    if as_json:
        print(json.dumps(data, indent=2, sort_keys=True))
    else:
        print(json.dumps(data, indent=2, sort_keys=True))

def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="deskops", description="Cross-platform desktop diagnostics and defensive utilities")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("hash", help="Hash a local file"); p.add_argument("file", type=Path)
    p.add_argument("--algorithm", choices=("sha256", "sha512"), default="sha256"); p.add_argument("--json", action="store_true")
    p = sub.add_parser("manifest", help="Create or verify a local file-integrity manifest")
    actions = p.add_subparsers(dest="action", required=True)
    c = actions.add_parser("create"); c.add_argument("root", type=Path); c.add_argument("--output", type=Path, default=Path("deskops-manifest.json"))
    c.add_argument("--algorithm", choices=("sha256", "sha512"), default="sha256"); c.add_argument("--json", action="store_true")
    v = actions.add_parser("verify"); v.add_argument("root", type=Path); v.add_argument("--manifest", type=Path, default=Path("deskops-manifest.json")); v.add_argument("--json", action="store_true")
    p = sub.add_parser("dns", help="Resolve a hostname using the system resolver"); p.add_argument("host")
    p.add_argument("--family", choices=("any", "ipv4", "ipv6"), default="any"); p.add_argument("--json", action="store_true")
    p = sub.add_parser("tcp", help="Check one TCP endpoint (no port scanning)"); p.add_argument("host"); p.add_argument("port", type=int)
    p.add_argument("--timeout", type=float, default=3.0); p.add_argument("--json", action="store_true")
    p = sub.add_parser("http-audit", help="Review HTTP response security headers"); p.add_argument("url")
    p.add_argument("--timeout", type=float, default=8.0); p.add_argument("--json", action="store_true")
    p = sub.add_parser("log-summary", help="Summarize a local Apache/Nginx access log"); p.add_argument("file", type=Path); p.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.command == "hash": result = file_hash(args.file, args.algorithm)
        elif args.command == "manifest":
            result = manifest_create(args.root, args.output, args.algorithm) if args.action == "create" else manifest_verify(args.root, args.manifest)
        elif args.command == "dns": result = dns_lookup(args.host, args.family)
        elif args.command == "tcp": result = tcp_check(args.host, args.port, args.timeout)
        elif args.command == "http-audit": result = http_audit(args.url, args.timeout)
        else: result = log_summary(args.file)
        _emit(result, getattr(args, "json", False))
        if args.command == "tcp" and not result["open"]: return 2
        if args.command == "manifest" and args.action == "verify" and not result["ok"]: return 2
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"deskops: {exc}", file=sys.stderr); return 2

if __name__ == "__main__":
    raise SystemExit(main())
