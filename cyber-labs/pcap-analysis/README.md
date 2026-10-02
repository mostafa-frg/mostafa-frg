# PCAP Analysis Lab

Offline packet-analysis exercises using Python and Scapy.

## Goals

- Identify common protocols in a capture
- Summarize source and destination pairs
- Count TCP/UDP/ICMP traffic
- Extract DNS query names from a supplied PCAP
- Practice evidence handling without generating traffic

Only analyze captures you own or are authorized to inspect.

## Run

```bash
pip install -r requirements.txt
python3 analyze.py capture.pcap
```
