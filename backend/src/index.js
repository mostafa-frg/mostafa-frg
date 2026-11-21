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
  }
];

const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...h}});
const fail=(m,s=400)=>json({error:m},s),b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll("+","-").replaceAll("/","_").replaceAll("=",""),unb64=s=>Uint8Array.from(atob(s.replaceAll("-","+").replaceAll("_","/")),c=>c.charCodeAt(0)),rand=n=>crypto.getRandomValues(new Uint8Array(n));
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
function sameOrigin(req){try{return new URL(req.headers.get("Origin")||"").origin===new URL(req.url).origin;}catch{return false;}}
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
if(p==="/api/auth/bootstrap"&&m==="POST"){if(!sameOrigin(req))return fail("Cross-origin request rejected.",403);if(!env.ADMIN_BOOTSTRAP_TOKEN)return fail("Bootstrap is not configured.",503);const c=await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='admin'").first();if(c.n)return fail("Initial admin is already configured.",409);const ipHash=await ipId(req,env),now=Math.floor(Date.now()/1000),d=await body(req),name=String(d.username||"").trim().toLowerCase(),pw=String(d.password||""),reserve=await reservePairAttempt(env,"__bootstrap",ipHash,now,BOOT_LIMIT);if(!reserve)return fail("Too many setup attempts. Try again later.",429);if(!await tokenOK(d.bootstrapToken,env.ADMIN_BOOTSTRAP_TOKEN))return fail("Invalid bootstrap token.",403);await env.DB.prepare("DELETE FROM auth_attempts WHERE id=?").bind(reserve.id).run();if(!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(name))return fail("Invalid username.");{const bad=weakPassword(pw,name);if(bad)return fail(bad);}const h=await passHash(pw),id=crypto.randomUUID();try{await env.DB.prepare("INSERT INTO users(id,username,password_salt,password_hash,password_iter,role,active,created_at) VALUES(?,?,?,?,?, 'admin',1,?)").bind(id,name,h.salt,h.hash,ITER,Math.floor(Date.now()/1000)).run();}catch{return fail("Admin setup failed; username may exist.",409);}await audit(env,id,"admin.bootstrap");return json({ok:true,message:"Admin created. Sign in now."},201);}
if(p==="/api/auth/login"&&m==="POST"){if(!sameOrigin(req))return fail("Cross-origin request rejected.",403);const d=await body(req),name=String(d.username||"").trim().toLowerCase().slice(0,64),pw=String(d.password||"");if(!name||pw.length>128)return fail("Invalid username or password.",401);const ipHash=await ipId(req,env),now=Math.floor(Date.now()/1000);
await env.DB.prepare("DELETE FROM auth_attempts WHERE attempted_at<?").bind(now-86400).run();
const reserve=await reserveLoginAttempt(env,name,ipHash,now);if(!reserve)return fail("Too many sign-in attempts. Try again in 15 minutes.",429);
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
const reserve=await reservePairAttempt(env,key,ipHash,now,LOGIN_PAIR_LIMIT);if(!reserve)return fail("Too many attempts. Try again in 15 minutes.",429);
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
if(p==="/api/admin/tool-access"&&m==="GET"){const targetId=new URL(req.url).searchParams.get("userId")||"";const target=await env.DB.prepare("SELECT id,role FROM users WHERE id=?").bind(targetId).first();if(!target||target.role!=="user")return fail("A valid user account is required.",400);const r=await env.DB.prepare("SELECT tool_id,enabled FROM user_tool_access WHERE user_id=? ORDER BY tool_id").bind(targetId).all();return json({userId:targetId,access:r.results||[]});} if(p==="/api/admin/audit"&&m==="GET"){const q=u.searchParams,rawLimit=q.get("limit"),limit=rawLimit===null?50:Number(rawLimit),cursor=q.get("before");if(!Number.isInteger(limit)||limit<1||limit>100)return fail("Audit page limit must be between 1 and 100.");if(cursor!==null&&(!/^[1-9][0-9]{0,15}$/.test(cursor)||!Number.isSafeInteger(Number(cursor))))return fail("Invalid audit cursor.");const rows=cursor===null?await env.DB.prepare("SELECT a.id,a.action,a.detail,a.created_at,u.username FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT ?").bind(limit+1).all():await env.DB.prepare("SELECT a.id,a.action,a.detail,a.created_at,u.username FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id WHERE a.id<? ORDER BY a.id DESC LIMIT ?").bind(Number(cursor),limit+1).all();const all=rows.results||[],hasMore=all.length>limit,events=all.slice(0,limit);return json({events:events.map(({id,...event})=>event),nextCursor:hasMore?String(events[events.length-1].id):null,hasMore});}
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
