# Installation & Verification

## Supported environments
- Ubuntu/Debian/Kali Linux
- Termux with Python and Scapy available
- Python 3.10+

## Install
    python3 -m venv .venv
    source .venv/bin/activate
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt

## Verify
    python3 analyze.py capture.pcap

The analyzer is offline: it reads an existing PCAP and does not capture, inject, or transmit packets.

## Troubleshooting
- If Scapy is missing, activate the virtual environment and reinstall requirements.
- On Termux, install Python with: pkg install python
- Large captures can require substantial RAM.
