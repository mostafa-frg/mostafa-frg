# Tool closure standard

A tool is **closed** when all of the following hold. CI enforces the first three.

1. It has a dedicated test in `platform-tools.test.mjs` or `tool-closure.test.mjs`
   (`tool closure guard`: adding a tool without one fails the build).
2. The test uses **known-answer values** (published vectors or hand-checked results), not just "it ran".
3. Edge cases and error paths are covered: invalid input, boundaries, injection attempts in generated commands.
4. Tools that call third-party services are tested against a mocked `fetch` (success, provider error, bad input).
5. It was opened and run once in a real browser (desktop and phone width) with no console errors.
6. Limits are stated in the tool text (heuristic, base-score only, authorised use only, etc.).

Known limits of this standard:
- `xml` and `html` (decode) need a browser DOM; they are covered by the real-browser run, not by Node tests.
- Third-party providers (ipify, macvendors, crt.sh, Cloudflare DNS/speed) can change or fail; the tests prove
  our handling of their responses, not their uptime.
- Closed means verified to this standard, not proven free of defects.

Run: `node --test portfolio/tests/*.mjs`
