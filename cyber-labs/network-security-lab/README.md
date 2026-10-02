# Network Security Lab

A practical TCP service discovery and inventory lab for authorized systems.

## Scope

This project is designed for localhost and systems you are explicitly authorized to test. It uses TCP connect checks rather than stealth or exploitation techniques.

## Features

- TCP port discovery
- Service/banner collection where available
- JSON report output
- Configurable port ranges
- Timeout and concurrency controls
- Clear authorization notice
- No credential attacks, payload delivery, or exploitation

## Run

```bash
python3 scanner.py --target 127.0.0.1 --ports 1-1024 --output report.json
```

## Learning goals

- TCP connection behavior
- Service enumeration
- Network inventory
- Basic security reporting
- Safe automation with Python
