# Linux Desktop Security Tool Catalog

A reference catalog for common Linux desktop networking, security, and defensive monitoring tools. This catalog does not bundle third-party executables.

## Network
Nmap, Masscan, Netcat, Socat, iproute2, ss, tcpdump, Wireshark/TShark.

## Wireless
Aircrack-ng, Kismet, iw, wifite. Wireless monitor mode depends on the adapter, chipset, driver, kernel, and privileges; the presence of a command does not guarantee hardware support.

## Web/API
Burp Suite, OWASP ZAP, Nikto, ffuf, WhatWeb.

## DNS/Infrastructure
dig, nslookup, dnsrecon, dnsenum, traceroute, tracepath, mtr.

## Password auditing
John the Ripper, Hashcat, Hydra. Use password tools only for offline or explicitly authorized testing.

## Monitoring
Scapy, Zeek, Suricata.

## Exploitation research
Metasploit Framework, sqlmap, SearchSploit. Use only in isolated labs or against systems you are authorized to test.

The repository's own labs focus on local analysis, supplied evidence, defensive checks, and isolated environments rather than uncontrolled attack automation.