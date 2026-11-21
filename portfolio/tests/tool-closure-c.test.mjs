// Batch 1 (security/SOC analysis tools). Ground truth comes from openssl, an independent Python derivation and the
// published CRC/Luhn check values, not from the tool's own output.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { TextDecoder } from 'node:util';

const source = await readFile(new URL('../assets/platform.js', import.meta.url), 'utf8');
const a = source.indexOf('let tools=') + 'let tools='.length;
const b = source.indexOf('\n];\nfunction rows', a);
const hs = source.indexOf('function rows('), he = source.indexOf('const grid=', hs);
const makeCtx = (now) => ({ crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, atob, btoa, URL,
  Date: now ? class extends Date { constructor(...x) { super(...(x.length ? x : [now])); } static now() { return now; } } : Date,
  Math, JSON, BigInt, Number, String, Array, Object, RegExp, Error, Set, Map, Intl, encodeURIComponent, decodeURIComponent,
  parseInt, parseFloat, isNaN, performance, Promise, AbortController, setTimeout, clearTimeout });
const load = (now) => vm.runInNewContext(`(()=>{${source.slice(hs, he)}\nconst r=${source.slice(a, b + 2)};r.forEach(withValidatedInputs);return r;})()`, makeCtx(now));
const tools = load();
const mk = (list) => (id, v = {}) => { const t = list.find(x => x.id === id); assert.ok(t, 'unknown tool ' + id);
  const values = {}; for (const f of t.fields) values[f[0]] = f[2]; return t.run({ ...values, ...v }); };
const run = mk(tools);
const PEM = {"c": "-----BEGIN CERTIFICATE-----\nMIIDezCCAmOgAwIBAgIUe1BA5a6IxN9O/D1ESDItlXsXLrIwDQYJKoZIhvcNAQEL\nBQAwNjETMBEGA1UEAwwKbW9zdGEudGVzdDESMBAGA1UECgwJTU9TVEEgTGFiMQsw\nCQYDVQQGEwJFRzAeFw0yNjExMjEwOTM3MDhaFw0yNzExMjEwOTM3MDhaMDYxEzAR\nBgNVBAMMCm1vc3RhLnRlc3QxEjAQBgNVBAoMCU1PU1RBIExhYjELMAkGA1UEBhMC\nRUcwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDnwctuyHoHT9rMqmcw\naAXcxwu1kIYUlNggwd4mPajSyerREJnG2oT/k4UEErj+w8Awg2vUogNkBnxDS478\nG92kyVz3VBS5CC5ua7NCVfEEPHBbk1KSYcOKpw03RCAJtsf9cdkl+7U8pMrT4gpY\nUezNU2mab5ruO6j/oRv1hfz2X04N6+b5NI2S5It0h+XnF5N3/nWSJb3T4Y+k5N/y\nG7MVBjkKbzso5/0AbnYQzqglUENi2+yjAJCRVZJkVvojtcME17cbe1p/tCWRwoDz\nsX2noHB/ia0suDMYcWUOoAyFP+o/1ZbVOEe7xFGjeMJtbUW7kMp7yD3th1mg6O72\nUaMlAgMBAAGjgYAwfjAdBgNVHQ4EFgQUdsrojLIo+c4+hFF/yuufFs+ICbQwHwYD\nVR0jBBgwFoAUdsrojLIo+c4+hFF/yuufFs+ICbQwDwYDVR0TAQH/BAUwAwEB/zAr\nBgNVHREEJDAiggptb3N0YS50ZXN0gg53d3cubW9zdGEudGVzdIcEwAACBzANBgkq\nhkiG9w0BAQsFAAOCAQEAoZoLk1V1KrE0MmXn6OBB2Mwzr8tEl9xrpuQY1PPgyC7p\n7w3Spd/xooZCzBRouNFUGC3lPIKbxopeVAKsFBDgNw4pLI1qSjcRh/utVRbMBMHZ\nlllNTllwsHB7jg5oQ1cUn2KnxCnnOQqhesAeUIBYZARnDdE5GT7wpsuEnZS0Ycrk\n+WRvxpwdlx5LoFTZFezzveS/cn4s6dTxaH4E4HmCwbyzq/GzIUgJ+usy0JkUki9s\nTd3w6A7eDHw5h/5EAwcPUcRD6qbA/fk79alKKdCxJennOFLYu1rcHGNoIQBdMEcy\n8R5Yhl0mVSlYuVw0sohhCyjNrGds1j64fCLKZABcXA==\n-----END CERTIFICATE-----", "ec": "-----BEGIN CERTIFICATE-----\nMIIBejCCAR+gAwIBAgIUQ3sYi/FaMCFP4osxUhBvjT6oVBAwCgYIKoZIzj0EAwIw\nEjEQMA4GA1UEAwwHZWMudGVzdDAeFw0yNjExMjEwOTQwMDZaFw0yNjEyMTEwOTQw\nMDZaMBIxEDAOBgNVBAMMB2VjLnRlc3QwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNC\nAASo09Ws1kxpaU+Gam6sZFLC4S46eTMzlT8J9kRSotfOmp4PXG/On6Tlq0m4oH4N\nssy0MWZ3bXd/HT9Fj/OxgDLIo1MwUTAdBgNVHQ4EFgQU5Nc6ebpPZ3W94xp/0BOB\nZ05PXqgwHwYDVR0jBBgwFoAU5Nc6ebpPZ3W94xp/0BOBZ05PXqgwDwYDVR0TAQH/\nBAUwAwEB/zAKBggqhkjOPQQDAgNJADBGAiEAhSo4OajJV09m8ryV7CEmwiI949/z\nukOMkO6dbOjNeNsCIQDLByiv7s09eI3E6OSlGv4xSp1drznNlkuG+nTvmEq4cA==\n-----END CERTIFICATE-----", "w": "-----BEGIN CERTIFICATE-----\nMIIBqjCCARMCFCAD/IuvETXxNZCI6Qlg5h1FtB4cMA0GCSqGSIb3DQEBBQUAMBQx\nEjAQBgNVBAMMCXdlYWsudGVzdDAeFw0yNjExMjEwOTQwMDZaFw0yNzExMjEwOTQw\nMDZaMBQxEjAQBgNVBAMMCXdlYWsudGVzdDCBnzANBgkqhkiG9w0BAQEFAAOBjQAw\ngYkCgYEAxwQONNuwEn76cxb8c5A8eyeRfKcoTe+Pb0IGgUcoo+eFf+DritV0RFkb\nxpPsY6pqWCabAqMAf2+zG8hioqUKfmaLoAkLEw7KXwV3dyK+k3kcr4LfctgiJGa2\n5BdUjLOICmkeUvbPxz8IOb2Mu2arzYDK3dJOTgphnHjrUlXyO/UCAwEAATANBgkq\nhkiG9w0BAQUFAAOBgQCLJMNDmAWuJl7JDxx8GCHpqompKcuyW+FF04RcJjdJAo2/\nHg99rwlHKqSw8PH089AE5WqEYI2HfGcCQinGJlkyKUk/UA/wJ6X+IVIHQGm/eR9s\nvbYEKqgYdm4jeSu77zwRmP9DNh0JhuNrz71T+nnMaaj/xc+6y19BkiSl1GH5fg==\n-----END CERTIFICATE-----"};
const FP = {"c": "C3:1D:D4:B0:0C:D7:7B:5C:4F:2C:46:A4:F1:89:B3:CA:14:AF:F5:29:25:9E:A2:99:71:70:AD:31:F6:5E:12:85", "ec": "99:93:B8:11:D3:83:F2:BF:04:B0:DF:0F:FC:78:3D:90:5E:15:1D:B6:10:4D:CB:0D:EF:49:AA:52:58:2C:B2:D4", "w": "45:0F:EC:85:DB:2D:3A:F3:1E:6C:6D:4E:A6:65:63:75:C0:4D:60:EC:46:03:41:9C:FD:71:52:72:D3:BF:81:61"}, SERIAL = {"c": "7B5040E5AE88C4DF4EFC3D4448322D957B172EB2", "ec": "437B188BF15A30214FE28B3152106F8D3EA85410", "w": "2003FC8BAF1135F1359088E90960E61D45B41E1C"}, NB = {"c": "2026-11-21T09:37:08Z", "ec": "2026-11-21T09:40:06Z", "w": "2026-11-21T09:40:06Z"}, NA = {"c": "2027-11-21T09:37:08Z", "ec": "2026-12-11T09:40:06Z", "w": "2027-11-21T09:40:06Z"};

test('x509-inspector matches openssl for RSA, EC and weak certificates', async () => {
  const out = await run('x509-inspector', { pem: PEM.c });
  assert.match(out, /Subject: CN=mosta\.test, O=MOSTA Lab, C=EG/); assert.match(out, /Issuer: CN=mosta\.test, O=MOSTA Lab, C=EG/);
  assert.ok(out.includes('Serial: ' + SERIAL.c)); assert.ok(out.includes('Not before: ' + NB.c)); assert.ok(out.includes('Not after: ' + NA.c));
  assert.match(out, /Signature: sha256WithRSAEncryption/); assert.match(out, /Public key: RSA 2048 bit/);
  assert.match(out, /SANs: DNS:mosta\.test, DNS:www\.mosta\.test, IP:192\.0\.2\.7/); assert.match(out, /CA flag: yes/);
  assert.ok(out.includes('SHA-256 fingerprint: ' + FP.c)); assert.match(out, /INFO Self-signed/);
  const ec = await run('x509-inspector', { pem: PEM.ec });
  assert.match(ec, /Public key: EC P-256/); assert.match(ec, /Signature: ecdsa-with-SHA256/); assert.ok(ec.includes(FP.ec)); assert.match(ec, /No Subject Alternative Name/);
  const weak = await run('x509-inspector', { pem: PEM.w });
  assert.match(weak, /Public key: RSA 1024 bit/); assert.match(weak, /HIGH Weak signature algorithm: sha1WithRSAEncryption/); assert.match(weak, /HIGH RSA key is only 1024 bits/);
  assert.ok(weak.includes(FP.w));
});

test('x509-inspector reports expiry relative to the clock and rejects bad input', async () => {
  const late = load(Date.UTC(2030, 0, 1)); const expired = await mk(late)('x509-inspector', { pem: PEM.c });
  assert.match(expired, /HIGH Certificate expired on 2027-11-21T09:37:08Z/);
  const soon = load(Date.UTC(2026, 11, 1)); assert.match(await mk(soon)('x509-inspector', { pem: PEM.ec }), /MEDIUM Certificate expires in 10 day\(s\)/);
  const early = load(Date.UTC(2026, 0, 1)); assert.match(await mk(early)('x509-inspector', { pem: PEM.c }), /not valid yet/);
  await assert.rejects(async () => run('x509-inspector', { pem: 'hello' }), /BEGIN CERTIFICATE/);
  await assert.rejects(async () => run('x509-inspector', { pem: '-----BEGIN CERTIFICATE-----\n@@@@\n-----END CERTIFICATE-----' }), /PEM block|Base64|DER/);
  await assert.rejects(async () => run('x509-inspector', { pem: PEM.c.slice(0, 200) + '\n-----END CERTIFICATE-----' }), /Truncated|Base64|DER/);
});

test('ssh-fingerprint reproduces independently derived SHA256/MD5 fingerprints', async () => {
  const ed = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHET1bgUhxxmrj3tAxcpPKgtL6edHyAC59wGRd46UZta test@mosta';
  const o = await run('ssh-fingerprint', { keys: ed });
  assert.match(o, /ssh-ed25519 256 bit \(test@mosta\)/); assert.match(o, /SHA256:Cuc0rbYGLLDvJ4gKJBhPheM\+A4EhTGNyVon78tYZiYA/);
  assert.match(o, /MD5:b2:b2:70:82:50:79:fb:72:cf:2a:5f:cb:17:2f:f1:6b/);
  const rsa = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDXU8l/uQCub5FCONRHZrooz/mcLqeAUASrLHnGc+dFxEU8EihZqS1ZPOSE7DKOHhLFyn6UsYtHp2TTHQsGIQrNvpmvZK/sIY9s0HA/joDpxr/9cxfiCtvP9/pGxKQKJwwV/zHTDB9AyzjgD8n6gJnnZT99GWZPMvjnKH44ZClicuX70tAXy3FlbL0XPoMhyUWc56be08WQCCnfR252/osEVy2tGc4DFSI8waoLp/BgpTt4+2JO96X5XLdZKnJaXv+rMO9n9EIOvwTaSXeswRiIJb2+2/ONXWQ7xkfAABx/8hYOpp0hH5e7u8FjszjwuOvMf5fGdOqDZe3G9JLQJq0f rsa@mosta';
  const r = await run('ssh-fingerprint', { keys: '# comment\n' + rsa + '\nnot a key\nssh-ed25519 !!!!' });
  assert.match(r, /Line 1: ssh-rsa 2048 bit/); assert.match(r, /SHA256:GZBjE6LaYUs6b1XiKkETLEAauxO5DhKW6W3YeJEj85s/);
  assert.match(r, /Line 2: not an OpenSSH public key line/); assert.match(r, /Line 3: invalid Base64/);
  await assert.rejects(async () => run('ssh-fingerprint', { keys: '\n# only comments' }), /at least one/);
});

test('checksum-calc matches the published check values and zlib semantics', async () => {
  const o = await run('checksum-calc', { input: '123456789', mode: 'Text (UTF-8)' });
  for (const [k, v] of [['CRC-32 \\(ISO-HDLC, zip/png\\)', '0xCBF43926'], ['CRC-32C \\(Castagnoli\\)', '0xE3069283'], ['CRC-16/ARC', '0xBB3D'],
    ['CRC-16/CCITT-FALSE', '0x29B1'], ['CRC-8 \\(poly 0x07\\)', '0xF4'], ['Adler-32', '0x091E01DE']])
    assert.match(o, new RegExp(k + ': ' + v), k);
  assert.match(await run('checksum-calc', { input: '31 32 33 34 35 36 37 38 39', mode: 'Hex bytes' }), /CRC-32 \(ISO-HDLC, zip\/png\): 0xCBF43926/);
  assert.match(await run('checksum-calc', { input: '', mode: 'Text (UTF-8)' }), /Adler-32: 0x00000001/);
  await assert.rejects(async () => run('checksum-calc', { input: 'abc', mode: 'Hex bytes' }), /even number/);
});

test('luhn-check validates, computes check digits and masks digits', async () => {
  const ok = await run('luhn-check', { number: '4111 1111 1111 1111' });
  assert.match(ok, /Luhn valid: Yes/); assert.match(ok, /Network \(by prefix only\): Visa/); assert.doesNotMatch(ok, /4111111111111111/);
  assert.match(await run('luhn-check', { number: '4111111111111112' }), /Luhn valid: No/);
  assert.match(await run('luhn-check', { number: '79927398713' }), /Luhn valid: Yes/);
  assert.match(await run('luhn-check', { number: '378282246310005' }), /American Express/);
  assert.match(await run('luhn-check', { number: '5555555555554444' }), /Mastercard/);
  assert.match(await run('luhn-check', { number: '7992739871', mode: 'Compute check digit for payload' }), /Check digit: 3/);
  await assert.rejects(async () => run('luhn-check', { number: '12ab' }), /digits/);
});

test('nmap-grepable-parser parses ports, versions and flags risky services', () => {
  const o = run('nmap-grepable-parser');
  return Promise.resolve(o).then(x => {
    assert.match(x, /Hosts listed: 3/); assert.match(x, /Hosts with Status: Up: 1/); assert.match(x, /Open ports: 6/);
    assert.match(x, /192\.0\.2\.10 \(web01\.lab\): 22\/tcp ssh \[OpenSSH 8\.9p1\], 80\/tcp http \[nginx 1\.24\], 443\/tcp https, 3306\/tcp mysql/);
    assert.match(x, /REVIEW 192\.0\.2\.10:3306 MySQL/); assert.match(x, /REVIEW 192\.0\.2\.11:23 Telnet/); assert.match(x, /REVIEW 192\.0\.2\.11:445 SMB/);
    assert.doesNotMatch(x, /8080/);
    return assert.rejects(async () => run('nmap-grepable-parser', { text: 'hello' }), /Host:/);
  });
});

test('suricata-eve-summary counts alerts and tolerates bad lines', async () => {
  const o = await run('suricata-eve-summary');
  assert.match(o, /Alert events: 3/); assert.match(o, /Other events skipped: 1/); assert.match(o, /Invalid lines: 1/); assert.match(o, /Blocked \/ dropped: 1/);
  assert.match(o, /2  ET SCAN Suspicious inbound to MSSQL port 1433 \[sid 2024897\]/); assert.match(o, /1  198\.51\.100\.7 -> 192\.0\.2\.10/);
  assert.match(o, /2  2 \(medium\)/); assert.match(o, /1  3 \(low\)/);
  await assert.rejects(async () => run('suricata-eve-summary', { text: '{"event_type":"dns"}' }), /No alert/);
});

test('zeek-conn-summary computes talkers, states, long connections and scan-like sources', async () => {
  const o = await run('zeek-conn-summary');
  assert.match(o, /Connections: 7/); assert.match(o, /Distinct source hosts: 3/);
  assert.match(o, /1700000  10\.0\.0\.9 -> 10\.0\.0\.5/); assert.match(o, /10\.0\.0\.9 -> 10\.0\.0\.5:22 for 4000s/);
  assert.match(o, /3  S0/); assert.match(o, /REVIEW 203\.0\.113\.50 failed\/unanswered to 4 distinct destination ports \(4 attempts\)/);
  await assert.rejects(async () => run('zeek-conn-summary', { text: 'a\tb' }), /#fields/);
});

test('sudoers-audit flags real privilege-escalation patterns and not safe rules', async () => {
  const o = await run('sudoers-audit');
  assert.match(o, /HIGH line 1: env_keep preserves a loader variable/); assert.match(o, /HIGH line 4: deploy has NOPASSWD: ALL/);
  assert.match(o, /HIGH line 5: backup NOPASSWD on \/usr\/bin\/vim allows a root shell escape/); assert.match(o, /HIGH line 5: backup NOPASSWD on \/usr\/bin\/rsync allows a root shell escape/);
  assert.match(o, /MEDIUM line 5: backup wildcard in command/); assert.match(o, /HIGH line 7: guest runs commands without authentication/);
  assert.doesNotMatch(o, /line 6/); assert.doesNotMatch(o, /line 2/); assert.doesNotMatch(o, /line 3/);
  await assert.rejects(async () => run('sudoers-audit', { text: '# nothing\n' }), /No sudoers rules/);
});

test('passwd-shadow-audit finds backdoor UID 0, empty passwords and weak hashes', async () => {
  const o = await run('passwd-shadow-audit');
  assert.match(o, /HIGH toor has UID 0/); assert.match(o, /HIGH bob has an empty password field in passwd/);
  assert.match(o, /MEDIUM system account www-data \(UID 33\) has a login shell: \/bin\/bash/); assert.match(o, /MEDIUM UID 1000 is shared by alice, carol/);
  assert.match(o, /HIGH alice uses MD5-crypt/); assert.match(o, /HIGH bob has an empty password in shadow/);
  assert.doesNotMatch(o, /carol uses/); assert.doesNotMatch(o, /daemon/); assert.doesNotMatch(o, /root has/);
  const clean = await run('passwd-shadow-audit', { passwd: 'root:x:0:0:root:/root:/bin/bash\nalice:x:1000:1000::/home/alice:/bin/bash', shadow: 'root:$y$j9T$abc$def:19000:0:99999:7:::' });
  assert.match(clean, /No findings/);
});

test('yara-rule-lint finds undefined/unused strings and passes a clean rule', async () => {
  const o = await run('yara-rule-lint');
  assert.match(o, /HIGH rule Demo_Lab_Marker: condition references undefined string \$c/); assert.match(o, /string \$b is only 2 character/);
  assert.match(o, /string \$unused is defined but not used in the condition/); assert.match(o, /string \$b is defined but not used in the condition/);
  const clean = 'rule Clean_Rule\n{\n meta:\n  author = "x"\n  description = "y"\n strings:\n  $a = "MOSTA-LAB-MARKER"\n  $b = { 4D 5A 90 00 }\n condition:\n  $a and $b\n}';
  assert.match(await run('yara-rule-lint', { text: clean }), /No findings/);
  assert.match(await run('yara-rule-lint', { text: 'rule A { strings: $a = "abcdef" condition: $a }\nrule A { condition: true }' }), /HIGH rule A is defined more than once/);
  assert.match(await run('yara-rule-lint', { text: 'rule NoCond { meta: author="x" description="y" }' }), /has no condition/);
  assert.match(await run('yara-rule-lint', { text: 'rule T { strings: $a = "abcdef" $b = "ghijkl" condition: any of them }' }), /Findings: 2/);
  await assert.rejects(async () => run('yara-rule-lint', { text: 'hello' }), /No YARA rules/);
});
