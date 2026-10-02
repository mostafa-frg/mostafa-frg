# HTTP Security Auditor

A command-line assessment tool for checking security-related HTTP response headers on systems you are authorized to assess.

## Checks

- HTTPS usage
- HSTS
- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Frame protection
- Cookie security flags when exposed in response headers

## Example

```bash
python3 auditor.py https://example.com --json report.json
```

The tool performs normal HTTP requests only. It does not exploit, brute-force, fuzz, or bypass controls.
