# SOC Log Analyzer

A defensive Python lab that parses SSH authentication logs and identifies repeated failed-login activity.

## Detection logic

The analyzer extracts timestamps, source IPs, usernames, and authentication outcomes, then groups failures by source IP and raises an alert when a configurable threshold is reached.

## Example

```bash
python3 analyzer.py sample_auth.log --threshold 5
```

This is intended for blue-team training, incident triage, and log-analysis practice.
