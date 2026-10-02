# NetFlow-style Traffic Analyzer

Parses a normalized CSV flow export and summarizes bytes, packets, top talkers, and destination ports.

## Run
```bash
python flow.py sample_flows.csv
```

This is offline analysis of supplied flow data; it does not capture traffic.
