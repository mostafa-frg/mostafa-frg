# Desktop CLI & Security Tool Catalog

A desktop-first reference for Windows 10/11, Linux distributions, and macOS. It contains upstream project links, practical installation routes, verification commands, and platform limitations. It does not bundle third-party executables, run commands, collect personal data, or silently install software.

> **Use responsibly:** run network/security assessments only against systems you own or have explicit written authorization to test. Prefer isolated labs and offline evidence. Review each upstream license before redistribution.

## Installation conventions

- **Ubuntu/Debian:** `sudo apt update` then `sudo apt install PACKAGE`.
- **Fedora:** `sudo dnf install PACKAGE`.
- **Arch Linux:** `sudo pacman -S PACKAGE`.
- **macOS:** install Homebrew from its official website, then `brew install PACKAGE`.
- **Windows:** use the official vendor installer or Windows Package Manager (`winget`) only when the package ID is confirmed by `winget search NAME`. Some packet-capture and low-level tools require Npcap, drivers, or elevated permissions.
- Package names and availability differ by OS release. Search the distribution's official package index before substituting a package name. Never paste an unreviewed remote script into an elevated shell.

## 1. Network discovery and diagnostics

| Tool | Purpose | Linux package / command | macOS | Windows | Official source |
|---|---|---|---|---|---|
| Nmap | Authorized host and service inventory | `nmap` | `brew install nmap` | `winget search Nmap` | [nmap.org](https://nmap.org/) |
| Wireshark / TShark | Packet capture and protocol analysis | `wireshark` / `tshark` | `brew install --cask wireshark` | Official installer; install Npcap when required | [wireshark.org](https://www.wireshark.org/) |
| tcpdump | Packet capture and filtering | `tcpdump` | Included with macOS on many versions; verify with `tcpdump --version` | Use Wireshark/Npcap or WSL2 Linux | [tcpdump.org](https://www.tcpdump.org/) |
| Ncat (Nmap) | TCP/UDP connectivity and troubleshooting | `ncat` (from Nmap packages) | Included with Nmap | Included with Nmap | [nmap.org/ncat](https://nmap.org/ncat/) |
| Socat | Socket relay and protocol diagnostics | `socat` | `brew install socat` | Use WSL2 or a trusted native build | [socat](https://www.dest-unreach.org/socat/) |
| iperf3 | Controlled throughput testing | `iperf3` | `brew install iperf3` | Official builds / trusted package source | [iperf.fr](https://iperf.fr/) |
| traceroute | Network path diagnostics | `traceroute` | `traceroute` (system utility) | `tracert` is built in | [traceroute](https://traceroute.sourceforge.net/) |
| MTR | Combined ping and route diagnostics | `mtr` | `brew install mtr` | Use WSL2 or WinMTR from its official project | [mtr](https://www.bitwizard.nl/mtr/) |
| iproute2 | Linux interfaces, routes and socket state | `iproute2` | Not a native macOS package | Use Windows networking cmdlets or WSL2 | [kernel.org](https://www.kernel.org/pub/linux/utils/net/iproute2/) |
| Netdiscover / arp-scan | Local-segment ARP inventory | `arp-scan` | Package availability varies | Use an authorized native alternative or Linux VM | [arp-scan](https://github.com/royhills/arp-scan) |
| Masscan | High-speed authorized port inventory | `masscan` | Build/package availability varies | Prefer isolated Linux lab | [masscan](https://github.com/robertdavidgraham/masscan) |
| RustScan | Fast port discovery front-end | See upstream releases | See upstream releases | See upstream releases | [RustScan](https://github.com/RustScan/RustScan) |
| DNS utilities | DNS lookup and record troubleshooting | `dnsutils` (Debian) / `bind-utils` (Fedora) | `brew install bind` | `nslookup` built in; BIND tools via approved package source | [BIND](https://www.isc.org/bind/) |
| whois | Registration-data lookup | `whois` | `brew install whois` | `winget search whois` or approved vendor build | [GNU whois](https://github.com/rfc1036/whois) |
| curl | HTTP/API and transfer diagnostics | `curl` | Usually preinstalled; `brew install curl` | Included on current Windows versions | [curl.se](https://curl.se/) |

## 2. Web and API security assessment

| Tool | Purpose | Linux package / command | macOS | Windows | Official source |
|---|---|---|---|---|---|
| OWASP ZAP | DAST and web proxy testing | Official ZAP package/release | Official macOS download | Official Windows installer | [zaproxy.org](https://www.zaproxy.org/) |
| Burp Suite Community | Intercepting proxy and manual testing | Official installer | Official installer | Official installer | [PortSwigger](https://portswigger.net/burp/communitydownload) |
| ffuf | Authorized content discovery | Go install / official release | Official release | Official release | [ffuf](https://github.com/ffuf/ffuf) |
| Gobuster | Authorized directory and DNS enumeration | Go install / distro package | Official release | Official release | [Gobuster](https://github.com/OJ/gobuster) |
| Nikto | Web server configuration checks | `nikto` where packaged | Homebrew/package availability varies | Use WSL2 or official Perl environment | [Nikto](https://github.com/sullo/nikto) |
| SQLMap | Controlled SQL injection validation | `sqlmap` | `brew install sqlmap` where available | Python 3 + official source | [sqlmap.org](https://sqlmap.org/) |
| Nuclei | Template-based security checks | Official Go release | Official release | Official release | [ProjectDiscovery](https://github.com/projectdiscovery/nuclei) |
| httpx | HTTP service probing | Official Go release | Official release | Official release | [ProjectDiscovery](https://github.com/projectdiscovery/httpx) |
| testssl.sh | TLS configuration assessment | `testssl.sh` release / Git | Official source; requires supported shell tools | WSL2 recommended | [testssl.sh](https://testssl.sh/) |
| OpenSSL | TLS and certificate inspection | `openssl` | `brew install openssl` | Official builds or Git for Windows package source | [OpenSSL](https://www.openssl.org/) |
| WhatWeb | Web technology identification | Official Ruby project/package | Ruby + official source | Ruby + official source / WSL2 | [WhatWeb](https://github.com/urbanadventurer/WhatWeb) |

## 3. Defensive monitoring, detection and incident response

| Tool | Purpose | Linux package / command | macOS | Windows | Official source |
|---|---|---|---|---|---|
| Zeek | Network security monitoring and protocol metadata | `zeek` (official repository may be required) | Official packages | Linux VM/WSL2 recommended | [zeek.org](https://zeek.org/) |
| Suricata | Network IDS/IPS and file inspection | `suricata` | Official documentation/build | Windows support is limited; use Linux sensor | [suricata.io](https://suricata.io/) |
| YARA | Pattern-based malware/sample classification | `yara` | `brew install yara` | Official Windows binaries/build | [VirusTotal YARA](https://github.com/VirusTotal/yara) |
| osquery | SQL-style endpoint visibility | Official package repository | Official package | Official MSI | [osquery.io](https://www.osquery.io/) |
| Sysmon | Windows event telemetry | Not applicable | Not applicable | Microsoft Sysinternals download | [Sysmon](https://learn.microsoft.com/sysinternals/downloads/sysmon) |
| Sysinternals Suite | Windows troubleshooting and forensics | Not applicable | Not applicable | Microsoft official suite | [Sysinternals](https://learn.microsoft.com/sysinternals/) |
| Wazuh agent | Endpoint telemetry for a managed SIEM | Official Wazuh repository | Official package | Official MSI | [Wazuh](https://wazuh.com/) |
| Velociraptor | Endpoint visibility and DFIR collection | Official release | Official release | Official release | [Velociraptor](https://docs.velociraptor.app/) |
| Volatility 3 | Memory-forensics framework | Python package / official source | Python package | Python package | [Volatility](https://github.com/volatilityfoundation/volatility3) |
| The Sleuth Kit | Filesystem forensic analysis | `sleuthkit` | `brew install sleuthkit` | Official builds / WSL2 | [Sleuth Kit](https://www.sleuthkit.org/) |
| Plaso / log2timeline | Timeline generation from forensic artifacts | Official packages / Python environment | Python environment | Python environment / WSL2 | [Plaso](https://github.com/log2timeline/plaso) |

## 4. File, data and malware-analysis utilities

| Tool | Purpose | Linux package / command | macOS | Windows | Official source |
|---|---|---|---|---|---|
| jq | JSON parsing and transformation | `jq` | `brew install jq` | `winget search jq` | [jqlang](https://jqlang.org/) |
| yq | YAML/JSON/XML processing | Official release | `brew install yq` | Official release | [mikefarah/yq](https://github.com/mikefarah/yq) |
| ripgrep | Fast recursive text search | `ripgrep` | `brew install ripgrep` | `winget search ripgrep` | [ripgrep](https://github.com/BurntSushi/ripgrep) |
| fd | Fast file discovery | `fd-find` (Debian) / `fd-find` or `fd` by distro | `brew install fd` | `winget search sharkdp.fd` | [fd](https://github.com/sharkdp/fd) |
| fzf | Interactive fuzzy finder | `fzf` | `brew install fzf` | `winget search fzf` | [fzf](https://github.com/junegunn/fzf) |
| bat | Syntax-highlighted file viewer | `bat` (sometimes executable `batcat`) | `brew install bat` | `winget search sharkdp.bat` | [bat](https://github.com/sharkdp/bat) |
| ExifTool | Metadata inspection and removal | `libimage-exiftool-perl` | `brew install exiftool` | Official Windows executable | [ExifTool](https://exiftool.org/) |
| Binwalk | Firmware image inspection | Official release/package | Official source | WSL2 recommended | [Binwalk](https://github.com/ReFirmLabs/binwalk) |
| Ghidra | Reverse engineering and binary analysis | Official release | Official release | Official release | [Ghidra](https://ghidra-sre.org/) |
| JADX | Android application static analysis | Official release | Official release | Official release | [JADX](https://github.com/skylot/jadx) |
| CyberChef | Local data transformation and decoding | Self-hosted/local web app | Browser/local app | Browser/local app | [CyberChef](https://github.com/gchq/CyberChef) |

## 5. Password and cryptographic auditing

| Tool | Purpose | Linux package / command | macOS | Windows | Official source |
|---|---|---|---|---|---|
| John the Ripper | Offline password-hash auditing | `john` | `brew install john-jumbo` | Official jumbo build | [Openwall](https://www.openwall.com/john/) |
| Hashcat | Offline password-hash auditing | `hashcat` | Official build; hardware support varies | Official Windows build | [Hashcat](https://hashcat.net/hashcat/) |
| KeePassXC | Local password vault | `keepassxc` | `brew install --cask keepassxc` | Official installer | [KeePassXC](https://keepassxc.org/) |
| age | Simple file encryption | `age` | `brew install age` | Official release | [age](https://github.com/FiloSottile/age) |
| GnuPG | OpenPGP encryption and signatures | `gnupg` | `brew install gnupg` | Gpg4win | [GnuPG](https://gnupg.org/) |

## 6. System administration and developer workflows

| Tool | Purpose | Linux package / command | macOS | Windows | Official source |
|---|---|---|---|---|---|
| Git | Version control | `git` | `brew install git` | Git for Windows | [git-scm.com](https://git-scm.com/) |
| Python | Automation and analysis runtime | `python3` | Official installer / Homebrew | Official installer | [python.org](https://www.python.org/) |
| Node.js | JavaScript runtime | `nodejs` / `npm` | `brew install node` | Official installer | [nodejs.org](https://nodejs.org/) |
| Go | Compiled tooling and services | `golang` | `brew install go` | Official MSI | [go.dev](https://go.dev/) |
| Docker Engine / Desktop | Containers and isolated labs | Official Linux Engine docs | Docker Desktop | Docker Desktop | [docker.com](https://www.docker.com/) |
| Podman | Daemonless containers | `podman` | Podman Desktop / machine | Podman Desktop | [podman.io](https://podman.io/) |
| Ansible | Configuration automation | `ansible` | Python/pip or supported package | WSL2 recommended | [ansible.com](https://www.ansible.com/) |
| Terraform | Infrastructure as code | Official HashiCorp repository | `brew install hashicorp/tap/terraform` | Official Windows package | [developer.hashicorp.com](https://developer.hashicorp.com/terraform) |
| kubectl | Kubernetes administration | Official Kubernetes repository | `brew install kubectl` | Official Windows package | [Kubernetes](https://kubernetes.io/docs/reference/kubectl/) |
| OpenSSH | Secure remote administration | `openssh-client` | Built in / Homebrew | Windows Optional Feature | [OpenSSH](https://www.openssh.com/) |
| rsync | File synchronization | `rsync` | `brew install rsync` | WSL2 or trusted build | [rsync.samba.org](https://rsync.samba.org/) |
| tmux | Terminal multiplexing | `tmux` | `brew install tmux` | WSL2 recommended | [tmux](https://github.com/tmux/tmux) |
| htop / btop | Process and resource monitoring | `htop` / `btop` | `brew install htop btop` | Windows Task Manager / approved build | [htop](https://htop.dev/) · [btop](https://github.com/aristocratos/btop) |

## Verification and safe installation checklist

1. Confirm the operating system, version, CPU architecture, and package manager.
2. Open the official upstream project and review its release notes and license.
3. Prefer signed releases and published checksums. Verify signatures where upstream provides them.
4. Install only the packages you need; avoid bulk installation of every catalog entry.
5. Verify the executable with its documented `--version`, `-V`, or `--help` command.
6. Review permissions, capture drivers, and firewall prompts before approving them.
7. Keep tools updated and remove unused software through the same package manager.
8. Never place passwords, API keys, private keys, personal files, or customer data in public issues, command examples, or commits.

## Platform notes

- **Windows:** WSL2 is the most consistent route for Linux-native network/DFIR utilities. Native packet capture can require Npcap and an approved driver installation. Windows security controls should not be disabled to make a tool work.
- **Linux:** capabilities, kernel features, distribution repositories, and user permissions determine which features work. Installing a package does not grant raw-socket or administrator privileges.
- **macOS:** Homebrew availability does not imply support for every kernel-level feature. Packet capture and filesystem access may require explicit macOS permissions.
- **All platforms:** this catalog is a starting point, not a compatibility guarantee. Check each upstream project's supported OS matrix before deployment.
