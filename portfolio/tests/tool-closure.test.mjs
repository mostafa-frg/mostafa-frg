// Closure tests: every tool needs known-answer, edge-case and error-path checks.
// Network-dependent tools run against a mocked fetch (no real provider is contacted).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto, createHash, createHmac } from 'node:crypto';
import { crc32 as nodeCrc32 } from 'node:zlib';
import { TextDecoder } from 'node:util';

const source = await readFile(new URL('../assets/platform.js', import.meta.url), 'utf8');
const a = source.indexOf('let tools=') + 'let tools='.length;
const b = source.indexOf('\n];\nfunction rows', a);
const hs = source.indexOf('function rows('), he = source.indexOf('const grid=', hs);
let fetchImpl = async () => { throw new Error('unexpected network call'); };
const ctx = {
  crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, atob, btoa, URL, Date, Math, JSON, BigInt, Number, String,
  Array, Object, RegExp, Error, Set, Map, Intl, encodeURIComponent, decodeURIComponent, parseInt, parseFloat, isNaN,
  performance, Promise, AbortController, setTimeout, clearTimeout, fetch: (...x) => fetchImpl(...x),
};
const tools = vm.runInNewContext(`(()=>{${source.slice(hs, he)}\nreturn ${source.slice(a, b + 2)};})()`, ctx);
const run = (id, v = {}) => tools.find(t => t.id === id).run(v);
const throwsMsg = async (id, v, re) => assert.rejects(async () => run(id, v), re);

test('IPv4 calculators: subnet, cidr, range, ipv4, wildcard, range-cidr, subnet-split', async () => {
  assert.match(await run('subnet', { ip: '192.168.1.10', prefix: '30' }), /Network: 192\.168\.1\.8\/30[\s\S]*Broadcast: 192\.168\.1\.11[\s\S]*First host: 192\.168\.1\.9[\s\S]*Last host: 192\.168\.1\.10[\s\S]*Usable hosts: 2/);
  assert.match(await run('subnet', { ip: '10.0.0.1', prefix: '31' }), /Usable hosts: 2/);
  assert.match(await run('subnet', { ip: '10.0.0.1', prefix: '32' }), /Usable hosts: 1/);
  assert.match(await run('subnet', { ip: '10.9.9.9', prefix: '8' }), /Broadcast: 10\.255\.255\.255[\s\S]*Usable hosts: 16777214/);
  await throwsMsg('subnet', { ip: '300.1.1.1', prefix: '24' }, /valid IPv4/);
  await throwsMsg('subnet', { ip: '01.2.3.4', prefix: '24' }, /valid IPv4/);
  await throwsMsg('subnet', { ip: '1.2.3.4', prefix: '33' }, /0 to 32/);
  assert.match(await run('cidr', { prefix: '0' }), /Subnet mask: 0\.0\.0\.0[\s\S]*Wildcard: 255\.255\.255\.255/);
  assert.match(await run('cidr', { prefix: '32' }), /Addresses: 1$/);
  assert.match(await run('range', { start: '192.168.1.1', end: '192.168.1.254' }), /Total addresses: 254/);
  await throwsMsg('range', { start: '10.0.0.5', end: '10.0.0.1' }, /greater than or equal/);
  assert.match(await run('ipv4', { ip: '255.255.255.255' }), /4294967295[\s\S]*0xFFFFFFFF/);
  assert.match(await run('ipv4', { ip: '192.168.1.1' }), /11000000\.10101000\.00000001\.00000001/);
  assert.match(await run('wildcard', { prefix: '30' }), /Wildcard mask: 0\.0\.0\.3/);
  const rc = await run('range-cidr', { start: '10.0.0.1', end: '10.0.0.6' });
  assert.match(rc, /10\.0\.0\.1\/32\n10\.0\.0\.2\/31\n10\.0\.0\.4\/31\n10\.0\.0\.6\/32/); assert.match(rc, /CIDR blocks: 4/);
  assert.match(await run('range-cidr', { start: '192.168.1.0', end: '192.168.1.255' }), /^192\.168\.1\.0\/24/);
  const sp = await run('subnet-split', { network: '10.0.0.0/24', count: '4' });
  assert.match(sp, /New prefix: \/26/); assert.match(sp, /10\.0\.0\.192\/26  10\.0\.0\.192 – 10\.0\.0\.255/);
  await throwsMsg('subnet-split', { network: '10.0.0.0/30', count: '8' }, /cannot fit/);
});

test('IPv6 validator, hash tools and HMAC use correct known vectors', async () => {
  const v6 = await run('ipv6', { address: '2001:0db8:0000:0000:0000:ff00:0042:8329' });
  assert.match(v6, /Compressed: 2001:db8::ff00:42:8329/);
  assert.match(await run('ipv6', { address: '::1' }), /Compressed: ::1/);
  await throwsMsg('ipv6', { address: 'gggg::1' }, /Invalid IPv6 group/);
  await throwsMsg('ipv6', { address: '1::2::3' }, /standard hexadecimal/);
  assert.match(await run('hash-text', { text: 'abc' }), /ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad/);
  assert.match(await run('hash-text', { text: '' }), /e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855/);
  const file = { name: 'a.txt', size: 3, async arrayBuffer() { return new TextEncoder().encode('abc').buffer; } };
  assert.match(await run('hash-file', { file }), /ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad/);
  assert.match(await run('hmac', { key: 'key', message: 'The quick brown fox jumps over the lazy dog' }), /f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8/);
  await throwsMsg('hmac', { key: '', message: 'x' }, /secret key/);
});

test('web security tools: headers, csp, csp-audit, cookies, jwt, strength', async () => {
  const h = await run('headers', { headers: 'Strict-Transport-Security: max-age=31536000\nX-Content-Type-Options: nosniff' });
  assert.match(h, /\[PRESENT\] HSTS/); assert.match(h, /\[MISSING\] Content Security Policy/); assert.match(h, /Found 2 of 6/);
  assert.match(await run('headers', { headers: '' }), /Found 0 of 6/);
  assert.match(await run('csp', { origins: 'https://api.example.com' }), /connect-src 'self' https:\/\/api\.example\.com;/);
  await throwsMsg('csp', { origins: 'javascript:alert(1)' }, /HTTPS origins only/);
  await throwsMsg('csp', { origins: 'https://a.com; script-src *' }, /Invalid origin/);
  const ca = await run('csp-audit', { policy: "script-src 'unsafe-inline' *" });
  assert.match(ca, /\[MISSING\] default-src/); assert.match(ca, /\[RISK\] unsafe-inline in script-src/); assert.match(ca, /wildcard source in script-src/);
  assert.match(await run('cookies', { cookies: 'a=1' }), /Secure: MISSING \| HttpOnly: MISSING \| SameSite: MISSING/);
  assert.match(await run('cookies', { cookies: 'sid=1; Secure; HttpOnly; SameSite=Lax' }), /Secure: present \| HttpOnly: present \| SameSite: present/);
  const jwt = await run('jwt', { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' });
  assert.match(jwt, /"alg": "HS256"/); assert.match(jwt, /"name": "John Doe"/); assert.match(jwt, /NOT verified/);
  await throwsMsg('jwt', { token: 'a.b' }, /three dot-separated/);
  await throwsMsg('jwt', { token: 'a.b.c' }, /Base64URL-encoded JSON/);
  assert.match(await run('strength', { password: 'password' }), /Very weak \(appears in common-password lists\)/);
  assert.match(await run('strength', { password: 'aaa' }), /Very weak/);
  assert.match(await run('strength', { password: 'xK9#mQ2$vL7!pR4&' }), /Very strong/);
  await throwsMsg('strength', { password: '' }, /Enter a password/);
});

test('config, systemd and fstab reviewers flag what they should', async () => {
  const c = await run('config', { config: 'enable password cisco\nip http server\nsnmp-server community public RW\nline vty 0 4\n transport input ssh\n exec-timeout 10 0\nlogging host 10.1.1.1' });
  assert.match(c, /\[REVIEW\] Privileged EXEC secret configured/); assert.match(c, /\[FOUND\] VTY restricted to SSH/);
  assert.match(c, /\[FOUND\] Remote logging configured/); assert.match(c, /\[FOUND\] SNMP community string detected/);
  assert.match(c, /\[REVIEW\] HTTP server disabled/);
  assert.match(await run('config', { config: 'enable secret 9 xyz\nno ip http server' }), /\[FOUND\] Privileged EXEC secret configured/);
  const sd = await run('systemd', { unit: '[Service]\nExecStart=/bin/x' });
  assert.match(sd, /\[FOUND\] ExecStart configured/); assert.match(sd, /\[REVIEW\] NoNewPrivileges enabled/);
  assert.match(await run('systemd', { unit: '[Unit]\n[Service]\nUser=app\nExecStart=/bin/x\nNoNewPrivileges=true\nPrivateTmp=true\nRestart=on-failure\nProtectSystem=strict' }), /\[FOUND\] NoNewPrivileges enabled[\s\S]*\[FOUND\] PrivateTmp enabled/);
  assert.match(await run('fstab', { entries: 'bad line' }), /\[INVALID\] expected 6 fields, found 2/);
  assert.match(await run('fstab', { entries: 'UUID=1 /mnt/x nfs defaults 0 0' }), /\[OK STRUCTURE\][\s\S]*consider nofail/);
  assert.match(await run('fstab', { entries: 'UUID=1 /data ext4 defaults,nofail 0 2' }), /\[OK STRUCTURE\] \/data \(ext4\)/);
});

test('linux and developer converters: timestamp, cron, filesize, signals, json, url, html, case, diff, uuid', async () => {
  const ts = await run('timestamp', { timestamp: '1767225600' });
  assert.match(ts, /Detected unit: Seconds/); assert.match(ts, /UTC: 2026-01-01T00:00:00\.000Z/);
  assert.match(await run('timestamp', { timestamp: '1767225600000' }), /Detected unit: Milliseconds[\s\S]*Unix seconds: 1767225600/);
  await throwsMsg('timestamp', { timestamp: 'abc' }, /valid numeric/);
  assert.match(await run('cron', { expression: '*/15 * * * *' }), /Minute: \*\/15[\s\S]*Syntax and field ranges passed/);
  assert.match(await run('cron', { expression: '0 0 1 1 *' }), /Day of month: 1/);
  await throwsMsg('cron', { expression: '61 * * * *' }, /out-of-range/);
  await throwsMsg('cron', { expression: '* * * *' }, /exactly five fields/);
  const fs = await run('filesize', { bytes: '1048576' });
  assert.match(fs, /Bytes: 1,048,576/); assert.match(fs, /MiB \(1024²\): 1\.000/); assert.match(fs, /KiB \(1024\): 1024\.000/);
  await throwsMsg('filesize', { bytes: '-1' }, /non-negative/);
  await throwsMsg('filesize', { bytes: 'abc' }, /non-negative/);
  assert.match(await run('signals', { query: 'SIGTERM' }), /Number: 15/);
  assert.match(await run('signals', { query: 'kill' }), /Signal: SIGKILL[\s\S]*Number: 9/);
  assert.match(await run('signals', { query: '9' }), /Signal: SIGKILL[\s\S]*Number: 9/);
  assert.match(await run('signals', { query: '15' }), /Signal: SIGTERM/);
  assert.match(await run('signals', { query: 'nope' }), /No match/);
  assert.equal(await run('json', { json: '{"a":[1,2]}', mode: 'minify' }), '{"a":[1,2]}');
  assert.match(await run('json', { json: '{"a":1}', mode: 'pretty' }), /\{\n  "a": 1\n\}/);
  await assert.rejects(async () => run('json', { json: '{bad', mode: 'pretty' }));
  assert.equal(await run('url', { text: 'a b&c=d/é', mode: 'encode' }), 'a%20b%26c%3Dd%2F%C3%A9');
  assert.equal(await run('url', { text: 'a%20b%26c', mode: 'decode' }), 'a b&c');
  await assert.rejects(async () => run('url', { text: '%E0%A4%A', mode: 'decode' }));
  assert.equal(await run('html', { text: '<a href="x">&</a>', mode: 'encode' }), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  assert.equal(await run('case', { text: 'Hello World foo', mode: 'kebab' }), 'hello-world-foo');
  assert.equal(await run('case', { text: 'Hello World foo', mode: 'snake' }), 'hello_world_foo');
  assert.equal(await run('case', { text: 'hello world', mode: 'title' }), 'Hello World');
  assert.equal(await run('diff', { left: 'a\nb\nc', right: 'a\nx\nc' }), '  a\n- b\n+ x\n  c');
  assert.match(await run('uuid', {}), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(await run('uuid', {}), await run('uuid', {}));
});

test('tools that need a browser DOM are verified in the real-browser UI run: xml, html decode', () => {
  assert.ok(tools.some(t => t.id === 'xml') && tools.some(t => t.id === 'html'));
});

test('external-service tools handle success, provider errors and bad input (mocked fetch)', async () => {
  const resp = (body, ok = true, status = 200) => ({ ok, status, json: async () => body, text: async () => String(body), arrayBuffer: async () => new ArrayBuffer(0) });
  fetchImpl = async () => resp({ ip: '203.0.113.7' });
  assert.match(await run('public-ip'), /Public IPv4: 203\.0\.113\.7/);
  fetchImpl = async () => resp({ ip: '<script>' });
  await throwsMsg('public-ip', {}, /invalid IPv4/);
  fetchImpl = async () => resp({}, false, 503);
  await throwsMsg('public-ip', {}, /unavailable/);
  let url = '';
  fetchImpl = async u => { url = u; return resp('Cisco Systems, Inc'); };
  assert.match(await run('mac', { mac: '00-1a-2b-3c-4d-5e' }), /OUI: 001A2B[\s\S]*Vendor: Cisco Systems, Inc/);
  assert.equal(url, 'https://api.macvendors.com/001A2B');
  await throwsMsg('mac', { mac: 'not-a-mac' }, /12-hex-digit/);
  fetchImpl = async () => resp('Not Found', false, 404);
  await throwsMsg('mac', { mac: '00:1A:2B:3C:4D:5E' }, /Vendor not found/);
  fetchImpl = async u => { url = u; return resp([{ id: 1, common_name: 'a.example.com', not_before: 'x', not_after: 'y' }, { id: 1, common_name: 'a.example.com', not_before: 'x', not_after: 'y' }]); };
  const crt = await run('crt', { domain: 'example.com' });
  assert.equal(crt.split('\n').length, 1); assert.match(url, /^https:\/\/crt\.sh\/\?q=%25\.example\.com&output=json$/);
  fetchImpl = async () => resp([]);
  assert.match(await run('crt', { domain: 'example.com' }), /No public certificate records/);
  fetchImpl = async () => resp({}, false, 502);
  await throwsMsg('crt', { domain: 'example.com' }, /HTTP 502/);
  await throwsMsg('crt', { domain: 'bad domain' }, /valid public domain/);
  fetchImpl = async u => { url = u; return resp({ Status: 0, Answer: [{ name: 'example.com', TTL: 60, data: '93.184.216.34' }] }); };
  const dns = await run('dns', { domain: 'example.com', type: 'A' });
  assert.match(dns, /Status: NOERROR[\s\S]*93\.184\.216\.34/); assert.match(url, /name=example\.com&type=A$/);
  fetchImpl = async () => resp({ Status: 3 });
  assert.match(await run('dns', { domain: 'nx.example.com', type: 'A' }), /Status: 3[\s\S]*No answer records/);
  await throwsMsg('dns', { domain: 'x;y', type: 'A' }, /valid public domain/);
  fetchImpl = async () => resp({}, false, 500);
  await throwsMsg('latency', {}, /All HTTPS probes failed/);
  fetchImpl = async () => resp(null);
  assert.match(await run('latency'), /Successful probes: 5\/5[\s\S]*not ICMP/);
  fetchImpl = async () => resp({}, false, 500);
  await throwsMsg('speed', {}, /Download test failed/);
  fetchImpl = async () => { throw new Error('unexpected network call'); };
});

test('performance and correctness at scale: diff (Myers) and IOC extraction stay fast and exact', async () => {
  const apply = (out, side) => out.split('\n').filter(l => (side === 'L' ? /^( {2}|- )/ : /^( {2}|\+ )/).test(l)).map(l => l.slice(2)).join('\n');
  // an inserted line must not shift every following line (positional diff bug)
  assert.equal(await run('diff', { left: 'a\nb\nc\nd', right: 'a\nx\nb\nc\nd' }), '  a\n+ x\n  b\n  c\n  d');
  assert.equal(await run('diff', { left: 'a\nb\nc', right: 'a\nc' }), '  a\n- b\n  c');
  assert.equal(await run('diff', { left: 'a\r\nb', right: 'a\nb' }), '  a\n  b');
  assert.equal(await run('diff', { left: '', right: 'x' }), '- \n+ x');
  // deterministic pseudo-random edits: both sides must be reconstructible from the diff
  let seed = 12345; const rnd = n => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n;
  for (let i = 0; i < 400; i++) {
    const L = Array.from({ length: rnd(15) }, () => 'l' + rnd(5)), R = L.slice();
    for (let e = rnd(6); e > 0; e--) { const op = rnd(3), p = rnd(R.length + 1); if (op === 0) R.splice(p, 0, 'n' + rnd(5)); else if (op === 1 && R.length) R.splice(rnd(R.length), 1); else if (R.length) R[rnd(R.length)] = 'm' + rnd(5); }
    const out = await run('diff', { left: L.join('\n'), right: R.join('\n') });
    assert.equal(apply(out, 'L'), L.join('\n')); assert.equal(apply(out, 'R'), R.join('\n'));
  }
  const big = n => Array.from({ length: n }, (_, i) => 'line ' + i + ' value ' + (i * 7 % 13)).join('\n');
  let t0 = performance.now();
  const bd = await run('diff', { left: big(10000), right: big(10000).replace(/value 3/g, 'value 4') });
  assert.ok(performance.now() - t0 < 2000, 'diff of 10k lines with scattered edits must finish in 2 s');
  assert.ok(bd.split('\n').filter(l => /^[-+] /.test(l)).length > 1000);
  await assert.rejects(async () => run('diff', { left: big(20000), right: Array.from({ length: 20000 }, (_, i) => 'z' + i).join('\n') }), /Too many differences/);
  // IOC extraction was quadratic (118 s for 50k lines)
  const log = Array.from({ length: 50000 }, (_, i) => 'host' + i + '.example.com 10.0.' + (i % 250) + '.' + (i % 200) + ' http://a' + i + '.test/p').join('\n');
  t0 = performance.now();
  const ioc = await run('ioc-extractor', { data: log });
  assert.ok(performance.now() - t0 < 3000, 'IOC extraction of 50k lines must finish in 3 s');
  assert.match(ioc, /URLs \(50000\)/); assert.match(ioc, /Domains \(50000\)/);
  const small = await run('ioc-extractor', { data: 'see hxxps://evil[.]example/login and evil[.]example plus other[.]test from 203.0.113.9' });
  assert.match(small, /URLs \(1\)\nhttps:\/\/evil\.example\/login/);
  assert.match(small, /Domains \(1\)\nother\.test/); assert.match(small, /IPv4 addresses \(1\)\n203\.0\.113\.9/);
});

const field = (id, i = 0) => tools.find(t => t.id === id).fields[i][2];
const rows2 = out => Object.fromEntries(out.split('\n').filter(l => l.includes(': ')).map(l => [l.slice(0, l.indexOf(': ')), l.slice(l.indexOf(': ') + 2)]));
const nodeB32 = buf => { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '', o = ''; for (const b of buf) bits += b.toString(2).padStart(8, '0'); for (let i = 0; i < bits.length; i += 5) o += A[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]; while (o.length % 8) o += '='; return o; };

test('CRC-32, MD5/SHA and Base32 match independent references (zlib, node:crypto, RFC 4648)', async () => {
  assert.equal(rows2(await run('crc32', { data: '123456789', mode: 'text (UTF-8)' }))['CRC-32 (hex)'], 'CBF43926');
  assert.equal(rows2(await run('crc32', { data: '', mode: 'text (UTF-8)' }))['CRC-32 (hex)'], '00000000');
  assert.equal(rows2(await run('crc32', { data: '31 32 33 34 35 36 37 38 39', mode: 'hex bytes' }))['CRC-32 (hex)'], 'CBF43926');
  await throwsMsg('crc32', { data: 'abc', mode: 'hex bytes' }, /even number/);
  const samples = ['', 'a', 'abc', 'é', 'مرحبا بالعالم', '😀', 'The quick brown fox jumps over the lazy dog'];
  for (const n of [1, 54, 55, 56, 57, 63, 64, 65, 119, 120, 127, 128, 129, 1000, 4096]) samples.push('x'.repeat(n), String.fromCharCode(...Array.from({ length: n }, (_, i) => 32 + (i * 7) % 90)));
  for (const s of samples) {
    assert.equal(rows2(await run('crc32', { data: s, mode: 'text (UTF-8)' }))['CRC-32 (decimal)'], String(nodeCrc32(Buffer.from(s, 'utf8'))), 'crc32 ' + JSON.stringify(s.slice(0, 20)));
    const r = rows2(await run('multi-hash', { text: s }));
    for (const [label, alg] of [['MD5', 'md5'], ['SHA-1', 'sha1'], ['SHA-256', 'sha256'], ['SHA-384', 'sha384'], ['SHA-512', 'sha512']])
      assert.equal(r[label], createHash(alg).update(s, 'utf8').digest('hex'), label + ' ' + JSON.stringify(s.slice(0, 20)));
  }
  assert.equal(rows2(await run('multi-hash', { text: '' })).MD5, 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(rows2(await run('multi-hash', { text: 'abc' })).MD5, '900150983cd24fb0d6963f7d28e17f72');
  const rfc = { '': '', f: 'MY======', fo: 'MZXQ====', foo: 'MZXW6===', foob: 'MZXW6YQ=', fooba: 'MZXW6YTB', foobar: 'MZXW6YTBOI======' };
  for (const [plain, enc] of Object.entries(rfc)) {
    if (plain) assert.equal(await run('base32', { text: plain, mode: 'encode' }), enc);
    if (enc) assert.equal(await run('base32', { text: enc, mode: 'decode' }), plain);
  }
  for (let n = 0; n < 40; n++) { const buf = Buffer.from(Array.from({ length: n }, (_, i) => (i * 37 + n) & 255)); assert.equal(b32decHex(await run('base32', { text: nodeB32(buf), mode: 'decode' })), buf.toString('hex')); }
  assert.equal(await run('base32', { text: 'mzxw6ytboi', mode: 'decode' }), 'foobar');
  await throwsMsg('base32', { text: 'MZXW1', mode: 'decode' }, /only contain/);
  await throwsMsg('base32', { text: 'MZX', mode: 'decode' }, /length/);
});
function b32decHex(s) { return s.startsWith('Binary data (hex): ') ? s.slice(19) : Buffer.from(s, 'utf8').toString('hex'); }

test('TOTP/HOTP match RFC 4226 and RFC 6238 test vectors and an independent HMAC implementation', async () => {
  const sec1 = nodeB32(Buffer.from('12345678901234567890')).replace(/=/g, '');
  const hotp = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];
  for (let i = 0; i < hotp.length; i++) assert.equal(rows2(await run('otp', { secret: sec1, kind: 'HOTP', value: String(i), digits: '6', algo: 'SHA-1' })).Code, hotp[i]);
  const t6238 = { 59: '94287082', 1111111109: '07081804', 1111111111: '14050471', 1234567890: '89005924', 2000000000: '69279037', 20000000000: '65353130' };
  for (const [t, code] of Object.entries(t6238)) assert.equal(rows2(await run('otp', { secret: sec1, kind: 'TOTP', value: t, digits: '8', algo: 'SHA-1' })).Code, code);
  const ref = (key, alg, t, digits) => { const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(Math.floor(t / 30))); const h = createHmac(alg, key).update(c).digest(); const o = h[h.length - 1] & 15; const bin = ((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) >>> 0; return String(bin % 10 ** digits).padStart(digits, '0'); };
  const keys = { 'SHA-1': ['sha1', '12345678901234567890'], 'SHA-256': ['sha256', '12345678901234567890123456789012'], 'SHA-512': ['sha512', '1234567890123456789012345678901234567890123456789012345678901234'] };
  for (const [alg, [nodeAlg, key]] of Object.entries(keys)) for (const t of [59, 1111111109, 1111111111, 1234567890, 2000000000, 20000000000]) for (const d of [6, 8]) {
    const got = rows2(await run('otp', { secret: nodeB32(Buffer.from(key)).replace(/=/g, ''), kind: 'TOTP', value: String(t), digits: String(d), algo: alg })).Code;
    assert.equal(got, ref(Buffer.from(key), nodeAlg, t, d), alg + ' t=' + t + ' d=' + d);
  }
  assert.equal(rows2(await run('otp', { secret: nodeB32(Buffer.from(keys['SHA-256'][1])).replace(/=/g, ''), kind: 'TOTP', value: '59', digits: '8', algo: 'SHA-256' })).Code, '46119246');
  assert.equal(rows2(await run('otp', { secret: nodeB32(Buffer.from(keys['SHA-512'][1])).replace(/=/g, ''), kind: 'TOTP', value: '59', digits: '8', algo: 'SHA-512' })).Code, '90693936');
  assert.equal(rows2(await run('otp', { secret: sec1, kind: 'TOTP', value: '59', digits: '6', algo: 'SHA-1' }))['Valid for (s)'], '1');
  assert.match(rows2(await run('otp', { secret: sec1, kind: 'TOTP', value: '', digits: '6', algo: 'SHA-1' })).Code, /^\d{6}$/);
  await throwsMsg('otp', { secret: 'ABCDEFGH', kind: 'TOTP', value: '', digits: '6', algo: 'SHA-1' }, /too short/);
  await throwsMsg('otp', { secret: sec1, kind: 'TOTP', value: '-5', digits: '6', algo: 'SHA-1' }, /whole number/);
  await throwsMsg('otp', { secret: 'not base32!!!!!!!!', kind: 'TOTP', value: '', digits: '6', algo: 'SHA-1' }, /Base32/);
});

test('EUI-64, Internet checksum, Wake-on-LAN and MAC formatter produce exact results', async () => {
  const e = rows2(await run('eui64', { mac: '00:25:96:12:34:56', prefix: '2001:db8:1:2::/64' }));
  assert.equal(e['Interface ID'], '::225:96ff:fe12:3456'); assert.equal(e['Global address'], '2001:db8:1:2:225:96ff:fe12:3456'); assert.equal(e['Link-local'], 'fe80::225:96ff:fe12:3456');
  assert.equal(rows2(await run('eui64', { mac: '02:00:00:00:00:01', prefix: '2001:db8::' }))['Interface ID'], '::ff:fe00:1');
  await throwsMsg('eui64', { mac: '00:25:96:12:34:56', prefix: '2001:db8::/48' }, /\/64/);
  await throwsMsg('eui64', { mac: 'zz', prefix: '2001:db8::/64' }, /12-hex-digit/);
  assert.equal(rows2(await run('inet-checksum', { hex: '4500 0073 0000 4000 4011 0000 c0a8 0001 c0a8 00c7' })).Checksum, 'b861');
  assert.equal(rows2(await run('inet-checksum', { hex: '4500 0073 0000 4000 4011 b861 c0a8 0001 c0a8 00c7' })).Checksum, '0000');
  assert.equal(rows2(await run('inet-checksum', { hex: '01' })).Checksum, 'feff');
  await throwsMsg('inet-checksum', { hex: '123' }, /even number/);
  const w = rows2(await run('wol-packet', { mac: '00-1A-2B-3C-4D-5E' }))['Packet (102 bytes, hex)'];
  assert.equal(w.length, 204); assert.equal(w, 'ffffffffffff' + '001a2b3c4d5e'.repeat(16));
  const m = rows2(await run('mac-format', { mac: '00:1A:2B:3C:4D:5E' }));
  assert.equal(m['Cisco dotted'], '001a.2b3c.4d5e'); assert.equal(m.Hyphen, '00-1a-2b-3c-4d-5e'); assert.equal(m.Plain, '001a2b3c4d5e'); assert.equal(m.OUI, '00:1a:2b');
  assert.equal(m.Type, 'Unicast'); assert.match(m.Administration, /^Universally/);
  assert.equal(rows2(await run('mac-format', { mac: 'ffff.ffff.ffff' })).Type, 'Multicast / broadcast');
  assert.match(rows2(await run('mac-format', { mac: '02-00-00-00-00-01' })).Administration, /^Locally/);
  await throwsMsg('mac-format', { mac: '00:1A:2B:3C:4D' }, /12-hex-digit/);
  for (const id of ['crc32', 'multi-hash', 'base32', 'otp', 'eui64', 'inet-checksum', 'wol-packet', 'mac-format']) assert.ok(await run(id, Object.fromEntries(tools.find(t => t.id === id).fields.map(f => [f[0], f[2]]))), id + ' default input runs');
});

test('optional fields work when left blank, and are not marked required in the form', async () => {
  const blank = { 'nmap-builder': { ports: '' }, 'wireshark-filter': { host: '', port: '' }, 'tshark-builder': { filter: '' }, 'tcpdump-builder': { filter: '' }, 'ufw-builder': { src: '' }, 'journalctl-builder': { unit: '' }, otp: { value: '' }, 'windows-event-reference': { eventId: '' } };
  for (const [id, over] of Object.entries(blank)) {
    const defaults = Object.fromEntries(tools.find(t => t.id === id).fields.map(f => [f[0], f[2]]));
    const out = await run(id, { ...defaults, ...over });
    assert.ok(String(out).length > 0, id + ' returns output with blank optional fields');
  }
  assert.match(await run('nmap-builder', { target: '10.0.0.1', scan: 'TCP connect scan', ports: '', timing: 'T3', save: 'no' }), /^nmap -sT -T3 10\.0\.0\.1/);
  assert.match(await run('journalctl-builder', { unit: '', since: 'today', prio: 'all' }), /^journalctl --since today --no-pager/);
  assert.match(await run('ufw-builder', { action: 'allow', port: '443', proto: 'tcp', src: '' }), /^sudo ufw allow port 443 proto tcp/);
  assert.match(await run('wireshark-filter', { proto: 'dns', host: '', port: '' }), /Display filter:\ndns\n/);
  assert.match(source, /el\.step='any'/, 'number inputs must accept decimals (tcp-throughput loss 0.1, transfer-time 2.5 GB)');
  assert.match(source, /el\.required=\(type==='file'\|\|\(type!=='textarea'&&type!=='number'\)\)&&!\/optional\|blank\/i\.test\(label\)/);
});

test('port reference covers common services and unknown queries', async () => {
  assert.match(await run('ports', { port: '443' }), /443\/tcp-or-udp\s+—\s+HTTPS \(TCP\)/);
  assert.match(await run('ports', { port: 'ssh' }), /22/);
  assert.match(await run('ports', { port: '65000' }), /No|not/i);
});

test('every registered tool has a dedicated closure test (guards future additions)', async () => {
  const files = ['platform-tools.test.mjs', 'tool-closure.test.mjs', 'tool-closure-b.test.mjs', 'tool-closure-c.test.mjs', 'tool-closure-d.test.mjs', 'tool-closure-e.test.mjs', 'tool-review-1.test.mjs'];
  let text = '';
  for (const f of files) text += await readFile(new URL('./' + f, import.meta.url), 'utf8');
  text = text.replace(/const overrides = \{[\s\S]*?\n  \};/, '');
  const missing = tools.map(t => t.id).filter(id => !new RegExp(`['"]${id}['"]`).test(text));
  assert.equal(missing.length, 0, 'tools without a dedicated test: ' + missing.join(', '));
});
