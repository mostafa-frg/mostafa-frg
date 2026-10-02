# Network Toolkit

A practical Python toolkit for authorized network administration and security work.

## Commands

- `subnet` — calculate IPv4 network, broadcast, host range and utilization
- `dns` — resolve A/AAAA records and measure lookup time
- `tcp` — test TCP connectivity to a specified host and port
- `inventory` — read a CSV inventory and produce a health summary

Examples:

```bash
python3 nettool.py subnet 192.168.10.25/24
python3 nettool.py dns example.com
python3 nettool.py tcp 192.168.10.1 443
```

The toolkit performs diagnostics only and does not scan arbitrary ranges automatically.
