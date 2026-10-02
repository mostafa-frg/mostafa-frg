#!/usr/bin/env python3
#!/usr/bin/env python3
import argparse
import csv
import collections
import ipaddress

REQUIRED = {"src", "dst_port", "protocol", "bytes"}

def main():
    p = argparse.ArgumentParser(description="Offline normalized NetFlow analyzer")
    p.add_argument("csv")
    args = p.parse_args()
    try:
        with open(args.csv, newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
    except OSError as exc:
        p.error(f"cannot read CSV: {exc}")
    if not rows:
        p.error("CSV contains no data rows")
    missing = REQUIRED - set(rows[0])
    if missing:
        p.error(f"missing columns: {', '.join(sorted(missing))}")

    totals, ports, talkers = collections.Counter(), collections.Counter(), collections.Counter()
    valid = 0
    for line, r in enumerate(rows, 2):
        src, proto, port_text, byte_text = (r.get(k, "").strip() for k in ("src", "protocol", "dst_port", "bytes"))
        try:
            ipaddress.ip_address(src)
            port = int(port_text)
            byte_count = int(byte_text)
            if not 0 <= port <= 65535 or byte_count < 0:
                raise ValueError("invalid port/byte count")
        except ValueError as exc:
            print(f"[ERROR] line {line}: {exc}")
            continue
        proto = proto.upper()
        talkers[src] += byte_count
        ports[port] += byte_count
        totals[proto] += byte_count
        valid += 1

    print("Bytes by protocol:", dict(totals))
    print("Top sources:")
    for k, v in talkers.most_common(10):
        print(f"  {k:20} {v}")
    print("Top destination ports:")
    for k, v in ports.most_common(10):
        print(f"  {k:6} {v}")
    print(f"Valid records: {valid}/{len(rows)}")

if __name__ == "__main__":
    main()
