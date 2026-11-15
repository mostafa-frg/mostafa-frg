# MOSTA Termux Web Bridge — Security Design

**Status: design only. No remote command execution is implemented or enabled.**

This document defines the security boundary required before MOSTA may communicate with a Termux installation. The current website only generates commands for the user to review and copy. A browser page must never be treated as a shell, and the Cloudflare Worker must never become a generic command relay.

## Security invariants

1. **Local-first execution:** commands execute only on the Android device, through an explicitly installed local companion. The Cloudflare Worker never receives shell commands and never runs them.
2. **No arbitrary shell API:** no endpoint accepts a command string, shell fragment, executable path, environment map, or arbitrary argument array.
3. **Allowlisted operations:** the companion exposes versioned operation IDs such as device.info, termux.packages.list, and mosta.doctor. Each operation maps to fixed executable paths and validated typed arguments.
4. **Human approval:** every state-changing operation displays its exact effect and requires fresh approval. Destructive, privileged, network-scanning, packet-capture, and credential-related operations require additional confirmation and explicit scope.
5. **Explicit short-lived pairing:** use a one-time high-entropy code displayed on the device, expiring within 60 seconds and consumed once. Never pair using a static password, a QR URL containing a long-lived token, or a Cloudflare account secret.
6. **Origin binding:** accept browser requests only from exact approved HTTPS origins. Reject missing, null, wildcard, suffix-match, and unrecognized Origin values. CORS is not authentication; require cryptographic request proof as well.
7. **Replay resistance:** every request includes timestamp, unique nonce, request ID, and HMAC over method, canonical path, body hash, timestamp, and nonce. Enforce a narrow clock window and atomically reject reused nonces.
8. **Loopback only:** bind to 127.0.0.1 and optionally ::1 only. Never bind to 0.0.0.0, a LAN interface, or a public tunnel. Reject Host headers that do not match the loopback listener.
9. **Least privilege:** run as the normal Termux app user. Never request root, Android Accessibility, VPN, or device-admin privileges for the bridge. Do not inherit a broad environment or PATH from the browser.
10. **No browser-held secrets:** do not store raw HMAC keys in localStorage, IndexedDB, URLs, analytics, or logs. Prefer an ephemeral session and re-pair after expiry.
11. **Auditable output:** record operation ID, device ID, timestamp, approval result, exit status, and bounded/redacted output. Never log passwords, tokens, private keys, full environment values, or sensitive file contents.
12. **Fail closed:** unknown operation, invalid schema, origin mismatch, expired pairing, replay, oversized body, unsupported platform, or companion version mismatch means reject without running anything.

## Protocol outline

- Device starts the companion manually and displays a one-time pairing code in its local terminal.
- User enters the code into the MOSTA page. The page contacts only the loopback companion.
- Companion validates the exact origin and code, consumes the code once, and returns a short-lived session capability. The long-term device key remains on the device.
- Each request is bound to method, path, body digest, timestamp, nonce, and session ID using HMAC-SHA-256.
- The companion validates the operation schema and authorization, presents a confirmation for state-changing operations, then runs a fixed executable with an argument array. Never use sh -c, bash -c, eval, or command-string concatenation.
- Output is capped by bytes and time, encoded as text/JSON, and redacted before display.
- Disconnect, timeout, logout, browser close, device lock, or repeated authentication failure revokes the session.

## Operation classes

| Class | Examples | Default |
|---|---|---|
| Read-only | OS info, Termux version, package list, MOSTA doctor | Allowed after pairing |
| Reversible changes | Install an allowlisted package, create a workspace folder | Per-operation approval |
| Sensitive changes | Edit startup scripts, enable SSH, change service state | Explicit approval + impact summary |
| High risk | Root commands, arbitrary shell, credential extraction, packet injection, destructive file operations | Not exposed through the bridge |

## Required implementation gates

- Threat model and operation registry reviewed.
- Strict JSON schemas and byte/time limits.
- Pairing, expiry, revocation, HMAC, nonce replay, and origin tests.
- Loopback binding and Host-header tests on supported Android versions.
- Android Chrome tests for mixed-content, CORS, and Private Network Access behavior.
- Negative tests proving there is no generic shell/exec endpoint.
- Independent security review before enabling the bridge in any public Preview.

## Current behavior

The Termux page command builder is a copy-only helper. It does not call a Worker endpoint, open a socket, execute commands, or install packages. This is intentional until every implementation gate above passes.