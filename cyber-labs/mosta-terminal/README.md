# Linux Desktop CLI Layer

A command layer for running the repository's Python labs and selected native Linux networking utilities from a desktop Linux shell.

The launcher is optional. Every lab remains independently runnable with Python; the aliases are convenience wrappers and do not rename or reimplement upstream tools.

## Requirements

- Desktop Linux distribution
- Bash and GNU core utilities
- Python 3.10+
- Git
- Dependencies listed by an individual lab, where required

## Installation

From the repository root:

    cd cyber-labs/mosta-terminal
    chmod +x install.sh
    ./install.sh

The installer creates links under ~/.local/bin, installs the declared Python lab requirements, and adds that directory to existing Bash/Zsh startup files. Reload the shell, then run:

    mosta-doctor
    mosta

## Repository lab commands

    mnet
    mhttp
    mpcap
    msoc
    mconf
    mroute
    mtriage
    mfim
    mdet
    mlog
    mnorm
    mpipe
    mvlan
    mfw
    mospf
    mstp
    mnat
    macl
    msnmp
    msyslog
    mflow
    mipam
    msubnet
    mtopo
    mad
    mpriv
    mreport
    mdns
    mmon
    mscan
    mauto

Run `mosta` for the full command index. Use `mosta-index list` or `mosta-index search <term>` to browse the upstream CLI catalog, and `mosta-doctor` to inspect installed dependencies. The index browser reads local CSV data and never executes a selected upstream tool.

## Native Linux commands

The wrapper layer exposes commands such as mnmap, mnc, mdig, mtcpdump, msocat, mtracepath, mtraceroute, mwhois, mcurl, mwget, and mssh. Each wrapper passes arguments to the real upstream executable. A wrapper exits with an explicit error if its upstream command is missing.

Optional utilities such as TShark, Wireshark, Scapy, Aircrack-ng, Kismet, Zeek, Suricata, and web assessment tools must be installed and configured separately using their official Linux distribution channels.

## Validation and boundaries

Run mosta-doctor after installation. The health check distinguishes required commands from optional tools; it does not claim an optional package is installed when it is absent.

The layer does not run arbitrary commands on remote systems, bypass permissions, or guarantee hardware-dependent packet capture. Use diagnostics and security tools only on systems you own or are explicitly authorized to test.