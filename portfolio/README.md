# MOSTA Portfolio

A lightweight, responsive, single-page portfolio for Mostafa Mahmoud.

## Preview locally

Open `index.html` in a browser. No build step or package installation is required.

## Deploy with GitHub Pages

1. Open the repository **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Merge this portfolio branch into `main`.
4. The workflow at `.github/workflows/deploy-portfolio.yml` publishes the `portfolio/` directory.
5. After the workflow succeeds, the site is available at:

   `https://mostafa-frg.github.io/mostafa-frg/`

## Notes

- The interactive console contains clearly labelled illustrative output; it does not execute commands or access a real system.
- Project descriptions link to the public source directories.
- No certifications, employment history, client claims, or skill percentages are fabricated.
- Motion respects the user's reduced-motion preference.

## MOSTA 3.0

The portfolio is a multi-page static site hosted on GitHub Pages.

### Pages
- `index.html` — homepage
- `projects.html` — searchable and filterable project directory
- `systems.html` — technical domains and system map
- `security.html` — browser security controls and hosting limitations
- `lab.html` — local IPv4 subnet calculator and SHA-256 file hashing
- `about.html` — professional profile
- `contact.html` — professional links
- `404.html` — not-found page

### Security and privacy
- Same-origin CSS and JavaScript assets; no third-party font or analytics dependencies.
- Restrictive Content Security Policy delivered through a meta policy.
- External links opened in new tabs use `noopener noreferrer`.
- The browser SHA-256 utility processes the selected file locally; it does not upload file contents.
- GitHub Pages is static hosting. Meta CSP cannot replace server-delivered headers such as HSTS or X-Frame-Options.

### Local assets
- `assets/home.css` and `assets/home.js` — homepage presentation and behavior
- `assets/site.css` and `assets/site.js` — shared subpage design and interactions

All labs and examples are intended for authorized systems and isolated environments.
