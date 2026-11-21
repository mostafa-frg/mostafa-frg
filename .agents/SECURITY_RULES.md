# Security Rules — Mandatory

## Absolute prohibitions unless the human owner explicitly authorizes the exact action
- No Production deployment, release, merge, or tag.
- No Production database/schema/data mutation.
- No reading, printing, copying, or committing secret values.
- No changing account roles, tokens, OAuth grants, Cloudflare settings, DNS, firewall, or deployment targets.
- No disabling security controls, tests, branch protections, scanners, or required checks to make CI green.
- No force-push or destructive history rewrite.
- No real-world scanning or network activity outside an explicitly authorized scope.

## Secret handling
- Use secret names/references only; never request or expose secret values.
- Never place tokens, credentials, private keys, cookies, session IDs, personal data, or production identifiers in logs, fixtures, screenshots, commits, or handoffs.
- If a secret appears in output, stop, redact it, report the exposure location, and request owner-led rotation through the approved channel.
- Use least privilege and short-lived credentials where available.

## Code review requirements
- Validate all untrusted input at trust boundaries.
- Enforce authorization server-side on every protected operation; UI hiding is not authorization.
- Verify tenant/user scoping in every database read/write.
- Default-deny access; avoid implicit privilege grants.
- Protect against injection, path traversal, SSRF, XSS, CSRF, request smuggling, insecure deserialization, and unsafe redirects where relevant.
- Apply rate limits/abuse controls to sensitive or expensive endpoints.
- Keep CORS, CSP, cookie flags, TLS, and security headers restrictive and evidence-based.
- Avoid logging secrets, raw credentials, unnecessary personal data, raw packet payloads, or sensitive command contents.
- Review migrations for least privilege, rollback strategy, data exposure, and compatibility.
- Pin/review dependencies and inspect lockfile changes, provenance, known vulnerabilities, and install scripts.
- Tests must include negative authorization cases, cross-user/tenant isolation, malformed input, and failure paths.

## Finding severity
- **Critical:** practical unauthenticated/privilege-escalation compromise, broad data exposure, secret compromise, or production-impacting exploit.
- **High:** serious authorization/data isolation/security-control bypass with meaningful impact.
- **Medium:** exploitable weakness with constrained impact or significant defense-in-depth gap.
- **Low:** limited impact or hardening issue.
- **Informational:** observation without demonstrated security impact.

## Release gate
No known Critical/High findings may remain open. Medium findings require documented risk acceptance by the human owner or remediation. Any untested release-critical control is BLOCKED, not PASS. A scanner's clean output is not proof of absence of vulnerabilities.
