# MOSTA Platform

Cloudflare Worker API + D1 database. The Worker serves the existing portfolio assets and same-origin /api endpoints.

## Security model
- Roles are server-side: admin and user. Public registration is disabled.
- The initial administrator is created once via POST /api/auth/bootstrap and a Worker secret named ADMIN_BOOTSTRAP_TOKEN. Bootstrap closes after the first admin exists.
- Only admin can create ordinary users, enable/disable accounts, view audit events and grant/revoke user tool access.
- Passwords use PBKDF2-HMAC-SHA-256 with random salts. Sessions use random opaque tokens stored as SHA-256 hashes in D1 and Secure/HttpOnly/SameSite=Strict cookies.
- Mutating auth routes require exact same-origin Origin.
- IPv4 subnet calculation is server-executed. SHA-256 stays browser-local; selected file contents are never uploaded.
- Planned tools are intentionally not executable. Arbitrary URL fetch, port scanning, shell execution and PCAP processing are not exposed as public endpoints.

## First deployment
1. Create D1: npx wrangler d1 create mosta-platform
2. Replace database_id in wrangler.jsonc with the returned ID.
3. Add GitHub Actions secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
4. Set the Worker secret: npx wrangler secret put ADMIN_BOOTSTRAP_TOKEN
5. Deploy from this folder: npm install && npm run deploy
6. Open the Worker URL. Create the first admin using the one-time bootstrap token, then sign in.
7. Remove/rotate the bootstrap secret after setup.

Never commit tokens or passwords. GitHub is the source repository/CI system, not the API runtime. Live deployment requires Cloudflare account resources and secrets.
