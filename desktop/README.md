# DeskOps — Desktop Engineering & Security Toolkit

A cross-platform command-line toolkit for Windows 10/11, Linux desktops and macOS. It uses only the Python standard library; no Android, Termux, root access, external Python packages, telemetry, account, or cloud service is required.

## Privacy model

- File hashing, manifest verification, and access-log analysis run locally.
- No telemetry, analytics, background service, account, or automatic upload.
- File manifests store relative paths, sizes, and cryptographic digests — never absolute paths.
- Access-log reports count client addresses but do not print or export the addresses.
- DNS queries use the operating system's configured resolver. TCP checks connect only to the single host and port explicitly supplied.
- HTTP header audit sends a small HTTP request to the URL you explicitly provide. The destination receives the request and your network address as it normally would.
- No passwords, tokens, browser profiles, environment variables, or personal files are collected.

## Requirements

- Python 3.10 or newer
- Windows PowerShell / Command Prompt, or a Linux/macOS terminal
- No administrator/root permissions for the included commands

## Run from a GitHub checkout

    git clone https://github.com/mostafa-frg/mostafa-frg.git
    cd mostafa-frg/desktop
    python -m deskops --help

On Windows, use py -3 -m deskops --help if python is not on PATH.

## Commands

### 1. File hash

    python -m deskops hash ./sample.bin
    python -m deskops hash ./sample.bin --algorithm sha512 --json

Streams the file in bounded chunks; it does not load the entire file into memory.

### 2. File integrity manifest

    python -m deskops manifest create ./important-folder --output ./baseline.json
    python -m deskops manifest verify ./important-folder --manifest ./baseline.json

The manifest contains relative paths and SHA-256 digests. Verification reports missing, modified, and added files. Symlinks are skipped. Keep the baseline somewhere attackers who can modify the target folder cannot also modify.

### 3. DNS resolution

    python -m deskops dns example.com
    python -m deskops dns example.com --family ipv4

Uses the machine's configured DNS resolver and returns unique addresses.

### 4. Single TCP endpoint check

    python -m deskops tcp example.com 443 --timeout 3

Checks exactly one explicitly supplied endpoint. It is not a port scanner.

### 5. HTTP security-header review

    python -m deskops http-audit https://example.com

Reviews HSTS, CSP, clickjacking controls, MIME-sniffing protection, Referrer-Policy, and Permissions-Policy. It sends a GET request with a one-byte Range hint, does not intentionally download the response body, and follows normal HTTP redirects. Use only on systems you own or are authorized to assess. This is not a full application security test.

### 6. Local web access-log summary

    python -m deskops log-summary ./access.log --json

Parses common Apache/Nginx combined access-log lines. The report contains aggregate counts, not client IP values or query strings.

## Exit codes

- 0: command completed successfully (or endpoint is reachable).
- 2: invalid input, I/O failure, endpoint unavailable, or integrity differences detected.

## Validation

Run the offline test suite:

    python -m unittest discover -s tests -v

GitHub Actions runs the suite on Windows and Ubuntu. Network-dependent commands are unit-tested with mocked sockets/HTTP responses; live connectivity depends on the user's network, DNS and target availability.

## Safe-use boundaries

Only test systems and networks you own or have explicit permission to assess. The toolkit intentionally does not provide arbitrary shell execution, credential collection, stealth, persistence, exploitation, or uncontrolled network scanning.
