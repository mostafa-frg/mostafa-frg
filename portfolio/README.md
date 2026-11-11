# MOSTA Portfolio

A lightweight, responsive, multi-page technical portfolio for Mostafa Mahmoud.

## Live sites

- **Primary platform:** https://mostafa-frg.frh7977.workers.dev/
- **Public static mirror:** https://mostafa-frg.github.io/mostafa-frg/

The Cloudflare Worker serves the portfolio and the same-origin API backed by D1. The GitHub Pages copy is a static mirror; its Platform Access link and direct authentication/dashboard URLs forward to the Worker. This keeps session cookies and API calls on one origin.

## Preview locally

Open `index.html` in a browser. No build step or package installation is required. Browser-only tools can be tested locally; authentication and the dashboard require the deployed Worker and D1 database.

## Pages

- `index.html` — homepage and professional overview
- `projects.html` — searchable and filterable project directory
- `systems.html` — technical domains and system map
- `security.html` — security controls and hosting boundaries
- `lab.html` — local IPv4 subnet calculator and SHA-256 file hashing
- `about.html` — professional profile
- `contact.html` — professional links
- `auth.html` — Worker-hosted sign-in and first-admin setup
- `dashboard.html` — authenticated workspace and admin controls
- `404.html` — not-found page

## Deployment

- `.github/workflows/deploy-portfolio.yml` publishes `portfolio/` to GitHub Pages as a public static mirror.
- `.github/workflows/deploy-backend.yml` validates the app, applies Cloudflare D1 migrations, configures the optional one-time bootstrap secret, and deploys the Worker with the same portfolio assets.
- The Worker is the only origin that handles `/api/*`, session cookies, and authenticated dashboard access.

## Security and privacy

- Same-origin CSS and JavaScript; no third-party font or analytics dependencies.
- Restrictive CSP meta policy on HTML pages. The Worker also sends frame-denial and other security headers for its static responses.
- External links opened in new tabs use `noopener noreferrer`.
- The browser SHA-256 utility processes selected files locally; file contents are not uploaded.
- Config Audit and HTTP Header Audit run in the browser and do not upload or fetch the supplied input.
- GitHub Pages does not expose general custom response-header configuration; the Cloudflare Worker is the primary runtime for the authenticated platform.

## Local assets

- `assets/home.css` and `assets/home.js` — homepage presentation and behavior
- `assets/site.css` and `assets/site.js` — shared subpage design and interactions
- `assets/audit-ui.js`, `assets/config-audit.js`, and `assets/http-audit.js` — browser-side audit tools

All labs and examples are intended for authorized systems and isolated environments.
