# Firewall Rule Validator

Offline validator for ordered firewall ACL policies. Detects shadowed rules, contradictory entries, duplicate rules, and overly broad source/destination networks.

## Run
```bash
python validator.py sample_rules.csv
```

Input columns: `id,action,protocol,source,destination,dport`.

Designed for exported policy files and lab data; it does not modify or deploy firewall rules.
