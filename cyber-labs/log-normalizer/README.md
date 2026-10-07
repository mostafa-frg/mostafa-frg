# Log Normalizer

A small offline security-log normalization tool that converts common JSON/JSONL, syslog, and authentication records into a stable JSONL schema.

## Features

- Offline and dependency-free: Python standard library only.
- JSON object normalization with common field aliases.
- Basic syslog parsing.
- Authentication accepted/failed extraction.
- Stable fields for host, process, PID, user, source IP/port, action, and event type.
- Unknown non-empty lines are preserved instead of silently dropped.
- Optional end-to-end integration with the Detection Rules Engine.

## Usage

    python log_normalizer.py INPUT.log
    python log_normalizer.py INPUT.log --pretty
    python log_normalizer.py INPUT.log -o normalized.jsonl

## Security Detection Pipeline

The project can feed normalized records directly into the repository's Detection Rules Engine:

    python pipeline.py INPUT.log RULES.json -o normalized.jsonl

The pipeline keeps the normalized output schema unchanged. It supplies a compatible `time` value to the detection engine in memory when a record already contains a timestamp.

Architecture:

    Raw logs
       |
       v
    Log Normalizer
       |
       +--> stable JSONL
       |
       v
    Detection Rules Engine
       |
       v
    Alerts

## Output schema

Each record contains: schema_version, timestamp, source, line, host, process, pid, event_type, action, user, src_ip, src_port, and message.

## Screenshots

![Input and normalized output](assets/screenshots/01-input-log.png)

Screenshots are reserved for verified runs of the real CLI. No fabricated command output is used.

## Testing

Run the normalizer tests and pipeline integration test from this directory:

    python -m unittest discover -s tests -p "test_*.py"

The repository CI is the authoritative verification path until a local run is performed.

## Safety

Use only with logs you are authorized to process. The tool is offline and does not transmit input.
