#!/usr/bin/env python3
"""Cross-platform, local-first desktop diagnostics. Python standard library only."""
from __future__ import annotations
import argparse, hashlib, ipaddress, json, re, socket, ssl, struct, sys, time, urllib.error, urllib.parse, urllib.request
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
    downgraded = parsed.scheme == "https" and scheme != "https"
    check("HTTPS redirect integrity", not downgraded, "No HTTPS downgrade" if not downgraded else "HTTPS redirected to HTTP")
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


def tls_check(host: str, port: int = 443, timeout: float = 5.0) -> dict:
    if not host or host.strip() != host or any(c.isspace() for c in host):
        raise ValueError("Provide one hostname or IP address")
    if not 1 <= port <= 65535 or not 0.1 <= timeout <= 30:
        raise ValueError("Port must be 1–65535 and timeout 0.1–30 seconds")
    context = ssl.create_default_context()
    raw = socket.create_connection((host, port), timeout=timeout)
    try:
        with context.wrap_socket(raw, server_hostname=host) as connection:
            cert = connection.getpeercert()
            der = connection.getpeercert(binary_form=True)
            if not cert or not der:
                raise ValueError("Peer did not provide a verifiable certificate")
            expiry = ssl.cert_time_to_seconds(cert["notAfter"])
            sans = [value for kind, value in cert.get("subjectAltName", ()) if kind in {"DNS", "IP Address"}]
            fingerprint = hashlib.sha256(der).hexdigest()
            return {
                "host": host, "port": port, "tls_version": connection.version(),
                "cipher": connection.cipher()[0] if connection.cipher() else None,
                "subject": cert.get("subject", ()), "issuer": cert.get("issuer", ()),
                "subject_alt_names": sans, "expires_at": cert["notAfter"],
                "days_remaining": int((expiry - time.time()) // 86400),
                "sha256_fingerprint": ":".join(fingerprint[i:i+2] for i in range(0, len(fingerprint), 2)),
                "verification": "passed",
            }
    finally:
        raw.close()

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




AUTH_SSH_RE = re.compile(
    r"\b(?P<result>Failed password|Accepted password|Accepted publickey|Failed publickey) "
    r"for (?:(?:invalid user) )?\S+ from (?P<ip>[0-9a-fA-F:.]+) port \d+\b"
)
AUTH_INVALID_RE = re.compile(r"\bInvalid user \S+ from (?P<ip>[0-9a-fA-F:.]+) port \d+\b")
AUTH_PAM_RE = re.compile(r"\brhost=(?P<ip>[0-9a-fA-F:.]+)\b")

def _masked_source(value: str) -> str | None:
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        return None
    prefix = 24 if address.version == 4 else 48
    return ipaddress.ip_network(f"{address}/{prefix}", strict=False).with_prefixlen

def auth_summary(path: Path) -> dict:
    """Aggregate common Linux SSH/PAM/sudo log events without exposing identities."""
    if path.is_symlink() or not path.is_file():
        raise ValueError("Expected an existing regular authentication log file")
    counts = Counter()
    sources = Counter()
    lines_scanned = events = 0
    with path.open(encoding="utf-8", errors="replace") as stream:
        for line in stream:
            lines_scanned += 1
            ssh = AUTH_SSH_RE.search(line)
            invalid = AUTH_INVALID_RE.search(line)
            if ssh:
                result = ssh.group("result")
                category = "ssh_accepted" if result.startswith("Accepted") else "ssh_failed"
                counts[category] += 1
                events += 1
                masked = _masked_source(ssh.group("ip"))
                if masked:
                    sources[masked] += 1
                if "invalid user" in line.lower():
                    counts["invalid_user"] += 1
            elif invalid:
                counts["invalid_user"] += 1
                events += 1
                masked = _masked_source(invalid.group("ip"))
                if masked:
                    sources[masked] += 1
            elif "authentication failure" in line.lower():
                counts["pam_failures"] += 1
                events += 1
                source = AUTH_PAM_RE.search(line)
                if source:
                    masked = _masked_source(source.group("ip"))
                    if masked:
                        sources[masked] += 1
            if re.search(r"\bsudo(?:\[\d+\])?:\s+\S+\s*:", line):
                counts["sudo_events"] += 1
                events += 1
    failed = counts["ssh_failed"] + counts["pam_failures"]
    accepted = counts["ssh_accepted"]
    return {
        "lines_scanned": lines_scanned,
        "events": events,
        "ssh_failed": counts["ssh_failed"],
        "ssh_accepted": accepted,
        "pam_failures": counts["pam_failures"],
        "invalid_user_events": counts["invalid_user"],
        "sudo_events": counts["sudo_events"],
        "failed_auth_total": failed,
        "accepted_auth_total": accepted,
        "unique_source_networks": len(sources),
        "top_source_networks": [
            {"network": network, "events": count}
            for network, count in sources.most_common(10)
        ],
        "privacy": "Usernames, raw IP addresses, and sudo command contents are not included; source IPs are grouped into IPv4 /24 or IPv6 /48 networks.",
        "limitations": "Parses common Linux OpenSSH, PAM, and sudo text-log patterns; journald binary exports, Windows event logs, and vendor-specific formats are not supported.",
    }

def subnet_info(value: str) -> dict:
    """Calculate IPv4 subnet boundaries locally; no network traffic is generated."""
    if not value or value.strip() != value or any(c.isspace() for c in value):
        raise ValueError("Provide one IPv4 address or CIDR network")
    try:
        network = ipaddress.ip_network(value, strict=False)
    except ValueError as exc:
        raise ValueError(f"Invalid IP network: {exc}") from exc
    if not isinstance(network, ipaddress.IPv4Network):
        raise ValueError("The subnet calculator currently supports IPv4 only")
    usable = network.num_addresses if network.prefixlen >= 31 else max(0, network.num_addresses - 2)
    first = network.network_address if network.prefixlen >= 31 else network.network_address + 1
    last = network.broadcast_address if network.prefixlen >= 31 else network.broadcast_address - 1
    return {
        "input": value, "network": str(network.network_address),
        "cidr": str(network), "prefix_length": network.prefixlen,
        "netmask": str(network.netmask), "wildcard_mask": str(network.hostmask),
        "broadcast": str(network.broadcast_address),
        "total_addresses": network.num_addresses, "usable_hosts": usable,
        "first_usable": str(first), "last_usable": str(last),
    }

PCAP_MAGICS = {
    b"\xd4\xc3\xb2\xa1": "<",
    b"\xa1\xb2\xc3\xd4": ">",
    b"\x4d\x3c\xb2\xa1": "<",
    b"\xa1\xb2\x3c\x4d": ">",
}
PCAP_MAX_PACKET = 64 * 1024 * 1024

def pcap_summary(path: Path) -> dict:
    """Summarize classic Ethernet PCAP headers without exposing packet payloads or IPs."""
    if path.is_symlink() or not path.is_file():
        raise ValueError("Expected an existing regular PCAP file")
    protocols = Counter()
    destination_ports = Counter()
    packets = malformed = truncated = ipv4 = ipv6 = 0
    with path.open("rb") as stream:
        header = stream.read(24)
        if len(header) != 24:
            raise ValueError("File is too short to contain a classic PCAP header")
        endian = PCAP_MAGICS.get(header[:4])
        if endian is None:
            raise ValueError("Unsupported capture format; classic PCAP is required (PCAPNG is not supported)")
        major, minor, _zone, _sigfigs, snaplen, network = struct.unpack(endian + "HHIIII", header[4:])
        if (major, minor) not in {(2, 4)}:
            raise ValueError("Unsupported classic PCAP version")
        if not 1 <= snaplen <= PCAP_MAX_PACKET:
            raise ValueError("Invalid or excessive PCAP snapshot length")
        if (network & 0xffff) != 1:
            raise ValueError("Only Ethernet-linktype PCAP files are supported")
        while True:
            record = stream.read(16)
            if not record:
                break
            if len(record) != 16:
                raise ValueError("Truncated PCAP packet record header")
            _seconds, _fraction, included, original = struct.unpack(endian + "IIII", record)
            if included > snaplen or included > PCAP_MAX_PACKET or included > original:
                raise ValueError("Invalid PCAP packet length")
            frame = stream.read(included)
            if len(frame) != included:
                truncated += 1
                break
            packets += 1
            if len(frame) < 14:
                malformed += 1
                continue
            ethertype = struct.unpack("!H", frame[12:14])[0]
            offset = 14
            while ethertype in {0x8100, 0x88a8, 0x9100}:
                if len(frame) < offset + 4:
                    malformed += 1
                    ethertype = None
                    break
                ethertype = struct.unpack("!H", frame[offset + 2:offset + 4])[0]
                offset += 4
            if ethertype is None:
                continue
            protocol = None
            transport_offset = None
            if ethertype == 0x0800:
                if len(frame) < offset + 20 or frame[offset] >> 4 != 4:
                    malformed += 1
                    continue
                ihl = (frame[offset] & 0x0f) * 4
                total_length = struct.unpack("!H", frame[offset + 2:offset + 4])[0]
                if ihl < 20 or total_length < ihl or len(frame) < offset + ihl:
                    malformed += 1
                    continue
                ipv4 += 1
                protocol = frame[offset + 9]
                fragment = struct.unpack("!H", frame[offset + 6:offset + 8])[0] & 0x1fff
                if fragment == 0:
                    transport_offset = offset + ihl
            elif ethertype == 0x86dd:
                if len(frame) < offset + 40 or frame[offset] >> 4 != 6:
                    malformed += 1
                    continue
                ipv6 += 1
                protocol = frame[offset + 6]
                transport_offset = offset + 40
            else:
                protocols["other"] += 1
                continue
            if protocol == 6:
                protocols["tcp"] += 1
            elif protocol == 17:
                protocols["udp"] += 1
            elif protocol in {1, 58}:
                protocols["icmp"] += 1
            else:
                protocols["other"] += 1
            if protocol in {6, 17} and transport_offset is not None:
                if len(frame) >= transport_offset + 4:
                    _source_port, destination_port = struct.unpack(
                        "!HH", frame[transport_offset:transport_offset + 4])
                    destination_ports[destination_port] += 1
                else:
                    malformed += 1
    return {
        "format": "classic-pcap", "link_type": "Ethernet",
        "packets": packets, "ipv4_packets": ipv4, "ipv6_packets": ipv6,
        "protocols": dict(sorted(protocols.items())),
        "top_destination_ports": [
            {"port": port, "packets": count}
            for port, count in sorted(destination_ports.items(), key=lambda item: (-item[1], item[0]))[:10]
        ],
        "malformed_packets": malformed, "truncated_records": truncated,
        "privacy": "Packet payloads and source/destination IP addresses are not stored in this report.",
        "limitations": "Classic Ethernet PCAP only; PCAPNG, non-Ethernet link types, and IPv6 extension-header traversal are not supported.",
    }

def _emit(data, as_json=False):
    if as_json:
        print(json.dumps(data, indent=2, sort_keys=True))
        return
    for key, value in data.items():
        label = key.replace("_", " ").capitalize()
        if isinstance(value, (dict, list)):
            print(f"{label}:")
            print(json.dumps(value, indent=2, sort_keys=True))
        else:
            print(f"{label}: {value}")

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
    p = sub.add_parser("tls-check", help="Inspect a verified TLS certificate on one endpoint"); p.add_argument("host"); p.add_argument("--port", type=int, default=443); p.add_argument("--timeout", type=float, default=5.0); p.add_argument("--json", action="store_true")
    p = sub.add_parser("log-summary", help="Summarize a local Apache/Nginx access log"); p.add_argument("file", type=Path); p.add_argument("--json", action="store_true")
    p = sub.add_parser("auth-summary", help="Summarize local Linux SSH, PAM and sudo authentication logs"); p.add_argument("file", type=Path); p.add_argument("--json", action="store_true")
    p = sub.add_parser("subnet", help="Calculate IPv4 subnet boundaries and host capacity"); p.add_argument("network"); p.add_argument("--json", action="store_true")
    p = sub.add_parser("pcap-summary", help="Summarize an offline classic Ethernet PCAP without exposing payloads"); p.add_argument("file", type=Path); p.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.command == "hash": result = file_hash(args.file, args.algorithm)
        elif args.command == "manifest":
            result = manifest_create(args.root, args.output, args.algorithm) if args.action == "create" else manifest_verify(args.root, args.manifest)
        elif args.command == "dns": result = dns_lookup(args.host, args.family)
        elif args.command == "tcp": result = tcp_check(args.host, args.port, args.timeout)
        elif args.command == "http-audit": result = http_audit(args.url, args.timeout)
        elif args.command == "tls-check": result = tls_check(args.host, args.port, args.timeout)
        elif args.command == "pcap-summary": result = pcap_summary(args.file)
        elif args.command == "auth-summary": result = auth_summary(args.file)
        elif args.command == "subnet": result = subnet_info(args.network)
        else: result = log_summary(args.file)
        _emit(result, getattr(args, "json", False))
        if args.command == "tcp" and not result["open"]: return 2
        if args.command == "manifest" and args.action == "verify" and not result["ok"]: return 2
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"deskops: {exc}", file=sys.stderr); return 2

if __name__ == "__main__":
    raise SystemExit(main())
