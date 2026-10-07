# Log Normalizer

A small offline security-log normalization tool that converts common JSON/JSONL, syslog, and SSH authentication records into a stable JSONL schema.

## Features

- Offline and dependency-free: Python standard library only.
- JSON object normalization with common field aliases.
- Basic syslog parsing.
- SSH accepted/failed authentication extraction.
- Stable fields for host, process, PID, user, source IP/port, action, and event type.
- Unknown non-empty lines are preserved instead of silently dropped.

## Usage

    python log_normalizer.py INPUT.log
    python log_normalizer.py INPUT.log --pretty
    python log_normalizer.py INPUT.log -o normalized.jsonl

## Output schema

Each record contains: schema_version, timestamp, source, line, host, process, pid, event_type, action, user, src_ip, src_port, and message.

## Screenshots

![Input and normalized output](assets/screenshots/01-input-log.png)

Screenshots are reserved for verified runs of the real CLI. No fabricated command output is used.

## Safety

Use only with logs you are authorized to process. The tool is offline and does not transmit input.
