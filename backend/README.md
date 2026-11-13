# MOSTA Platform

Cloudflare Worker API + D1 database. The Worker serves the portfolio and the `/api` endpoints from the same origin so authentication cookies remain first-party.

## Runtime

- Worker name: `mostafa-frg`
- Current workers.dev URL: https://mostafa-frg.frh7977.workers.dev
- Health endpoint: `https://mostafa-frg.frh7977.workers.dev/api/health`
- Public portfolio: `https://mostafa-frg.frh7977.workers.dev/`
- Authenticated workspace: `https://mostafa-frg.frh7977.workers.dev/dashboard.html`

## Security model

- Roles are enforced server-side: `admin` and `user`. Public self-registration is disabled.
- The first administrator is created once through `POST /api/auth/bootstrap` using the Worker secret `ADMIN_BOOTSTRAP_TOKEN`. Bootstrap is permanently closed after an administrator exists.
- Only administrators can create ordinary users, enable/disable accounts, review audit events, and grant/revoke tool access.
- Passwords use PBKDF2-HMAC-SHA-256 with random salts. Sessions use random opaque tokens stored as SHA-256 hashes in D1 and Secure/HttpOnly/SameSite=Strict cookies.
- Mutating authentication routes require an exact same-origin Origin header.
- The Worker protects `dashboard.html`, serves browser-only `lab.html` publicly, and adds security response headers to static assets.
- IPv4 subnet calculation is server-executed in the workspace. File SHA-256, Config Audit, and HTTP Header Audit run locally in the browser; supplied file/config/header content is not uploaded by the browser-side tools.
- Planned tools are not executable. Arbitrary URL fetch, port scanning, shell execution, and public PCAP processing are not exposed.

## Automated deployment from GitHub Actions

The workflow `.github/workflows/deploy-backend.yml` validates the code, creates the D1 database `mosta-platform` if it does not exist, applies migrations, and deploys the Worker together with the `portfolio/` static assets. No Cloudflare Git integration or Pages project connection is required.

In GitHub, open **Settings → Secrets and variables → Actions → Secrets** and configure:

1. `CLOUDFLARE_API_TOKEN` — an account API token with **Workers Scripts: Edit** and **D1: Edit** permissions.
2. `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID (not an API token).
3. `ADMIN_BOOTSTRAP_TOKEN` — set this only for initial administrator setup. Use a long, random value. The workflow configures it on the Worker when present and skips that step when absent.

After the first administrator has been created successfully, remove `ADMIN_BOOTSTRAP_TOKEN` from GitHub Actions secrets and delete the Worker secret with Wrangler or from **Cloudflare Dashboard → Workers & Pages → mostafa-frg → Settings → Variables and Secrets**. Later deployments will continue without it, and the API bootstrap route will remain closed because an administrator already exists.

The optional `CLOUDFLARE_WORKERS_SUBDOMAIN` secret can override the default `frh7977` subdomain used by the workflow health check if your workers.dev subdomain differs.

## First deployment and administrator setup

1. Push to `main` or run **Actions → Deploy MOSTA platform**.
2. Wait for the deployment workflow to finish successfully.
3. Open https://mostafa-frg.frh7977.workers.dev/auth.html.
4. Enter the one-time bootstrap token, create the administrator username and password, and then sign in.
5. Use https://mostafa-frg.frh7977.workers.dev/dashboard.html for the authenticated workspace. The public lab page remains at https://mostafa-frg.frh7977.workers.dev/lab.html.

The GitHub Pages mirror is static-only. Its Platform Access link and direct `auth.html`/`dashboard.html` visits forward to the Worker so API calls and session cookies stay on the correct origin.

## Local development

From this directory:

```sh
npm install
npx wrangler dev
```

The committed `wrangler.jsonc` intentionally contains a placeholder D1 ID. The GitHub Actions workflow generates a deployment-only Wrangler config with the real D1 ID, so no account IDs, database IDs, or credentials need to be committed.

Never commit API tokens, bootstrap tokens, or passwords. GitHub is the source repository and CI system; Cloudflare is the runtime.

## Account recovery (administrator)

There is no email reset by design. If the administrator password is lost:

1. Change it while signed in: Dashboard → Account security → Change password.
2. If you cannot sign in, delete the admin row so the one-time setup opens again, then run setup with the
   `ADMIN_BOOTSTRAP_TOKEN` secret (re-add it in GitHub Actions secrets and redeploy if you removed it):

   ```bash
   cd backend
   npx wrangler d1 execute mosta-platform --remote --command "DELETE FROM users WHERE role='admin'"
   ```

   This also removes the admin's sessions (cascade). Users created earlier keep their accounts.
