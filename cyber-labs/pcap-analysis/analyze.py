#!/usr/bin/env python3
try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("PCAP ANALYSIS")
except Exception:
    pass
import argparse
from collections import Counter
from scapy.all import rdpcap,IP,IPv6,TCP,UDP,ICMP,DNS,DNSQR
def address(packet):
    if IP in packet: return packet[IP].src,packet[IP].dst
    if IPv6 in packet: return packet[IPv6].src,packet[IPv6].dst
    return None,None
def demo_packets():
    from scapy.all import Ether
    return [Ether()/IP(src="10.0.0.1",dst="10.0.0.2")/TCP(sport=1234,dport=80),
            Ether()/IP(src="10.0.0.2",dst="10.0.0.53")/UDP(sport=4000,dport=53)/DNS(rd=1,qd=DNSQR(qname="example.test")),
            Ether()/IP(src="10.0.0.1",dst="10.0.0.2")/ICMP()]
def main():
    ap=argparse.ArgumentParser(description="Offline PCAP summary; no capture or packet transmission"); ap.add_argument("pcap",nargs="?"); ap.add_argument("--demo",action="store_true",help="analyze a small generated sample capture"); args=ap.parse_args()
    if args.demo: packets=demo_packets()
    elif not args.pcap: ap.error("a PCAP file is required (or use --demo)")
    else:
        try: packets=rdpcap(args.pcap)
        except Exception as exc: ap.error(f"cannot read PCAP (is it a valid .pcap/.pcapng file?): {exc}")
    protocols=Counter(); pairs=Counter(); dns_queries=Counter()
    for packet in packets:
        if TCP in packet: protocols["TCP"]+=1
        elif UDP in packet: protocols["UDP"]+=1
        elif ICMP in packet: protocols["ICMP"]+=1
        else: protocols["other"]+=1
        src,dst=address(packet)
        if src and dst: pairs[(src,dst)]+=1
        if DNS in packet and packet[DNS].qd and DNSQR in packet:
            try: dns_queries[packet[DNS].qd.qname.decode(errors="replace").rstrip(".")]+=1
            except (AttributeError,UnicodeError): pass
    print(f"Packets: {len(packets)}"); print("\nProtocols:")
    for name,count in protocols.most_common(): print(f"  {name}: {count}")
    print("\nTop address pairs:")
    for (src,dst),count in pairs.most_common(10): print(f"  {src} -> {dst}: {count}")
    print("\nDNS queries:")
    for name,count in dns_queries.most_common(10): print(f"  {name}: {count}")
if __name__=="__main__": main()
