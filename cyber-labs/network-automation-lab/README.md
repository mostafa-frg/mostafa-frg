# Network Automation Lab

Generates repeatable Cisco IOS-style configuration from a small YAML-like JSON inventory.

## Workflow

1. Edit `inventory.json`
2. Run `python3 build.py inventory.json`
3. Review generated configurations in `output/`
4. Apply manually to devices after change review

No device connection is made by this project.

## Focus

VLANs, management addressing, SSH-only VTY access, NTP, banners, and interface descriptions.
