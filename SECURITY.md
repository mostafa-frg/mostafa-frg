# Security Policy

## Scope

This repository contains a static portfolio and practical IT, networking and defensive-security labs. The website does not provide user accounts, server-side processing, file uploads or a private-data store.

## Safe use

- Run the labs only on systems and networks you own or are explicitly authorized to assess.
- Review each lab's README and installation instructions before execution.
- Do not place credentials, API keys, tokens, personal data or production secrets in sample files or public commits.
- Treat all sample logs, configurations and addresses as test data.

## Reporting a concern

Please do not publish credentials, private information, or an unpatched exploit in a public issue. If GitHub private vulnerability reporting is enabled for this repository, use the repository's Security reporting flow. Otherwise, contact the maintainer through the professional contact links on the portfolio and share only the minimum details needed to reproduce the concern safely.

## Hosting limitations

The portfolio is hosted as a static GitHub Pages site. Browser-side Content Security Policy is provided through a meta policy, but it cannot replace server-delivered security headers such as HSTS, X-Frame-Options or CSP frame-ancestors. The site must not be used as an authenticated application or security boundary.
