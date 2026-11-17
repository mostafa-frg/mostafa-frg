# Independent Developer Platform

A product-oriented engineering platform for developers, infrastructure engineers, and security practitioners. The current repository is an active development baseline; the temporary product name and visual identity are not final.

## Product scope

- Searchable engineering tool library across networking, cybersecurity, SOC operations, Linux, and developer workflows.
- Public terminal catalog with 24 upstream-linked packages for Termux and Debian/Ubuntu, including install, verify, uninstall and troubleshooting instructions.
- Planned ESP32 firmware and flashing workspace; roadmap items remain clearly marked as not yet installable.
- Browser-local utilities that keep supplied content in the browser whenever feasible.
- Clearly identified external lookups with provider disclosure and bounded requests.
- Authenticated workspace with server-side sessions, role-based access, user administration, and audit events.
- Security-first engineering practices, automated tests, and staged releases.

## Runtime architecture

- **GitHub** is the source of truth for code, issues, pull requests, reviews, CI, and release history.
- **Cloudflare Workers** hosts the same-origin application API and serves the web assets.
- **Cloudflare D1** stores account, session, throttling, and audit data.
- **GitHub Pages** is a static public mirror only. It is not the authenticated application runtime and does not host the API or database.

The Worker is the authoritative runtime for authentication, session cookies, API requests, and protected workspace routes. Production and Preview environments must remain isolated.

## Security baseline

- No public self-registration.
- One-time, secret-gated initial administrator bootstrap.
- Password hashing with PBKDF2-HMAC-SHA-256 and per-user salt.
- Opaque random session tokens; only token hashes are stored server-side.
- Secure, HttpOnly, SameSite=Strict session cookies.
- Server-side role and account-state checks on protected operations.
- Same-origin checks for state-changing authentication operations.
- Request-body limits, authentication throttling, security headers, and audit events.
- Local-first processing for browser utilities where practical.
- Authorized-use boundaries for diagnostic and security workflows.

These controls reduce risk; they do not establish that the platform is invulnerable. Security claims must be backed by tests and review evidence.

## Development workflow

1. Work on a feature branch.
2. Keep changes small and reviewable.
3. Run syntax checks, unit tests, API security tests, and HTML/link audits.
4. Verify Preview behavior before proposing a release.
5. Keep pull requests unmerged until required checks and human review are complete.
6. Never expose secrets in source, issues, logs, or chat.

## Local development

Open portfolio/index.html for static UI inspection. Browser-only tools can be exercised locally. Authentication and protected workspace behavior require the Worker and an isolated D1 environment configured through Wrangler.

## Release safety

- Do not use GitHub Pages as a substitute for the Worker runtime.
- Do not run production database migrations or modify production secrets as part of routine feature work.
- Use isolated Preview bindings and test credentials.
- A successful deployment job is not a substitute for functional, security, and authorization testing.

## Current status

This repository is under productization. The current UI, tool registry, and backend are being reviewed for product-level architecture, accessibility, maintainability, security, and operational readiness. The current branding is temporary.
