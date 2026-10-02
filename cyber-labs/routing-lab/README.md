# Routing Lab

Offline routing-policy lab for IPv4 static routes. It validates a route table for duplicate prefixes, invalid next hops, and overlapping entries, then produces a compact routing report.

## Run
```bash
python routing.py sample_routes.csv
```

This lab models routing decisions from supplied configuration data; it does not alter live routers.
