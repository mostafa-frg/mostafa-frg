#!/usr/bin/env python3
import argparse
from collections import Counter
from scapy.all import rdpcap, IP, IPv6, TCP, UDP, ICMP, DNS, DNSQR

def address(packet):
    if IP in packet:
        return packet[IP].src, packet[IP].dst
    if IPv6 in packet:
        return packet[IPv6].src, packet[IPv6].dst
    return None, None

def main():
    ap = argparse.ArgumentParser(description="Offline PCAP summary")
    ap.add_argument("pcap")
    args = ap.parse_args()

    packets = rdpcap(args.pcap)
    protocols = Counter()
    pairs = Counter()
    dns_queries = Counter()

    for p in packets:
        if TCP in p:
            protocols["TCP"] += 1
        elif UDP in p:
            protocols["UDP"] += 1
        elif ICMP in p:
            protocols["ICMP"] += 1
        else:
            protocols["other"] += 1

        src, dst = address(p)
        if src and dst:
            pairs[(src, dst)] += 1

        if DNS in p and p[DNS].qd and DNSQR in p:
            try:
                dns_queries[p[DNS].qd.qname.decode(errors="replace").rstrip(".")] += 1
            except Exception:
                pass

    print(f"Packets: {len(packets)}")
    print("\nProtocols:")
    for name, count in protocols.most_common():
        print(f"  {name}: {count}")

    print("\nTop address pairs:")
    for (src, dst), count in pairs.most_common(10):
        print(f"  {src} -> {dst}: {count}")

    print("\nDNS queries:")
    for name, count in dns_queries.most_common(10):
        print(f"  {name}: {count}")

if __name__ == "__main__":
    main()
