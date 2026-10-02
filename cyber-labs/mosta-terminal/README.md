# Mosta Terminal Branding

Professional-style Linux/Termux launchers for the repository labs.

The upstream tool or project name is preserved. MOSTA is only the terminal branding shown above it.

## Requirements

- Linux or Termux
- Bash
- Python 3.10+ for Python-based labs
- Project-specific dependencies listed in each lab requirements.txt

## Installation

From the repository root:

    cd cyber-labs/mosta-terminal
    chmod +x *.sh
    ./install.sh

The installer supports both Bash and Zsh when their rc files already exist.

## Launchers

Each launcher prints the branding header and then executes the real project:

- run-network-toolkit
- run-http-auditor
- run-pcap
- run-soc
- run-config-audit
- run-route
- run-triage

Example:

    run-network-toolkit subnet 192.168.10.0/24

For a project with third-party dependencies, install that project's requirements first:

    python3 -m pip install -r ../pcap-analysis/requirements.txt

## Design rule

The launchers do not rename, replace, or reimplement upstream security tools. They only provide terminal branding and invoke the selected authorized lab or tool.
