# Mosta Terminal

A practical Linux/Termux command layer for the repository labs and selected native networking tools.

Mosta is branding only. The real upstream command names remain unchanged.

## Requirements

- Termux on Android or a Linux shell
- Bash
- Python 3.10+
- Git
- Python dependencies are installed from each lab requirements.txt

Termux packages are managed with pkg. The official Termux repositories provide packages such as Nmap, DNS utilities, and netcat variants. Android permissions can still limit privileged packet operations.

## Installation

From the repository root:

    cd cyber-labs/mosta-terminal
    chmod +x install.sh
    ./install.sh

The installer:

1. Detects Termux.
2. Installs Python and Git if needed.
3. Installs the repository Python dependencies.
4. Installs the core Termux networking set on Termux.
5. Creates symlinked commands under ~/.local/bin.
6. Adds ~/.local/bin to existing Bash/Zsh rc files.
7. Leaves a health check at mosta-doctor.

Reload the shell after installation.

## Mosta commands

    mosta
    mosta-doctor

    mnet
    mhttp
    mpcap
    msoc
    mconf
    mroute
    mtriage
    mtool

Native networking tools are exposed with Mosta branding:

    mnmap
    mnc
    mdig
    mtcpdump
    msocat
    mtracepath
    mtraceroute
    mwhois
    mcurl
    mwget
    mssh

The wrapper passes arguments directly to the real executable.

Example:

    mnmap --version

The banner is added before the real Nmap output; Nmap itself is not renamed or reimplemented.

## External tool installation

On Termux, the core set can be installed or refreshed with:

    mosta-external-install

The core set is deliberately limited to portable networking and administration utilities. Tools requiring root, additional repositories, GUI components, or device-specific Android privileges are not falsely marked as installed.

For example, tshark/Wireshark-related functionality and mtr can involve additional Termux repositories or Android/root limitations, so they are treated separately rather than forced into the base installer.

## Validation

Run:

    mosta-doctor

The health check verifies the repository, Python, Git, Mosta commands, Python lab dependencies, and the core external networking tools. On Termux it also reports Android-specific privilege limitations.

## Design rule

The Mosta layer is an execution and installation layer. It does not rename, replace, or reimplement Nmap, Netcat, tcpdump, Scapy, or other upstream tools. Security testing should remain limited to systems and networks you own or are explicitly authorized to test.
