# Network Config Auditor

Checks a Cisco-style configuration file for common defensive issues.

## Checks

- Telnet transport
- Plain HTTP management
- Missing SSH-only VTY configuration
- Disabled/absent service password encryption
- Unrestricted management ACL patterns
- Weak SNMP community strings

Input is a local configuration file. No device connection is performed.
