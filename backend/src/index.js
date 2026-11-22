// Cloudflare Workers WebCrypto supports PBKDF2 iteration counts up to 100,000.
// Keep this ceiling aligned with the login hash-upgrade path; verify before raising it.
const COOKIE="__Host-mosta_session",SESSION=604800,ITER=100000,LOGIN_PAIR_LIMIT=5,LOGIN_IP_LIMIT=20,BOOT_LIMIT=5,WINDOW=900,MAX_BODY=16384,MAX_SESSIONS=10;
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
const TOOLS=[
  {
    "id": "subnet",
    "name": "IPv4 Subnet Calculator",
    "group": "Networking",
    "mode": "browser",
    "description": "Calculate network address, broadcast, subnet mask, wildcard, host range and address capacity."
  },
  {
    "id": "cidr",
    "name": "CIDR & Subnet Mask Converter",
    "group": "Networking",
    "mode": "browser",
    "description": "Convert a CIDR prefix to dotted-decimal subnet and wildcard masks."
  },
  {
    "id": "range",
    "name": "IPv4 Range Calculator",
    "group": "Networking",
    "mode": "browser",
    "description": "Calculate the number of addresses and range boundaries between two IPv4 addresses."
  },
  {
    "id": "ipv4",
    "name": "IPv4 Binary & Decimal Converter",
    "group": "Networking",
    "mode": "browser",
    "description": "Convert IPv4 octets to binary and unsigned decimal representation."
  },
  {
    "id": "wildcard",
    "name": "Wildcard Mask Calculator",
    "group": "Networking",
    "mode": "browser",
    "description": "Generate a wildcard mask from a CIDR prefix and show its inverse subnet mask."
  },
  {
    "id": "ip-analyze",
    "name": "IPv4 Address Analyzer",
    "group": "Networking",
    "mode": "browser",
    "description": "Classify common private, shared, loopback, link-local, documentation, benchmarking, multicast and reserved IPv4 ranges."
  },
  {
    "id": "range-cidr",
    "name": "IP Range to CIDR Summarizer",
    "group": "Networking",
    "mode": "browser",
    "description": "Summarize a continuous IPv4 range into the smallest set of aligned CIDR networks."
  },
  {
    "id": "ipv6",
    "name": "IPv6 Address Validator & Compressor",
    "group": "Networking",
    "mode": "browser",
    "description": "Validate a standard hexadecimal IPv6 address and compress its longest zero run."
  },
  {
    "id": "subnet-split",
    "name": "IPv4 Subnet Split Planner",
    "group": "Networking",
    "mode": "browser",
    "description": "Divide an IPv4 network into the required number of equal-sized subnets and list their boundaries."
  },
  {
    "id": "dns",
    "name": "DNS Record Lookup",
    "group": "Networking",
    "mode": "external",
    "description": "Query A, AAAA, CNAME, MX, TXT or NS records through Cloudflare DNS over HTTPS."
  },
  {
    "id": "public-ip",
    "name": "Public IP Lookup",
    "group": "Networking",
    "mode": "external",
    "description": "Retrieve the public IPv4 address visible to an external lookup service."
  },
  {
    "id": "mac",
    "name": "MAC Vendor Lookup",
    "group": "Networking",
    "mode": "external",
    "description": "Identify the registered vendor prefix for a MAC address."
  },
  {
    "id": "ports",
    "name": "Common TCP / UDP Port Reference",
    "group": "Networking",
    "mode": "browser",
    "description": "Search a curated reference of common network ports, services and transport protocols."
  },
  {
    "id": "latency",
    "name": "HTTPS Latency Check",
    "group": "Networking",
    "mode": "external",
    "description": "Measure browser HTTPS request timing and failed probes. This is not ICMP ping."
  },
  {
    "id": "speed",
    "name": "Browser Internet Speed Test",
    "group": "Networking",
    "mode": "external",
    "description": "Run a short download and upload throughput estimate using Cloudflare test endpoints."
  },
  {
    "id": "hmac",
    "name": "HMAC-SHA256 Generator",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Generate an HMAC-SHA256 message authentication code locally using Web Crypto."
  },
  {
    "id": "headers",
    "name": "HTTP Security Header Audit",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Paste response headers to check common browser security controls."
  },
  {
    "id": "csp",
    "name": "Content Security Policy Builder",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Generate a conservative starter CSP with optional trusted HTTPS origins."
  },
  {
    "id": "csp-audit",
    "name": "CSP Policy Analyzer",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Inspect a Content-Security-Policy value for missing directives and risky source expressions."
  },
  {
    "id": "cookies",
    "name": "Set-Cookie Security Auditor",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Inspect cookie attributes and flag missing Secure, HttpOnly and SameSite protections."
  },
  {
    "id": "password",
    "name": "Cryptographically Secure Password Generator",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Generate a random password locally using the browser cryptographic random number generator."
  },
  {
    "id": "strength",
    "name": "Password Strength Estimator",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Estimate password characteristics locally. This is a heuristic, not a guarantee of account security."
  },
  {
    "id": "hash-file",
    "name": "SHA-256 File Hash",
    "group": "Cybersecurity",
    "mode": "browser-file",
    "description": "Calculate a SHA-256 digest in your browser. File bytes are not uploaded."
  },
  {
    "id": "hash-text",
    "name": "SHA-256 Text Hash",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Calculate a SHA-256 digest of text locally in your browser."
  },
  {
    "id": "jwt",
    "name": "JWT Decoder",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Decode JWT header and payload for inspection. This does not verify the signature or trust the token."
  },
  {
    "id": "config",
    "name": "Cisco Configuration Security Review",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Run local pattern checks for common Cisco IOS management and hardening settings."
  },
  {
    "id": "crt",
    "name": "Certificate Transparency Search",
    "group": "Cybersecurity",
    "mode": "external",
    "description": "Search public Certificate Transparency records for a domain."
  },
  {
    "id": "systemd",
    "name": "systemd Service Unit Reviewer",
    "group": "Linux",
    "mode": "browser",
    "description": "Review a pasted systemd service unit for common operational and hardening settings."
  },
  {
    "id": "fstab",
    "name": "Linux fstab Entry Checker",
    "group": "Linux",
    "mode": "browser",
    "description": "Check fstab lines for field count, mount options and common boot-time considerations."
  },
  {
    "id": "chmod",
    "name": "Linux chmod Permission Calculator",
    "group": "Linux",
    "mode": "browser",
    "description": "Convert an octal chmod mode into owner, group and other permissions."
  },
  {
    "id": "timestamp",
    "name": "Unix Timestamp Converter",
    "group": "Linux",
    "mode": "browser",
    "description": "Convert Unix seconds or milliseconds into UTC and local date-time formats."
  },
  {
    "id": "cron",
    "name": "Cron Expression Validator",
    "group": "Linux",
    "mode": "browser",
    "description": "Validate the five standard cron fields and explain their ranges."
  },
  {
    "id": "filesize",
    "name": "File Size Converter",
    "group": "Linux",
    "mode": "browser",
    "description": "Convert bytes into decimal and binary storage units."
  },
  {
    "id": "signals",
    "name": "Linux Process Signal Reference",
    "group": "Linux",
    "mode": "browser",
    "description": "Search common POSIX/Linux process signals and their standard meanings."
  },
  {
    "id": "csv-json",
    "name": "CSV to JSON Converter",
    "group": "Developer",
    "mode": "browser",
    "description": "Convert RFC-style CSV data, including escaped quotes and multiline quoted fields, into a JSON array of objects."
  },
  {
    "id": "xml",
    "name": "XML Formatter & Validator",
    "group": "Developer",
    "mode": "browser",
    "description": "Parse XML locally, detect malformed markup and return a readable formatted representation."
  },
  {
    "id": "json",
    "name": "JSON Formatter & Validator",
    "group": "Developer",
    "mode": "browser",
    "description": "Validate JSON, pretty-print it or produce compact minified JSON."
  },
  {
    "id": "base64",
    "name": "Base64 Encoder / Decoder",
    "group": "Developer",
    "mode": "browser",
    "description": "Encode UTF-8 text to Base64 or decode Base64 back to text."
  },
  {
    "id": "url",
    "name": "URL Encoder / Decoder",
    "group": "Developer",
    "mode": "browser",
    "description": "Encode or decode URL components safely."
  },
  {
    "id": "uuid",
    "name": "UUID v4 Generator",
    "group": "Developer",
    "mode": "browser",
    "description": "Generate a random UUID v4 locally with Web Crypto."
  },
  {
    "id": "regex",
    "name": "Regular Expression Tester",
    "group": "Developer",
    "mode": "browser",
    "description": "Test a regular expression against sample text in an isolated Web Worker with strict size limits."
  },
  {
    "id": "html",
    "name": "HTML Entity Encoder / Decoder",
    "group": "Developer",
    "mode": "browser",
    "description": "Encode reserved HTML characters or decode common entities."
  },
  {
    "id": "case",
    "name": "Text Case Converter",
    "group": "Developer",
    "mode": "browser",
    "description": "Convert text into uppercase, lowercase, title case or kebab case."
  },
  {
    "id": "diff",
    "name": "Text / Configuration Diff",
    "group": "Developer",
    "mode": "browser",
    "description": "Compare two text blocks line by line and show added, removed and unchanged lines."
  },
  {
    "id": "ioc-extractor",
    "name": "IOC Extractor & Classifier",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Extract and deduplicate URLs, domains, IPv4 addresses and common file hashes from pasted threat notes or logs."
  },
  {
    "id": "auth-log-triage",
    "name": "SSH & PAM Authentication Log Triage",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Parse common OpenSSH and PAM authentication messages, summarize failed and successful logins, and rank source addresses."
  },
  {
    "id": "log-timeline",
    "name": "ISO Log Timeline Sorter",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Sort pasted log events chronologically using ISO-8601 timestamps and identify lines that need timestamp normalization."
  },
  {
    "id": "windows-event-reference",
    "name": "Windows Security Event ID Reference",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Search common Windows Security and System event IDs with concise investigation context."
  },
  {
    "id": "cidr-overlap",
    "name": "CIDR Network Overlap Checker",
    "group": "Networking",
    "mode": "browser",
    "description": "Compare two IPv4 CIDR networks and calculate whether they overlap, contain one another or remain separate."
  },
  {
    "id": "url-risk-review",
    "name": "Suspicious URL Triage",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Inspect a URL locally for common phishing and impersonation signals without opening or contacting the destination."
  },
  {
    "id": "sshd-config-audit",
    "name": "OpenSSH Server Configuration Auditor",
    "group": "Linux",
    "mode": "browser",
    "description": "Review pasted sshd_config directives for common high-risk settings and missing defensive controls."
  },
  {
    "id": "query-string-builder",
    "name": "URL Query String Builder",
    "group": "Developer",
    "mode": "browser",
    "description": "Build and inspect URL query parameters from key/value lines while preserving duplicate keys and encoding safely."
  },
  {
    "id": "acl-match",
    "name": "Cisco IPv4 ACL Wildcard Matcher",
    "group": "Networking",
    "mode": "browser",
    "description": "Check whether an IPv4 host matches a Cisco IOS network and wildcard-mask pair, including non-contiguous wildcard masks."
  },
  {
    "id": "access-log-analyzer",
    "name": "Web Access Log Analyzer",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Parse Apache/Nginx combined or common access-log lines and summarize source addresses, status codes, methods and suspicious paths."
  },
  {
    "id": "firewall-review",
    "name": "Linux Firewall Rules Reviewer",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Review pasted iptables-save or UFW status output for broad inbound access and exposed management services."
  },
  {
    "id": "dockerfile-audit",
    "name": "Dockerfile Security Review",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Inspect a Dockerfile for common image, privilege, secret-handling and build-layer risks."
  },
  {
    "id": "bash-quote-builder",
    "name": "Bash Safe Argument Quoter",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Escape arbitrary text as one POSIX-shell argument, including embedded single quotes."
  },
  {
    "id": "bash-array-builder",
    "name": "Bash Array Literal Builder",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Convert one value per line into a safely quoted Bash array literal."
  },
  {
    "id": "bash-getopts-builder",
    "name": "Bash getopts Parser Builder",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Generate a getopts parser after validating short option letters and value requirements."
  },
  {
    "id": "bash-arg-parser",
    "name": "Bash Long-Option Parser Template",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Generate a safe while/case parser for long options and positional arguments."
  },
  {
    "id": "bash-strict-template",
    "name": "Bash Strict-Mode Script Starter",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Generate a script starter with strict mode, predictable IFS and a basic error trap."
  },
  {
    "id": "bash-trap-builder",
    "name": "Bash Signal & Cleanup Trap Builder",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Generate signal traps and a cleanup function with validated handler names."
  },
  {
    "id": "bash-heredoc-builder",
    "name": "Bash Here-Document Builder",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Create a here-document template and reject delimiters that collide with content."
  },
  {
    "id": "bash-loop-builder",
    "name": "Bash Loop Template Builder",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Generate safe array, file-line or glob loops with quoting and whitespace preservation."
  },
  {
    "id": "bash-env-audit",
    "name": "Bash Environment File Auditor",
    "group": "Bash Scripting",
    "mode": "browser",
    "description": "Review KEY=value lines for malformed entries and sensitive variable names without printing values."
  },
  {
    "id": "bash-script-audit",
    "name": "Bash Script Static Review",
    "group": "Bash Scripting",
    "mode": "browser",
    "description": "Scan pasted shell scripts for risky patterns, quoting hazards and missing safety practices."
  },
  {
    "id": "bash-check-command",
    "name": "Bash Syntax & ShellCheck Command Builder",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Generate local validation commands for Bash syntax and ShellCheck at a selected severity."
  },
  {
    "id": "bash-log-function",
    "name": "Bash Structured Log Function Builder",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Generate timestamped log functions with levels and stderr routing."
  },
  {
    "id": "bash-tempdir-builder",
    "name": "Bash Temporary Workspace Builder",
    "group": "Bash Scripting",
    "mode": "command",
    "description": "Generate a private temporary directory with cleanup traps and restrictive permissions."
  },
  {
    "id": "kali-apt-builder",
    "name": "Kali APT Maintenance Planner",
    "group": "Kali Linux",
    "mode": "command",
    "description": "Build safe APT update, upgrade, package-search and install commands for Kali Linux."
  },
  {
    "id": "kali-nmap-builder",
    "name": "Nmap Authorized Assessment Builder",
    "group": "Kali Linux",
    "mode": "command",
    "description": "Create a conservative Nmap command for an authorized host or CIDR range."
  },
  {
    "id": "kali-tcpdump-filter",
    "name": "tcpdump BPF Filter Builder",
    "group": "Kali Linux",
    "mode": "command",
    "description": "Compose a Berkeley Packet Filter expression for host, port, protocol and direction."
  },
  {
    "id": "kali-wireshark-filter",
    "name": "Wireshark Display Filter Builder",
    "group": "Kali Linux",
    "mode": "command",
    "description": "Build a Wireshark display filter for protocol, IP address and TCP/UDP port."
  },
  {
    "id": "kali-monitor-capability",
    "name": "Wireless Monitor-Mode Capability Checker",
    "group": "Kali Linux",
    "mode": "browser",
    "description": "Inspect iw list output to determine whether a wireless PHY advertises monitor mode."
  },
  {
    "id": "kali-suid-audit",
    "name": "Kali SUID / SGID Path Review",
    "group": "Kali Linux",
    "mode": "browser",
    "description": "Review find output for SUID/SGID executables in writable or user-controlled locations."
  },
  {
    "id": "kali-capability-audit",
    "name": "Linux File Capability Reviewer",
    "group": "Kali Linux",
    "mode": "browser",
    "description": "Analyze getcap output and highlight powerful Linux file capabilities."
  },
  {
    "id": "kali-journalctl-builder",
    "name": "Kali journalctl Query Builder",
    "group": "Kali Linux",
    "mode": "command",
    "description": "Build bounded journalctl queries for a unit, time window and priority."
  },
  {
    "id": "kali-route-review",
    "name": "Kali Routing Table Analyzer",
    "group": "Kali Linux",
    "mode": "browser",
    "description": "Summarize pasted ip route output and highlight default routes and interfaces."
  },
  {
    "id": "kali-listen-audit",
    "name": "Kali Listening Service Exposure Review",
    "group": "Kali Linux",
    "mode": "browser",
    "description": "Parse ss -tulpn output and identify services listening on wildcard addresses."
  },
  {
    "id": "kali-ufw-builder",
    "name": "Kali UFW Rule Builder",
    "group": "Kali Linux",
    "mode": "command",
    "description": "Generate a narrowly scoped UFW allow, deny or reject rule for a port and optional source."
  },
  {
    "id": "kali-hash-identify",
    "name": "Kali Hash Format Triage",
    "group": "Kali Linux",
    "mode": "browser",
    "description": "Identify likely digest formats by length and character set; ambiguous formats remain candidates."
  },
  {
    "id": "kali-nmap-output-review",
    "name": "Nmap Text Output Summarizer",
    "group": "Kali Linux",
    "mode": "browser",
    "description": "Summarize a pasted Nmap port table and identify open TCP/UDP services."
  },
  {
    "id": "kali-interface-report",
    "name": "Kali Network Interface Output Reviewer",
    "group": "Kali Linux",
    "mode": "browser",
    "description": "Summarize ip -br link and ip -br addr output for interface state and assigned addresses."
  },
  {
    "id": "linux-find-builder",
    "name": "Linux find Command Builder",
    "group": "Linux",
    "mode": "command",
    "description": "Build a read-only find command by root path, file type, name pattern and modification age."
  },
  {
    "id": "linux-tar-backup",
    "name": "Linux Tar Backup Command Builder",
    "group": "Linux",
    "mode": "command",
    "description": "Generate a compressed backup command with explicit source and destination paths."
  },
  {
    "id": "linux-mode-converter",
    "name": "Linux Symbolic Permission Converter",
    "group": "Linux",
    "mode": "browser",
    "description": "Convert octal modes including setuid, setgid and sticky bits to symbolic chmod notation."
  },
  {
    "id": "linux-df-analyzer",
    "name": "Linux df Output Analyzer",
    "group": "Linux",
    "mode": "browser",
    "description": "Parse df -P output and flag mounted filesystems above a configurable utilization threshold."
  },
  {
    "id": "linux-memory-analyzer",
    "name": "Linux Memory Usage Calculator",
    "group": "Linux",
    "mode": "browser",
    "description": "Calculate RAM and swap utilization from numeric MiB values."
  },
  {
    "id": "linux-process-review",
    "name": "Linux Process Snapshot Reviewer",
    "group": "Linux",
    "mode": "browser",
    "description": "Summarize ps output and flag high CPU or memory rows for investigation."
  },
  {
    "id": "linux-id-analyzer",
    "name": "Linux id Output Analyzer",
    "group": "Linux",
    "mode": "browser",
    "description": "Parse id output and explain effective UID, primary GID and supplementary groups."
  },
  {
    "id": "linux-log-filter",
    "name": "Linux Log Query Builder",
    "group": "Linux",
    "mode": "command",
    "description": "Build a bounded journalctl or grep command for system troubleshooting."
  },
  {
    "id": "linux-kernel-info",
    "name": "Linux Kernel & Architecture Inspector",
    "group": "Linux",
    "mode": "browser",
    "description": "Interpret uname -a output and extract kernel release, architecture and host information."
  },
  {
    "id": "ubuntu-apt-plan",
    "name": "Ubuntu APT Maintenance Planner",
    "group": "Ubuntu",
    "mode": "command",
    "description": "Generate cautious APT update, upgrade and package-management commands for Ubuntu."
  },
  {
    "id": "ubuntu-ufw-builder",
    "name": "Ubuntu UFW Firewall Rule Builder",
    "group": "Ubuntu",
    "mode": "command",
    "description": "Generate a narrowly scoped UFW allow, deny or reject rule with optional source restriction."
  },
  {
    "id": "ubuntu-netplan-review",
    "name": "Ubuntu Netplan Configuration Reviewer",
    "group": "Ubuntu",
    "mode": "browser",
    "description": "Review Netplan YAML for common structure, deprecated keys and risky configuration patterns."
  },
  {
    "id": "ubuntu-snap-audit",
    "name": "Ubuntu Snap Package Auditor",
    "group": "Ubuntu",
    "mode": "browser",
    "description": "Review snap list --all output and identify disabled revisions and classic confinement."
  },
  {
    "id": "ubuntu-apparmor-audit",
    "name": "Ubuntu AppArmor Status Analyzer",
    "group": "Ubuntu",
    "mode": "browser",
    "description": "Summarize aa-status output and highlight unconfined processes for investigation."
  },
  {
    "id": "ubuntu-service-audit",
    "name": "Ubuntu Running Service Reviewer",
    "group": "Ubuntu",
    "mode": "browser",
    "description": "Review systemctl service output and highlight services that deserve exposure checks."
  },
  {
    "id": "ubuntu-source-audit",
    "name": "Ubuntu APT Repository Source Auditor",
    "group": "Ubuntu",
    "mode": "browser",
    "description": "Inspect APT source entries for HTTP transport, trusted=yes and third-party repository origins."
  },
  {
    "id": "ubuntu-cloud-init-audit",
    "name": "Ubuntu Cloud-init Security Reviewer",
    "group": "Ubuntu",
    "mode": "browser",
    "description": "Inspect cloud-init user-data for risky SSH password settings, root login and embedded credentials."
  },
  {
    "id": "ubuntu-autoremove-plan",
    "name": "Ubuntu APT Cleanup Planner",
    "group": "Ubuntu",
    "mode": "command",
    "description": "Generate a dry-run package cleanup workflow and a separate reviewed execution command."
  },
  {
    "id": "ubuntu-update-readiness",
    "name": "Ubuntu Update & Reboot Readiness Checklist",
    "group": "Ubuntu",
    "mode": "command",
    "description": "Generate a cautious update workflow that checks held packages, failed services and reboot state."
  },
  {
    "id": "ubuntu-netplan-try-builder",
    "name": "Ubuntu Netplan Safe Apply Planner",
    "group": "Ubuntu",
    "mode": "command",
    "description": "Generate a safer Netplan validation and rollback workflow using netplan try."
  },
  {
    "id": "ubuntu-snap-refresh",
    "name": "Ubuntu Snap Refresh Planner",
    "group": "Ubuntu",
    "mode": "command",
    "description": "Generate commands to inspect snap refresh schedules, pending updates and installed revisions."
  },
  {
    "id": "wrangler-config-audit",
    "name": "Cloudflare Wrangler Configuration Auditor",
    "group": "Cloud & DevOps",
    "mode": "browser",
    "description": "Review Wrangler configuration text for missing deployment metadata, risky development exposure and secret-like plaintext variables."
  },
  {
    "id": "k8s-manifest-audit",
    "name": "Kubernetes Manifest Security Review",
    "group": "Cloud & DevOps",
    "mode": "browser",
    "description": "Inspect Kubernetes YAML for privileged containers, host namespace access, risky mounts, root users and unpinned images."
  },
  {
    "id": "sql-migration-review",
    "name": "SQL Migration Safety Reviewer",
    "group": "Database Engineering",
    "mode": "browser",
    "description": "Review SQL migration text for unbounded writes, destructive DDL and transaction-boundary issues without database access."
  },
  {
    "id": "base-convert",
    "name": "Number Base Converter",
    "group": "Developer",
    "mode": "browser",
    "description": "Convert integers between binary, octal, decimal and hexadecimal (arbitrary size)."
  },
  {
    "id": "text-hex",
    "name": "Text ⇄ Hex Converter",
    "group": "Developer",
    "mode": "browser",
    "description": "Convert UTF-8 text to hexadecimal bytes and decode hex back to text."
  },
  {
    "id": "color",
    "name": "Color Converter",
    "group": "Developer",
    "mode": "browser",
    "description": "Convert HEX colors to RGB and HSL values for CSS and design work."
  },
  {
    "id": "transfer-time",
    "name": "File Transfer Time Estimator",
    "group": "Networking",
    "mode": "browser",
    "description": "Estimate transfer time from file size and link speed (ideal, ignores protocol overhead)."
  },
  {
    "id": "bdp",
    "name": "Bandwidth-Delay Product",
    "group": "Networking",
    "mode": "browser",
    "description": "Compute the TCP window needed to fill a link of given bandwidth and RTT."
  },
  {
    "id": "mtu-mss",
    "name": "MTU / MSS Calculator",
    "group": "Networking",
    "mode": "browser",
    "description": "Derive TCP MSS from MTU for IPv4 or IPv6 (no extra encapsulation)."
  },
  {
    "id": "entropy",
    "name": "Shannon Entropy Calculator",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Measure per-character Shannon entropy of a string (a rough randomness indicator, not a password verdict)."
  },
  {
    "id": "hash-id",
    "name": "Hash Type Identifier",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Guess likely hash algorithms from length and format (heuristic only)."
  },
  {
    "id": "umask",
    "name": "umask Calculator",
    "group": "Linux",
    "mode": "browser",
    "description": "Show the default file and directory permissions that a given umask produces."
  },
  {
    "id": "http-status",
    "name": "HTTP Status Code Reference",
    "group": "Developer",
    "mode": "browser",
    "description": "Look up the meaning and class of common HTTP status codes quickly."
  },
  {
    "id": "nmap-builder",
    "name": "Nmap Command Builder",
    "group": "Networking",
    "mode": "browser",
    "description": "Build a safe, validated Nmap command line from scan type, ports and timing. It only builds text and never scans."
  },
  {
    "id": "nmap-parser",
    "name": "Nmap Output Parser",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Paste normal-format Nmap output and get a summary of hosts and open ports, services and versions."
  },
  {
    "id": "wireshark-filter",
    "name": "Wireshark Filter Builder",
    "group": "Networking",
    "mode": "browser",
    "description": "Generate a Wireshark display filter and the matching BPF capture filter from protocol, host and port."
  },
  {
    "id": "tshark-builder",
    "name": "tshark Capture Command Builder",
    "group": "Networking",
    "mode": "browser",
    "description": "Build a validated tshark capture command with interface, BPF filter, packet count and output file."
  },
  {
    "id": "kali-reference",
    "name": "Kali Linux Tool Reference",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Search common Kali and Linux networking tools by name or purpose and see a typical safe example command."
  },
  {
    "id": "osint-domain",
    "name": "OSINT Domain Search Helper",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Generate search-engine operators and public-source links to review the exposure of a domain you own or manage."
  },
  {
    "id": "email-header",
    "name": "Email Header Analyzer",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Paste raw email headers to see the Received hops, SPF/DKIM/DMARC results and sender mismatches."
  },
  {
    "id": "tcpdump-analyzer",
    "name": "tcpdump Output Analyzer",
    "group": "Networking",
    "mode": "browser",
    "description": "Paste tcpdump text output to rank top sources, destinations, destination ports and TCP flag usage."
  },
  {
    "id": "socket-analyzer",
    "name": "ss / Listening Ports Analyzer",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Paste \"ss -tulpn\" output to list listening services and flag sensitive ports exposed on all interfaces."
  },
  {
    "id": "lynis-parser",
    "name": "Lynis Report Summarizer",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Summarize a Lynis report: hardening index plus the warnings and suggestions it found."
  },
  {
    "id": "tls-output-analyzer",
    "name": "TLS / openssl Output Analyzer",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Analyze \"openssl s_client\" output for protocol version, cipher strength, verification errors and certificate expiry."
  },
  {
    "id": "vlsm",
    "name": "VLSM Subnet Planner",
    "group": "Networking",
    "mode": "browser",
    "description": "Allocate variable-length subnets from a parent network, largest first, from a list of required host counts."
  },
  {
    "id": "ipv6-subnet",
    "name": "IPv6 Subnet Calculator",
    "group": "Networking",
    "mode": "browser",
    "description": "Calculate the network, first and last address, total addresses and /64 count for an IPv6 prefix."
  },
  {
    "id": "cvss",
    "name": "CVSS v3.1 Base Score Calculator",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Compute the CVSS v3.1 base score and severity from a vector string, following the FIRST specification."
  },
  {
    "id": "spf-dmarc",
    "name": "SPF / DMARC Record Analyzer",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Analyze an SPF or DMARC TXT record for policy strength, DNS lookup limits and common misconfigurations."
  },
  {
    "id": "ufw-builder",
    "name": "UFW Firewall Rule Builder",
    "group": "Linux",
    "mode": "browser",
    "description": "Build a validated ufw rule for a port, protocol and optional source, with a lockout warning for SSH."
  },
  {
    "id": "ssh-keygen",
    "name": "ssh-keygen Command Builder",
    "group": "Linux",
    "mode": "browser",
    "description": "Build a hardened ssh-keygen command (Ed25519, RSA 4096 or ECDSA) with safe file name and comment validation."
  },
  {
    "id": "route-summary",
    "name": "Route Summarization (Supernet)",
    "group": "Networking",
    "mode": "browser",
    "description": "Find the smallest single CIDR that covers a list of IPv4 networks and report how many extra addresses it also covers."
  },
  {
    "id": "tcp-throughput",
    "name": "TCP Throughput Estimator (Mathis)",
    "group": "Networking",
    "mode": "browser",
    "description": "Estimate the upper bound of TCP throughput from MSS, round-trip time and packet loss using the Mathis equation."
  },
  {
    "id": "bandwidth-convert",
    "name": "Bandwidth Unit Converter",
    "group": "Networking",
    "mode": "browser",
    "description": "Convert between bit-based and byte-based link speeds (decimal units), e.g. Mbit/s to MB/s."
  },
  {
    "id": "tcpdump-builder",
    "name": "tcpdump Command Builder",
    "group": "Networking",
    "mode": "browser",
    "description": "Build a validated tcpdump command to print, write or read packets, with a BPF filter and packet limit."
  },
  {
    "id": "dig-builder",
    "name": "dig Command Builder",
    "group": "Networking",
    "mode": "browser",
    "description": "Build a validated dig command for a record type, resolver and output mode (short, trace or DNSSEC)."
  },
  {
    "id": "ttl-guess",
    "name": "TTL / Hop Count Estimator",
    "group": "Networking",
    "mode": "browser",
    "description": "Estimate the initial TTL, likely OS family and hop count from a received TTL value (heuristic only)."
  },
  {
    "id": "attack-reference",
    "name": "MITRE ATT&CK Technique Lookup",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Look up common MITRE ATT&CK technique IDs by ID, name or tactic, with a short detection idea."
  },
  {
    "id": "journalctl-builder",
    "name": "journalctl Command Builder",
    "group": "Linux",
    "mode": "browser",
    "description": "Build a validated journalctl command to filter systemd logs by unit, time range and priority."
  },
  {
    "id": "crc32",
    "name": "CRC-32 Checksum",
    "group": "Developer",
    "mode": "browser",
    "description": "Compute the standard CRC-32 (IEEE 802.3, as used by zip, gzip and PNG) of text or hex bytes."
  },
  {
    "id": "multi-hash",
    "name": "Multi-Algorithm Text Hash",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Hash text with MD5, SHA-1, SHA-256, SHA-384 and SHA-512 at once, for checksum comparison and legacy systems."
  },
  {
    "id": "base32",
    "name": "Base32 Encoder / Decoder",
    "group": "Developer",
    "mode": "browser",
    "description": "Encode text to RFC 4648 Base32 (as used for TOTP secrets) or decode Base32 back to text."
  },
  {
    "id": "otp",
    "name": "TOTP / HOTP Code Calculator",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Compute RFC 6238 TOTP or RFC 4226 HOTP one-time codes locally from a Base32 secret, for testing and verification."
  },
  {
    "id": "eui64",
    "name": "IPv6 EUI-64 Address Builder",
    "group": "Networking",
    "mode": "browser",
    "description": "Derive the EUI-64 interface identifier and SLAAC address from a MAC address and /64 prefix."
  },
  {
    "id": "inet-checksum",
    "name": "Internet Checksum (RFC 1071)",
    "group": "Networking",
    "mode": "browser",
    "description": "Compute the 16-bit ones-complement Internet checksum used by IPv4, ICMP, TCP and UDP from hex bytes."
  },
  {
    "id": "wol-packet",
    "name": "Wake-on-LAN Magic Packet Builder",
    "group": "Networking",
    "mode": "browser",
    "description": "Build the Wake-on-LAN magic packet (6 x FF plus the MAC 16 times) and ready-to-use send commands."
  },
  {
    "id": "mac-format",
    "name": "MAC Address Formatter",
    "group": "Networking",
    "mode": "browser",
    "description": "Convert a MAC address between colon, hyphen, Cisco dotted and plain formats and read its multicast and local bits."
  },
  {
    "id": "x509-inspector",
    "name": "X.509 Certificate Inspector (PEM)",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Parse a PEM certificate locally: subject, issuer, validity, SANs, key type and size, signature algorithm, SHA-256 fingerprint, plus expiry and weakness findings."
  },
  {
    "id": "ssh-fingerprint",
    "name": "SSH Public Key Fingerprint",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Compute SHA256 and legacy MD5 fingerprints for authorized_keys / .pub lines and flag weak key types and sizes."
  },
  {
    "id": "nmap-grepable-parser",
    "name": "Nmap Grepable (-oG) Parser",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Summarize Nmap grepable output: hosts up, open ports and services, and exposed high-risk services."
  },
  {
    "id": "suricata-eve-summary",
    "name": "Suricata EVE Alert Summary",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Summarize Suricata eve.json alert lines: top signatures, severities, categories and source/destination pairs."
  },
  {
    "id": "zeek-conn-summary",
    "name": "Zeek conn.log Summary",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Summarize a Zeek TSV conn.log: top talkers by bytes, services, connection states, long connections and scan-like sources."
  },
  {
    "id": "sudoers-audit",
    "name": "sudoers Rule Auditor",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Review sudoers text for NOPASSWD ALL, shell-escape binaries, wildcards, !authenticate and dangerous Defaults."
  },
  {
    "id": "passwd-shadow-audit",
    "name": "passwd / shadow Auditor",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Check /etc/passwd (and optional shadow) for extra UID 0 accounts, empty passwords, weak hash types and system accounts with login shells."
  },
  {
    "id": "checksum-calc",
    "name": "CRC and Adler Checksum Calculator",
    "group": "Developer",
    "mode": "browser",
    "description": "Compute CRC-32, CRC-32C, CRC-16 (ARC and CCITT-FALSE), CRC-8 and Adler-32 for text or hex bytes; check values match the standard catalogue."
  },
  {
    "id": "luhn-check",
    "name": "Luhn Checksum Validator",
    "group": "Developer",
    "mode": "browser",
    "description": "Validate numbers with the Luhn algorithm, compute the check digit for a payload and identify the card network by prefix. Digits are masked in the output."
  },
  {
    "id": "yara-rule-lint",
    "name": "YARA Rule Linter",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Static review of YARA rules: duplicate names, missing conditions, undefined or unused strings, very short strings and missing metadata. Does not replace compiling with yara."
  },
  {
    "id": "sysmon-event-summary",
    "name": "Sysmon Event Summary & Triage",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Summarize Sysmon XML events and flag encoded PowerShell, LOLBin abuse, Office child processes, LSASS access, remote threads and Run-key persistence."
  },
  {
    "id": "windows-logon-summary",
    "name": "Windows Logon Event Summary (4624/4625)",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Summarize Security log XML: failed/successful logons by user and IP, brute-force and password-spraying patterns, success after failures, audit log cleared and account changes."
  },
  {
    "id": "powershell-encoded-decoder",
    "name": "PowerShell -EncodedCommand Decoder",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Decode PowerShell -EncodedCommand payloads (Base64 of UTF-16LE) and list suspicious keywords and URLs, defanged. Decoding only; nothing is executed."
  },
  {
    "id": "ioc-defang",
    "name": "IOC Defang / Refang",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Defang URLs, IPv4 addresses, emails and common domains for safe sharing (hxxps://evil[.]com) or refang them for lookups."
  },
  {
    "id": "ip-in-cidr-list",
    "name": "IP Matcher (IPv4/IPv6 CIDR list)",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Check which IP addresses fall inside a list of CIDR blocks or single IPs, for blocklist, allowlist and scope checks. IPv4 and IPv6."
  },
  {
    "id": "forensic-timestamps",
    "name": "Forensic Timestamp Converter",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Convert Unix, Windows FILETIME, WebKit/Chrome, macOS absolute and .NET tick values to UTC (and an ISO date back to all formats) with plausibility marks."
  },
  {
    "id": "file-signature-id",
    "name": "File Signature (Magic Bytes) Identifier",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Identify a file type from its first bytes (hex): PE, ELF, Mach-O, PDF, Office/OLE, ZIP, gzip, 7z, RAR, PNG, JPEG, GIF, SQLite, PCAP, LNK, scripts and more."
  },
  {
    "id": "layered-decoder",
    "name": "Layered Decoder (Base64 / Hex / URL)",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Peel nested encodings automatically (Base64, hex, URL percent-encoding) and show every layer, to unwrap obfuscated payloads safely. Decoding only; nothing is executed."
  },
  {
    "id": "auditd-execve-summary",
    "name": "auditd EXECVE Command Summary",
    "group": "SOC & Incident Response",
    "mode": "browser",
    "description": "Rebuild commands from auditd EXECVE records and flag download-and-run, reverse shells, base64 decoding, world-writable chmod and shell piping."
  },
  {
    "id": "cipher-suite-classifier",
    "name": "TLS Cipher Suite Classifier",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Classify TLS cipher suites (OpenSSL or IANA names, one per line or colon separated) as recommended, legacy, weak or insecure, with forward secrecy and AEAD flags and the reason."
  },
  {
    "id": "jwt-security-audit",
    "name": "JWT Security Audit",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Audit a JWT you already hold for risky algorithm, header and claim settings (alg none, missing or ms exp, jku/jwk/kid abuse, long lifetime). Does not verify signatures or attack anything."
  },
  {
    "id": "hsts-check",
    "name": "HSTS Header Checker",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Parse a Strict-Transport-Security header per RFC 6797 and report validity, max-age strength, includeSubDomains and HSTS preload-list eligibility."
  },
  {
    "id": "security-txt-check",
    "name": "security.txt Validator (RFC 9116)",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Validate a security.txt file against RFC 9116: required Contact and Expires, URI and https rules, single-use fields, date validity and expiry."
  },
  {
    "id": "cors-config-audit",
    "name": "CORS Configuration Audit",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Audit Access-Control-* response headers against a request Origin for credentialed wildcards, reflected or null origins, missing Vary and risky methods."
  },
  {
    "id": "http-smuggling-lint",
    "name": "HTTP Request Smuggling Lint",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Lint a raw HTTP/1.1 request you own for message-framing ambiguities (RFC 9112): Content-Length plus Transfer-Encoding, duplicates, obfuscated TE, bare LF, spacing before the colon."
  },
  {
    "id": "dns-zone-audit",
    "name": "DNS Zone File Parser & Audit",
    "group": "Networking",
    "mode": "browser",
    "description": "Parse a BIND-style zone file (origin, TTL, relative names, multi-line SOA, quoted TXT) into fully qualified records and flag CNAME conflicts, missing SOA/NS/SPF and risky wildcards or TTLs."
  },
  {
    "id": "cidr-aggregate",
    "name": "CIDR Aggregator / Excluder",
    "group": "Networking",
    "mode": "browser",
    "description": "Merge a mixed IPv4/IPv6 list of CIDRs and IPs into the smallest exact set of CIDR blocks, or subtract an exclusion list from it, for firewall allowlists and blocklists."
  },
  {
    "id": "authorized-keys-audit",
    "name": "authorized_keys Auditor",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Parse an OpenSSH authorized_keys file: key type and size, options (from=, command=, restrict), duplicates, weak RSA/DSA keys and unrestricted keys. Reads text only; no login is attempted."
  },
  {
    "id": "secret-leak-scanner",
    "name": "Secret Leak Scanner",
    "group": "Cybersecurity",
    "mode": "browser",
    "description": "Scan pasted text, configs or logs for leaked credentials: private keys (and whether encrypted), AWS, GitHub, Slack, Stripe, Google and SendGrid tokens, JWTs, URL passwords. Findings are masked, never echoed in full."
  }
];

const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...h}});
const fail=(m,s=400,h={})=>json({error:m},s,h),b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll("+","-").replaceAll("/","_").replaceAll("=",""),unb64=s=>Uint8Array.from(atob(s.replaceAll("-","+").replaceAll("_","/")),c=>c.charCodeAt(0)),rand=n=>crypto.getRandomValues(new Uint8Array(n));
const hash=async s=>b64(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));
async function passHash(password,salt=rand(16),iter=ITER){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);return{salt:b64(salt),hash:b64(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:iter},k,256))};}
async function passOK(p,s,h,iter=100000){const a=unb64((await passHash(p,unb64(s),iter)).hash),b=unb64(h);let d=a.length^b.length;for(let i=0;i<Math.min(a.length,b.length);i++)d|=a[i]^b[i];return d===0;}
// Rate-limit keys use HMAC-SHA256 with a Worker secret so stored values cannot be reversed by enumerating IPv4 space.
// The secret is mandatory in every environment; requests fail closed if it is missing or too short.
async function ipId(req,env){const ip=req.headers.get("CF-Connecting-IP")||"unknown";if(typeof env.IP_HASH_SECRET!=="string"||env.IP_HASH_SECRET.length<32)throw new HttpError(503,"Security configuration unavailable.");const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.IP_HASH_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return b64(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(ip)));}
let DUMMY;const dummy=async()=>DUMMY||(DUMMY={...await passHash("mosta-timing-equaliser"),iter:ITER});
const COMMON=["password","123456","qwerty","letmein","admin","welcome","iloveyou"];
function weakPassword(pw,name){if(pw.length<14||pw.length>128)return"Password must be 14–128 characters.";if(/^(.)\1+$/.test(pw))return"Password is too repetitive.";const l=pw.toLowerCase();if(name&&name.length>=3&&l.includes(String(name).toLowerCase()))return"Password must not contain the username.";if(COMMON.some(w=>l.includes(w)))return"Password contains a very common word or sequence.";return null;}
const newSession=async(env,userId,now)=>{const raw=b64(rand(32));await env.DB.prepare("INSERT INTO sessions(id,user_id,token_hash,created_at,expires_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),userId,await hash(raw),now,now+SESSION).run();await env.DB.prepare("DELETE FROM sessions WHERE user_id=? AND id NOT IN (SELECT id FROM sessions WHERE user_id=? ORDER BY created_at DESC, rowid DESC LIMIT "+MAX_SESSIONS+")").bind(userId,userId).run();return raw;};
async function tokenOK(given,expected){const x=unb64(await hash(String(given||"").trim())),y=unb64(await hash(String(expected).trim()));let d=0;for(let i=0;i<x.length;i++)d|=x[i]^y[i];return d===0;}
function cookie(req){for(const p of (req.headers.get("Cookie")||"").split(";")){const x=p.trim().split("=");if(x[0]===COOKIE)return x.slice(1).join("=");}return null;}
const setCookie=v=>COOKIE+"="+v+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age="+SESSION,clearCookie=()=>COOKIE+"=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
function sameOrigin(req){const sf=req.headers.get("Sec-Fetch-Site");if(sf&&sf!=="same-origin"&&sf!=="none")return false;try{return new URL(req.headers.get("Origin")||"").origin===new URL(req.url).origin;}catch{return false;}}
async function body(req){
const declared=req.headers.get("content-length");
if(declared!==null){if(!/^\d+$/.test(declared))throw new HttpError(400,"Invalid Content-Length.");if(Number(declared)>MAX_BODY)throw new HttpError(413,"Request body too large.");}
const reader=req.body?.getReader();if(!reader)throw new HttpError(400,"JSON body required.");
const chunks=[];let size=0;
try{while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY){await reader.cancel();throw new HttpError(413,"Request body too large.");}chunks.push(value);}}
finally{reader.releaseLock();}
if(declared!==null&&Number(declared)!==size)throw new HttpError(400,"Content-Length mismatch.");
const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
let raw;try{raw=new TextDecoder("utf-8",{fatal:true}).decode(bytes);}catch{throw new HttpError(400,"Invalid UTF-8 body.");}
let d;try{d=JSON.parse(raw);}catch{throw new HttpError(400,"Invalid JSON body.");}
if(!d||typeof d!=="object"||Array.isArray(d))throw new HttpError(400,"JSON object expected.");return d;
}
async function current(req,env){const raw=cookie(req);if(!raw)return null;return env.DB.prepare("SELECT u.id,u.username,u.role,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1").bind(await hash(raw),Math.floor(Date.now()/1000)).first();}
async function audit(env,id,action,detail=""){await env.DB.prepare("INSERT INTO audit_logs(user_id,action,detail,created_at) VALUES(?,?,?,?)").bind(id,action,String(detail).slice(0,300),Math.floor(Date.now()/1000)).run();}
async function reservePairAttempt(env,username,ipHash,now,limit){
return env.DB.prepare("INSERT INTO auth_attempts(username,ip_hash,attempted_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM auth_attempts WHERE username=? AND ip_hash=? AND attempted_at>?)<? RETURNING id").bind(username,ipHash,now,username,ipHash,now-WINDOW,limit).first();
}
async function reserveLoginAttempt(env,username,ipHash,now){
return env.DB.prepare("INSERT INTO auth_attempts(username,ip_hash,attempted_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM auth_attempts WHERE username=? AND ip_hash=? AND attempted_at>?)<? AND (SELECT COUNT(*) FROM auth_attempts WHERE ip_hash=? AND attempted_at>?)<? RETURNING id").bind(username,ipHash,now,username,ipHash,now-WINDOW,LOGIN_PAIR_LIMIT,ipHash,now-WINDOW,LOGIN_IP_LIMIT).first();
}
function ipInt(ip){const p=ip.split(".");if(p.length!==4||p.some(x=>!/^(0|[1-9][0-9]{0,2})$/.test(x)||Number(x)>255))throw Error("Enter a valid IPv4 address.");return p.reduce((n,x)=>(n<<8n)+BigInt(x),0n);}
const ipText=n=>[24n,16n,8n,0n].map(s=>Number((n>>s)&255n)).join(".");
function subnet(ip,p){if(!Number.isInteger(p)||p<0||p>32)throw Error("CIDR prefix must be between 0 and 32.");const v=ipInt(ip),m=p===0?0n:(0xffffffffn<<(32n-BigInt(p)))&0xffffffffn,n=v&m,b=n|(~m&0xffffffffn);return{input:ip,cidr:"/"+p,network:ipText(n),broadcast:ipText(b),subnetMask:ipText(m),wildcard:ipText(~m&0xffffffffn),firstHost:ipText(p>=31?n:n+1n),lastHost:ipText(p>=31?b:b-1n),usableHosts:p===32?1:p===31?2:Number((1n<<(32n-BigInt(p)))-2n)};}
async function api(req,env){
const u=new URL(req.url),p=u.pathname,m=req.method;
if(p==="/api/health"&&m==="GET"){try{await env.DB.prepare("SELECT password_iter FROM users LIMIT 0").all();await env.DB.prepare("SELECT id FROM auth_attempts LIMIT 0").all();await env.DB.prepare("SELECT token_hash FROM sessions LIMIT 0").all();await env.DB.prepare("SELECT user_id,tool_id,enabled FROM user_tool_access LIMIT 0").all();if(typeof env.IP_HASH_SECRET!=="string"||env.IP_HASH_SECRET.length<32)return json({ok:false,service:"MOSTA API",database:"ok",security:"misconfigured"},503);return json({ok:true,service:"MOSTA API",version:"1.0.0",database:"ok",security:"ok"});}catch{return json({ok:false,service:"MOSTA API",database:"unavailable"},503);}}
if(p==="/api/auth/setup-status"&&m==="GET"){const c=await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='admin'").first();return json({setupRequired:c.n===0,bootstrapEnabled:!!env.ADMIN_BOOTSTRAP_TOKEN});}
if(p==="/api/auth/bootstrap"&&m==="POST"){if(!sameOrigin(req))return fail("Cross-origin request rejected.",403);if(!env.ADMIN_BOOTSTRAP_TOKEN)return fail("Bootstrap is not configured.",503);const c=await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='admin'").first();if(c.n)return fail("Initial admin is already configured.",409);const ipHash=await ipId(req,env),now=Math.floor(Date.now()/1000),d=await body(req),name=String(d.username||"").trim().toLowerCase(),pw=String(d.password||""),reserve=await reservePairAttempt(env,"__bootstrap",ipHash,now,BOOT_LIMIT);if(!reserve)return fail("Too many setup attempts. Try again later.",429,{"retry-after":"900"});if(!await tokenOK(d.bootstrapToken,env.ADMIN_BOOTSTRAP_TOKEN))return fail("Invalid bootstrap token.",403);await env.DB.prepare("DELETE FROM auth_attempts WHERE id=?").bind(reserve.id).run();if(!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(name))return fail("Invalid username.");{const bad=weakPassword(pw,name);if(bad)return fail(bad);}const h=await passHash(pw),id=crypto.randomUUID();try{await env.DB.prepare("INSERT INTO users(id,username,password_salt,password_hash,password_iter,role,active,created_at) VALUES(?,?,?,?,?, 'admin',1,?)").bind(id,name,h.salt,h.hash,ITER,Math.floor(Date.now()/1000)).run();}catch{return fail("Admin setup failed; username may exist.",409);}await audit(env,id,"admin.bootstrap");return json({ok:true,message:"Admin created. Sign in now."},201);}
if(p==="/api/auth/login"&&m==="POST"){if(!sameOrigin(req))return fail("Cross-origin request rejected.",403);const d=await body(req),name=String(d.username||"").trim().toLowerCase().slice(0,64),pw=String(d.password||"");if(!name||pw.length>128)return fail("Invalid username or password.",401);const ipHash=await ipId(req,env),now=Math.floor(Date.now()/1000);
await env.DB.prepare("DELETE FROM auth_attempts WHERE attempted_at<?").bind(now-86400).run();
const reserve=await reserveLoginAttempt(env,name,ipHash,now);if(!reserve)return fail("Too many sign-in attempts. Try again in 15 minutes.",429,{"retry-after":"900"});
const user=await env.DB.prepare("SELECT * FROM users WHERE username=?").bind(name).first(),usable=!!(user&&user.active),cred=usable?{salt:user.password_salt,hash:user.password_hash,iter:user.password_iter||100000}:await dummy(),good=await passOK(pw,cred.salt,cred.hash,cred.iter),ok=usable&&good;
if(!ok){if(user&&cred.iter<ITER)await passHash(pw,rand(16),ITER-cred.iter);await audit(env,user?user.id:null,"auth.login_failed",name+" ip:"+ipHash.slice(0,8));return fail("Invalid username or password.",401);}
if(cred.iter<ITER){const upgraded=await passHash(pw);await env.DB.prepare("UPDATE users SET password_salt=?,password_hash=?,password_iter=? WHERE id=?").bind(upgraded.salt,upgraded.hash,ITER,user.id).run();}
await env.DB.prepare("DELETE FROM auth_attempts WHERE id=?").bind(reserve.id).run();await env.DB.prepare("DELETE FROM sessions WHERE expires_at<?").bind(now).run();
const raw=await newSession(env,user.id,now);await audit(env,user.id,"auth.login");return json({ok:true,user:{id:user.id,username:user.username,role:user.role}},200,{"set-cookie":setCookie(raw)});}
if(p==="/api/auth/logout"&&m==="POST"){if(!sameOrigin(req))return fail("Cross-origin request rejected.",403);const raw=cookie(req),user=await current(req,env);if(raw)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await hash(raw)).run();if(user)await audit(env,user.id,"auth.logout");return json({ok:true},200,{"set-cookie":clearCookie()});}
if(p==="/api/public/tools"&&m==="GET"){const publicModes=new Set(["browser","browser-file","external","command"]);return json({authenticated:false,role:"guest",tools:TOOLS.filter(t=>publicModes.has(t.mode)).map(({id,name,group,mode,description})=>({id,name,group,mode,description}))},200,{"cache-control":"public, max-age=300, stale-while-revalidate=600"});}
const user=await current(req,env);if(!user)return fail("Authentication required.",401);if(m!=="GET"&&!sameOrigin(req))return fail("Cross-origin request rejected.",403);
if(p==="/api/auth/me"&&m==="GET")return json({user:{id:user.id,username:user.username,role:user.role}});
if(p==="/api/auth/change-password"&&m==="POST"){const d=await body(req),cur=String(d.currentPassword||""),nw=String(d.newPassword||""),ipHash=await ipId(req,env),now=Math.floor(Date.now()/1000),key="__pw:"+user.id;
const reserve=await reservePairAttempt(env,key,ipHash,now,LOGIN_PAIR_LIMIT);if(!reserve)return fail("Too many attempts. Try again in 15 minutes.",429,{"retry-after":"900"});
const row=await env.DB.prepare("SELECT password_salt,password_hash,password_iter FROM users WHERE id=?").bind(user.id).first();
if(cur.length>128||!await passOK(cur,row.password_salt,row.password_hash,row.password_iter||100000)){await audit(env,user.id,"auth.password_change_failed");return fail("Current password is incorrect.",403);}
const bad=weakPassword(nw,user.username);if(bad){await env.DB.prepare("DELETE FROM auth_attempts WHERE id=?").bind(reserve.id).run();return fail(bad);}if(nw===cur){await env.DB.prepare("DELETE FROM auth_attempts WHERE id=?").bind(reserve.id).run();return fail("New password must differ from the current password.");}await env.DB.prepare("DELETE FROM auth_attempts WHERE id=?").bind(reserve.id).run();
const h=await passHash(nw);await env.DB.prepare("UPDATE users SET password_salt=?,password_hash=?,password_iter=? WHERE id=?").bind(h.salt,h.hash,ITER,user.id).run();await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id).run();const raw=await newSession(env,user.id,now);await audit(env,user.id,"auth.password_changed");return json({ok:true},200,{"set-cookie":setCookie(raw)});}
if(p==="/api/auth/logout-all"&&m==="POST"){await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id).run();await audit(env,user.id,"auth.logout_all");return json({ok:true},200,{"set-cookie":clearCookie()});}
if(p==="/api/tools"&&m==="GET"){let ids=[];if(user.role==="user"){const r=await env.DB.prepare("SELECT tool_id FROM user_tool_access WHERE user_id=? AND enabled=1").bind(user.id).all();ids=(r.results||[]).map(x=>x.tool_id);}return json({role:user.role,tools:TOOLS.filter(t=>user.role==="admin"||ids.includes(t.id))});}
if(p==="/api/tools/subnet"&&m==="POST"){if(user.role!=="admin"){const access=await env.DB.prepare("SELECT enabled FROM user_tool_access WHERE user_id=? AND tool_id=?").bind(user.id,"subnet").first();if(!access?.enabled)return fail("This tool is not enabled for your account.",403);}const d=await body(req);try{const result=subnet(String(d.ip||""),Number(d.prefix));await audit(env,user.id,"tool.subnet",result.input+result.cidr);return json(result);}catch(e){return fail(e.message);}}
if(p.startsWith("/api/admin/")){if(user.role!=="admin")return fail("Administrator permission required.",403);
if(p==="/api/admin/overview"&&m==="GET"){const since=Math.floor(Date.now()/1000)-86400,now=Math.floor(Date.now()/1000);const [users,sessions,events,failures,attempts]=await Promise.all([env.DB.prepare("SELECT COUNT(*) total,COALESCE(SUM(active=1),0) active,COALESCE(SUM(role='admin'),0) admins FROM users").first(),env.DB.prepare("SELECT COUNT(*) total FROM sessions WHERE expires_at>?").bind(now).first(),env.DB.prepare("SELECT COUNT(*) total FROM audit_logs WHERE created_at>?").bind(since).first(),env.DB.prepare("SELECT COUNT(*) total FROM audit_logs WHERE action='auth.login_failed' AND created_at>?").bind(since).first(),env.DB.prepare("SELECT COUNT(*) total FROM auth_attempts WHERE attempted_at>?").bind(now-WINDOW).first()]);return json({generatedAt:now,windowSeconds:86400,users:{total:users.total,active:users.active,admins:users.admins},sessions:{active:sessions.total},activity:{events24h:events.total,failedLogins24h:failures.total,authAttempts15m:attempts.total},toolCatalog:{total:TOOLS.length}});}

if(p==="/api/admin/sessions"&&m==="GET"){const mine=cookie(req)?await env.DB.prepare("SELECT id FROM sessions WHERE token_hash=?").bind(await hash(cookie(req))).first():null,r=await env.DB.prepare("SELECT s.id,u.username,s.created_at,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.expires_at>? ORDER BY s.created_at DESC LIMIT 200").bind(Math.floor(Date.now()/1000)).all();return json({sessions:(r.results||[]).map(x=>({...x,current:!!mine&&mine.id===x.id}))});}
const sr=/^\/api\/admin\/sessions\/([0-9a-f-]{36})\/revoke$/.exec(p);if(sr&&m==="POST"){const x=await env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(sr[1]).run();if(!x.meta.changes)return fail("Session not found.",404);await audit(env,user.id,"admin.session.revoke",sr[1]);return json({ok:true});}
const pr=/^\/api\/admin\/users\/([0-9a-f-]{36})\/password$/.exec(p);if(pr&&m==="POST"){const d=await body(req),t=await env.DB.prepare("SELECT id,username,role FROM users WHERE id=?").bind(pr[1]).first();if(!t)return fail("User not found.",404);if(t.role!=="user")return fail("Use change-password for administrator accounts.",403);const bad=weakPassword(String(d.password||""),t.username);if(bad)return fail(bad);const h=await passHash(String(d.password));await env.DB.prepare("UPDATE users SET password_salt=?,password_hash=?,password_iter=? WHERE id=?").bind(h.salt,h.hash,ITER,t.id).run();await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(t.id).run();await audit(env,user.id,"admin.user.password_reset",t.id);return json({ok:true});}
if(p==="/api/admin/users"&&m==="GET"){const r=await env.DB.prepare("SELECT id,username,role,active,created_at FROM users ORDER BY created_at DESC LIMIT 200").all();return json({users:r.results||[]});}
if(p==="/api/admin/users"&&m==="POST"){const d=await body(req),name=String(d.username||"").trim().toLowerCase(),pw=String(d.password||"");if(!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(name))return fail("Invalid username.");{const bad=weakPassword(pw,name);if(bad)return fail(bad);}const h=await passHash(pw),id=crypto.randomUUID();try{await env.DB.prepare("INSERT INTO users(id,username,password_salt,password_hash,password_iter,role,active,created_at) VALUES(?,?,?,?,?, 'user',1,?)").bind(id,name,h.salt,h.hash,ITER,Math.floor(Date.now()/1000)).run();}catch{return fail("Username already exists.",409);}await audit(env,user.id,"admin.user.create",name);return json({ok:true,id,username:name,role:"user"},201);}
const parts=p.split("/");const um=parts.length===6&&parts[1]==="api"&&parts[2]==="admin"&&parts[3]==="users"&&["disable","enable"].includes(parts[5])?[parts[4],parts[5]]:null;if(um&&m==="POST"){const target=await env.DB.prepare("SELECT id,role FROM users WHERE id=?").bind(um[0]).first();if(!target)return fail("User not found.",404);if(target.role==="admin")return fail("Admin accounts cannot be changed here.",403);const active=um[1]==="enable"?1:0;await env.DB.prepare("UPDATE users SET active=? WHERE id=?").bind(active,target.id).run();await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(target.id).run();await audit(env,user.id,"admin.user."+um[1],target.id);return json({ok:true});}
if(p==="/api/admin/tool-access"&&m==="GET"){const targetId=new URL(req.url).searchParams.get("userId")||"";const target=await env.DB.prepare("SELECT id,role FROM users WHERE id=?").bind(targetId).first();if(!target||target.role!=="user")return fail("A valid user account is required.",400);const r=await env.DB.prepare("SELECT tool_id,enabled FROM user_tool_access WHERE user_id=? ORDER BY tool_id").bind(targetId).all();return json({userId:targetId,access:r.results||[]});} if(p==="/api/admin/audit"&&m==="GET"){const r=await env.DB.prepare("SELECT a.action,a.detail,a.created_at,u.username FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 100").all();return json({events:r.results||[]});}
const accessParts=p.split("/");const accessMatch=accessParts.length===7&&accessParts[1]==="api"&&accessParts[2]==="admin"&&accessParts[3]==="users"&&/^[0-9a-f-]{36}$/.test(accessParts[4])&&accessParts[5]==="tools"&&/^[a-z0-9-]+$/.test(accessParts[6])?[accessParts[4],accessParts[6]]:null;if(accessMatch&&m==="POST"){const target=await env.DB.prepare("SELECT id,role FROM users WHERE id=?").bind(accessMatch[0]).first();if(!target||target.role!=="user")return fail("User account not found.",404);const id=accessMatch[1];if(!TOOLS.some(t=>t.id===id))return fail("Unknown tool.",404);const d=await body(req),enabled=d.enabled===true?1:0;await env.DB.prepare("INSERT INTO user_tool_access(user_id,tool_id,enabled,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,tool_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at").bind(target.id,id,enabled,Math.floor(Date.now()/1000)).run();await audit(env,user.id,"admin.user.tool_access",target.id+":"+id+":"+enabled);return json({ok:true,userId:target.id,tool:id,userAccess:!!enabled});}}
return fail("Not found.",404);
}
const SEC={"x-content-type-options":"nosniff","strict-transport-security":"max-age=31536000","x-frame-options":"DENY","cross-origin-resource-policy":"same-origin","cross-origin-opener-policy":"same-origin","x-permitted-cross-domain-policies":"none","permissions-policy":"camera=(), microphone=(), geolocation=(), payment=(), usb=()"};
const API_CSP="default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",STATIC_CSP="default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://speed.cloudflare.com https://cloudflare-dns.com https://api.ipify.org https://api.macvendors.com https://crt.sh; upgrade-insecure-requests";
const secure=(src,csp,ref)=>{const h=new Headers(src);for(const[k,v]of Object.entries(SEC))h.set(k,v);h.set("content-security-policy",csp);h.set("referrer-policy",ref);return h;};
const redirect=(to,req)=>new Response(null,{status:302,headers:secure({location:new URL(to,req.url).href,"cache-control":"no-store"},STATIC_CSP,"strict-origin-when-cross-origin")});
export default{async fetch(req,env){try{const u=new URL(req.url);if(u.pathname.startsWith("/api/")){let r;try{r=await api(req,env);}catch(e){if(e instanceof HttpError)r=json({error:e.message},e.status);else throw e;}return new Response(r.body,{status:r.status,headers:secure(r.headers,API_CSP,"no-referrer")});}
const base=(u.pathname.replace(/\/+$/,"").replace(/\.html$/i,"")||"/").toLowerCase();
if(base==="/dashboard"&&!await current(req,env))return redirect("/auth.html",req);if(base==="/auth"&&await current(req,env))return redirect("/dashboard.html",req);
const asset=await env.ASSETS.fetch(req),headers=secure(asset.headers,STATIC_CSP,"strict-origin-when-cross-origin");if(u.pathname.endsWith(".html"))headers.set("cache-control","no-cache");return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});}catch(e){console.error("unhandled",e&&e.message);return new Response(JSON.stringify({error:"Internal server error."}),{status:500,headers:secure({"content-type":"application/json; charset=utf-8","cache-control":"no-store"},API_CSP,"no-referrer")});}}};
