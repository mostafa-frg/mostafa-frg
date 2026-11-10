# MOSTA Platform

Cloudflare Worker API + D1 database. The Worker serves the portfolio from the same origin as the `/api` endpoints.

## Security model

- Roles are enforced server-side: `admin` and `user`. Public self-registration is disabled.
- The first administrator is created once through `POST /api/auth/bootstrap` using the Worker secret `ADMIN_BOOTSTRAP_TOKEN`. Bootstrap is permanently closed after an administrator exists.
- Only administrators can create ordinary users, enable/disable accounts, review audit events, and grant/revoke tool access.
- Passwords use PBKDF2-HMAC-SHA-256 with random salts. Sessions use random opaque tokens stored as SHA-256 hashes in D1 and Secure/HttpOnly/SameSite=Strict cookies.
- Mutating authentication routes require an exact same-origin Origin header.
- IPv4 subnet calculation is server-executed. File SHA-256 remains browser-local; selected file contents are never uploaded.
- Planned tools are not executable. Arbitrary URL fetch, port scanning, shell execution, and public PCAP processing are not exposed.

## Automated deployment from GitHub Actions

The workflow `.github/workflows/deploy-backend.yml` validates the code, creates the D1 database `mosta-platform` if it does not exist, applies migrations, and deploys the Worker together with the `portfolio/` static assets. No Cloudflare Git integration or Pages project connection is required.

In GitHub, open **Settings → Secrets and variables → Actions → Secrets** and add:

1. `CLOUDFLARE_API_TOKEN` — an account API token with **Workers Scripts: Edit** and **D1: Edit** permissions.
2. `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID (not an API token).
3. `ADMIN_BOOTSTRAP_TOKEN` — optional for deployment, but required to initialize the first administrator through the site. Use a long, random value. The workflow installs it as a Worker secret when supplied.

After adding the first two secrets, open **Actions → Deploy MOSTA platform** and rerun the latest failed run, or push a new commit to `main`. The deployment job will stop with an explicit error if either required Cloudflare secret is missing.

After a successful deployment:

1. Open the Worker URL shown in the deployment log. The Worker name is `mosta-platform` and `workers.dev` is enabled in its configuration.
2. Open `/auth.html`, create the first administrator using the bootstrap token, and sign in.
3. Once the administrator is created, bootstrap cannot be used again. Remove `ADMIN_BOOTSTRAP_TOKEN` from GitHub Actions secrets; the Worker-side secret may also be deleted from Worker Settings → Variables and Secrets.

## Local development

From this directory:

```sh
npm install
npx wrangler dev
```

The committed `wrangler.jsonc` intentionally contains a placeholder D1 ID. The GitHub Actions workflow generates a deployment-only Wrangler config with the real D1 ID, so no account IDs, database IDs, or credentials need to be committed.

Never commit API tokens, bootstrap tokens, or passwords. GitHub is the source repository and CI system; Cloudflare is the runtime.
