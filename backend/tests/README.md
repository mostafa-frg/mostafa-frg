# API security tests

Black-box tests that run against a **local** Worker with a **fresh local D1** (never production):

```bash
cd backend
cp wrangler.jsonc wrangler.local.json   # set any 36-char placeholder database_id
printf 'ADMIN_BOOTSTRAP_TOKEN=test-bootstrap-token-0123456789abcdef\n' > .dev.vars
printf "ADMIN_BOOTSTRAP_TOKEN=test-bootstrap-token-0123456789abcdef\nIP_HASH_SECRET=local-test-secret\n" > .dev.vars
npx wrangler d1 migrations apply DB --local --persist-to .state --config wrangler.local.json
npx wrangler dev --local --port 8787 --persist-to .state --config wrangler.local.json &
npm run test:security
```

The suite creates the first admin, so it needs an empty database. It covers JSON handling, bootstrap and
login throttling, bootstrap race, CSRF/Origin checks, authorization, session revocation, dashboard gating and
security headers. It does not replace an independent penetration test.
