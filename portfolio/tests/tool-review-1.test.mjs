// Review 1: older tools checked against Python (hashlib, hmac, zlib, base64, urllib, ipaddress) on ~2,900 generated cases.
// Fixtures were generated with Python; regenerate rather than edit by hand.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const src = fs.readFileSync(new URL('../assets/platform.js', import.meta.url), 'utf8');
const a = src.indexOf('let tools=') + 10, b = src.indexOf('\n];\nfunction rows', a), hs = src.indexOf('function rows('), he = src.indexOf('const grid=', hs);
const tools = vm.runInNewContext(`(()=>{${src.slice(hs, he)}\nconst r=${src.slice(a, b + 2)};r.forEach(withValidatedInputs);return r;})()`, { crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, Math, JSON, Number, String, Array, Object, RegExp, Error, Set, Map, Date, BigInt, parseInt, parseFloat, isNaN, btoa, atob, URL, Intl, encodeURIComponent, decodeURIComponent, performance, Promise });
const val = (o, k) => { const l = String(o).split('\n').find(x => x.startsWith(k + ': ')); return l ? l.slice(k.length + 2) : null; };
const load = (f) => JSON.parse(fs.readFileSync(new URL('./fixtures/' + f, import.meta.url), 'utf8'));
async function check(c) {
  const t = tools.find(x => x.id === c.tool); assert.ok(t, c.tool);
  const v = {}; for (const f of t.fields) v[f[0]] = f[2]; Object.assign(v, c.v);
  let o; try { o = String(await t.run(v)); } catch (e) { o = 'ERR ' + e.message; }
  const e = c.exp; let ok = true, why = '';
  const fail = (m) => { ok = false; why += m + '; '; };
  if (c.tool === 'multi-hash') { for (const [k, x] of Object.entries(e)) if (val(o, k) !== x) fail(k); }
  else if (c.tool === 'crc32') { if (val(o, 'CRC-32 (hex)') !== e[0] || val(o, 'CRC-32 (decimal)') !== e[1] || val(o, 'Bytes') !== e[2]) fail('crc'); }
  else if (c.tool === 'base-convert') { if (val(o, 'Decimal') !== e[0] || val(o, 'Hexadecimal') !== e[1] || val(o, 'Octal') !== e[2] || val(o, 'Binary') !== e[3]) fail('base'); }
  else if (c.tool === 'inet-checksum') { if (val(o, 'Folded sum') !== e[0] || val(o, 'Checksum') !== e[1]) fail('sum'); }
  else if (['hash-text', 'text-hex', 'base32', 'url', 'hmac'].includes(c.tool)) { if (o.split('\n\n')[0] !== e && o !== e && o.trim() !== e) fail('value'); }
  else {
    if (e) for (const [k, x] of Object.entries(e)) if (val(o, k) !== x) fail(k + ' got ' + val(o, k) + ' exp ' + x);
    if (c.tool === 'subnet' && c.hosts[0] && (val(o, 'First host') !== c.hosts[0] || val(o, 'Last host') !== c.hosts[1])) fail('hosts');
    if (c.tool === 'cidr-overlap') { if ((val(o, 'Overlap') === 'YES') !== c.ov) fail('overlap'); else if (c.ov && val(o, 'Intersection') !== c.inter[0] + ' – ' + c.inter[1]) fail('intersection');
      const rl = val(o, 'Relationship') || ''; const m = { same: /same|identical|equal/i, 'B in A': /B is inside A/i, 'A in B': /A is inside B/i, partial: /partial/i, none: /./ }[c.rel]; if (c.ov && !m.test(rl)) fail('relationship ' + rl); }
    if (c.tool === 'route-summary' && (val(o, 'Summary route') !== c.summary || val(o, 'Addresses covered') !== String(c.covered) || val(o, 'Addresses in your list') !== String(c.mine) || (val(o, 'Exact summary') === 'yes') !== c.exact)) fail('summary');
    if (c.tool === 'color') { const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(val(o, 'RGB') || ''); if (!m || m.slice(1).map(Number).join() !== c.rgb.join()) fail('rgb');
      const h = /hsl\((\d+), (\d+)%, (\d+)%\)/.exec(val(o, 'HSL') || ''); if (!h || [0, 1, 2].some(i => Math.abs(+h[i + 1] - c.hsl[i]) > 0.5001 && !(i === 0 && Math.abs(Math.abs(+h[1] - c.hsl[0]) - 360) < 0.51))) fail('hsl ' + val(o, 'HSL')); }
    if (c.num) for (const [k, [x, d]] of Object.entries(c.num)) { const g = parseFloat(String(val(o, k)).replace(/,/g, '')); if (!(Math.abs(g - x) <= 0.5 * 10 ** -d + 1e-9 * Math.abs(x))) fail(k); }
    if (c.tool === 'tcp-throughput') { const m = /([\d.]+) (K|M|G)bit/.exec(val(o, 'Estimated max throughput') || ''); const mb = parseFloat(m?.[1]) * ({ K: 1e-3, M: 1, G: 1e3 }[m?.[2]]); if (!(Math.abs(mb - c.mbit) <= 0.0051 + 0.0006 * c.mbit)) fail('tcp'); }
    if (c.tool === 'entropy' && (val(o, 'Length') !== String(c.n) || val(o, 'Distinct chars') !== String(c.dist) || Math.abs(parseFloat(val(o, 'Entropy (bits/char)')) - c.H) > 0.0006)) fail('entropy');
    if (c.tool === 'range-cidr') { const got = o.split('\n').filter(x => /^\d+\.\d+\.\d+\.\d+\/\d+$/.test(x)); if (JSON.stringify(got) !== JSON.stringify(c.cidrs)) fail('cidrs'); }
    if (c.tool === 'subnet-split') { const g = o.split('\n').filter(x => /^\d+\.\d+\.\d+\.\d+\/\d+ /.test(x)).map(x => x.split(' ')[0]); if (JSON.stringify(g) !== JSON.stringify(c.subs.slice(0, c.k))) fail('subs'); }
  }
  assert.ok(ok, JSON.stringify(c.v) + ' ' + why + o.slice(0, 120));
}
test('hash, crc32, base32, hex, url, hmac, base-convert, inet-checksum match Python (1268 cases)', async () => { const C = load('review1-hash-encode-python.json'); assert.equal(C.length, 1268); for (const c of C) await check(c); });
test('subnet, wildcard, ipv4, range-cidr, subnet-split, ipv6, ipv6-subnet, cidr-overlap, route-summary, eui64, mac-format match Python (2400 cases)', async () => { const C = load('review1-network-python.json'); assert.equal(C.length, 2400); for (const c of C) await check(c); });
test('chmod, umask, color, timestamp (UTC), filesize, tcp-throughput, bdp, entropy match Python (1500 cases)', async () => { const C = load('review1-misc-python.json'); assert.equal(C.length, 1500); for (const c of C) await check(c); });
test('cvss 3.1 matches an independent implementation of the spec for all 2592 base vectors', () => {
  const t = tools.find(x => x.id === 'cvss');
  for (const c of load('review1-cvss-python.json')) { const o = String(t.run({ vec: c.vec })); assert.equal(val(o, 'Base score'), c.score, c.vec); assert.equal(val(o, 'Severity'), c.sev, c.vec); }
  assert.equal(val(String(t.run({ vec: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H' })), 'Base score'), '10.0'); // Log4Shell (published)
  assert.equal(val(String(t.run({ vec: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N' })), 'Base score'), '7.5');
  assert.throws(() => t.run({ vec: 'CVSS:3.1/AV:N/AV:L/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' }), /Duplicate metric AV/);
  assert.throws(() => t.run({ vec: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H' }), /Missing or invalid metric A/);
});
test('json, csv-json, jwt match Python (650 cases); csv keeps blank-valued rows; unsigned jwt says absent', () => {
  for (const c of load('review1-text-python.json')) {
    const t = tools.find(x => x.id === c.tool); const v = {}; for (const f of t.fields) v[f[0]] = f[2]; Object.assign(v, c.v); const o = String(t.run(v));
    if (c.tool === 'json') assert.equal(o, c.exp.replace(/(\de)([+-])0(\d)/g, '$1$2$3'));
    if (c.tool === 'csv-json') assert.deepEqual(JSON.parse(o), c.exp, c.v.csv);
    if (c.tool === 'jwt') { const m = /HEADER \(decoded only\)\n([\s\S]*?)\n\nPAYLOAD \(decoded only\)\n([\s\S]*?)\n\nSignature: (.*)/.exec(o); assert.ok(m, o); assert.deepEqual(JSON.parse(m[1]), c.h); assert.deepEqual(JSON.parse(m[2]), c.p); if (c.sigl === 0) assert.match(m[3], /absent/); else assert.ok(m[3].includes('(' + c.sigl + ' ')); }
  }
  const csv = tools.find(x => x.id === 'csv-json');
  assert.deepEqual(JSON.parse(csv.run({ csv: 'a,b\n,\n1,2\n' })), [{ a: '', b: '' }, { a: '1', b: '2' }]);
  assert.deepEqual(JSON.parse(csv.run({ csv: 'a\n""\nx\n\n' })), [{ a: '' }, { a: 'x' }]); // quoted empty kept, blank line skipped
});
test('ipv6-subnet accepts /0 and /128', () => { const t = tools.find(x => x.id === 'ipv6-subnet'); assert.match(t.run({ addr: '2001:db8::1', prefix: '0' }), /Network: ::\/0/); assert.match(t.run({ addr: '2001:db8::1', prefix: '128' }), /Network: 2001:db8::1\/128/); assert.throws(() => t.run({ addr: '::1', prefix: '129' })); });
test('command builders emit syntactically valid commands (ufw, journalctl)', () => {
  const run = (id, v) => { const t = tools.find(x => x.id === id); const d = {}; for (const f of t.fields) d[f[0]] = f[2]; return String(t.run({ ...d, ...v })); };
  assert.match(run('ufw-builder', { port: '443', proto: 'tcp', src: '' }), /^sudo ufw allow 443\/tcp\n/);
  assert.match(run('ufw-builder', { action: 'deny', port: '53', proto: 'udp', src: '10.0.0.0/8' }), /^sudo ufw deny from 10\.0\.0\.0\/8 to any port 53 proto udp\n/);
  const j = run('kali-journalctl-builder', { priority: 'all' }); assert.doesNotMatch(j, / -p /);
  assert.match(run('kali-journalctl-builder', { priority: 'err' }), / -p err /);
});
test('kali-tcpdump-filter joins primitives with and and rejects ports for icmp/arp', () => {
  const t = tools.find(x => x.id === 'kali-tcpdump-filter'); const d = { protocol: 'tcp', host: '192.0.2.10', port: '443', direction: 'any' };
  assert.match(t.run(d), /'tcp and host 192\.0\.2\.10 and port 443'/);
  assert.match(t.run({ ...d, direction: 'src', protocol: 'udp', port: '' }), /'udp and src host 192\.0\.2\.10'/);
  assert.match(t.run({ ...d, host: '' , protocol: 'ip6' }), /'ip6 and port 443'/);
  assert.throws(() => t.run({ ...d, protocol: 'arp' }), /Port filters only apply/);
  assert.match(t.run({ ...d, protocol: 'arp', port: '' }), /'arp and host 192\.0\.2\.10'/);
});
test('http-status and signals match Python http.HTTPStatus / signal; case conversion keeps non-ASCII letters', () => {
  const F = load('review1-ref-tables-python.json');
  const hs = tools.find(x => x.id === 'http-status');
  for (const [code, phrase] of Object.entries(F.http)) { const o = String(hs.run({ code })); assert.equal(val(o, 'Meaning'), phrase, code); assert.equal(val(o, 'Class'), ['Informational', 'Success', 'Redirection', 'Client error', 'Server error'][Math.floor(code / 100) - 1]); }
  assert.match(String(hs.run({ code: '299' })), /Unassigned/); assert.throws(() => hs.run({ code: '99' })); assert.throws(() => hs.run({ code: '600' }));
  const sg = tools.find(x => x.id === 'signals');
  for (const [name, num] of Object.entries(F.sig)) { const a = String(sg.run({ query: name })); assert.equal(val(a, 'Number'), String(num), name); assert.equal(val(a, 'Signal'), name); const b = String(sg.run({ query: String(num) })); assert.equal(val(b, 'Signal'), name, String(num)); assert.equal(val(String(sg.run({ query: name.slice(3).toLowerCase() })), 'Signal'), name); }
  assert.match(String(sg.run({ query: '63' })), /No match/);
  const cs = tools.find(x => x.id === 'case');
  assert.equal(cs.run({ text: 'café au lait', mode: 'snake' }), 'café_au_lait'); assert.equal(cs.run({ text: 'fooBarBaz', mode: 'kebab' }), 'foo-bar-baz'); assert.equal(cs.run({ text: 'caféBar', mode: 'kebab' }), 'café-bar'); assert.equal(cs.run({ text: 'naïveÜber', mode: 'snake' }), 'naïve_über');
  assert.equal(cs.run({ text: 'naïve ÜBER', mode: 'kebab' }), 'naïve-über'); assert.equal(cs.run({ text: 'HTTPServer2Go', mode: 'snake' }), 'httpserver2_go');
});
test('ioc-extractor: refang keeps the scheme, no false IPs/domains, emails and IPv6 found', () => {
  const t = tools.find(x => x.id === 'ioc-extractor'); const md5 = 'd41d8cd98f00b204e9800998ecf8427e';
  const o = String(t.run({ data: `999.1.1.1 1.2.3.4.5 10.0.0.1 hxxp://c[.]example/p hxxps[:]//q[.]example ftp://f.example/ file.txt image.png dll.dll user@evil.example 2001:db8::1 ::1 10:15:22 ${md5} ${md5.toUpperCase()}` }));
  const sec = (n) => { const m = new RegExp(n + ' \\((\\d+)\\)\\n([\\s\\S]*?)\\n\\n').exec(o); assert.ok(m, n); return m[2].split('\n').filter(x => x !== 'None'); };
  assert.deepEqual(sec('URLs'), ['http://c.example/p', 'https://q.example', 'ftp://f.example/']);
  assert.deepEqual(sec('IPv4 addresses'), ['10.0.0.1']); assert.deepEqual(sec('IPv6 addresses'), ['2001:db8::1', '::1']);
  assert.deepEqual(sec('Email addresses'), ['user@evil.example']); assert.deepEqual(sec('Domains'), ['evil.example']);
  assert.deepEqual(sec('File hashes'), [md5 + ' (MD5)']);
});
test('nmap-parser counts only state "open" as open; tcpdump-analyzer parses IPv4/IPv6/ICMP addresses and ports', () => {
  const np = tools.find(x => x.id === 'nmap-parser').run({ out: 'Nmap scan report for 10.0.0.5\nPORT STATE SERVICE\n22/tcp open ssh OpenSSH 8.9\n25/tcp filtered smtp\n53/udp open|filtered domain\n80/tcp closed http\n443/tcp open https\n' });
  assert.match(np, /Open: 2 \/ listed: 5 \(filtered: 1, open\|filtered: 1, closed: 1\)/); assert.doesNotMatch(np, /53\/udp/);
  const out = String(tools.find(x => x.id === 'tcpdump-analyzer').run({ out: '12:00:00.1 IP6 2001:db8::1.443 > 2001:db8::2.51000: Flags [S.], seq 1\n12:00:00.2 ARP, Request who-has 10.0.0.1 tell 10.0.0.2, length 28\n12:00:00.3 IP 10.0.0.2 > 10.0.0.1: ICMP echo request, id 1, seq 1, length 64\n12:00:00.4 IP 10.0.0.2.5353 > 224.0.0.251.5353: UDP, length 40\n' }));
  assert.match(out, /Packets parsed: 3/); assert.match(out, /2001:db8::1 {2}\(1\)/); assert.match(out, /10\.0\.0\.2 {2}\(2\)/); assert.match(out, /2001:db8::2 {2}\(1\)/); assert.match(out, /51000 {2}\(1\)/); assert.match(out, /5353 {2}\(1\)/); assert.doesNotMatch(out, /\s10\.0\.0 {2}/);
});
test('config audits catch real-world problems: sshd (Match, protocol, ciphers), SUID GTFOBins, k8s secret env, wrangler JSONC', () => {
  const T = (id, v) => String(tools.find(x => x.id === id).run(v));
  const ssh = T('sshd-config-audit', { config: 'PermitRootLogin prohibit-password\nProtocol 1\nCiphers aes128-cbc,aes256-gcm@openssh.com\nMACs hmac-md5\nMatch User bob\n  PasswordAuthentication no\n  PermitRootLogin yes' });
  assert.match(ssh, /permitrootlogin: prohibit-password \[OK\]/); assert.match(ssh, /protocol: 1 \[RISK\]/); assert.match(ssh, /ciphers: .*\[RISK\]/); assert.match(ssh, /macs: hmac-md5 \[RISK\]/); assert.doesNotMatch(ssh, /duplicate directives/); assert.doesNotMatch(ssh, /passwordauthentication: no \[/);
  assert.match(T('sshd-config-audit', { config: 'PermitRootLogin yes' }), /permitrootlogin: yes \[RISK\]/);
  assert.doesNotMatch(T('sshd-config-audit', { config: 'Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com' }), /ciphers: .*\[RISK\]/);
  const su = T('kali-suid-audit', { paths: '/usr/bin/find\n/usr/bin/vim.basic\n/usr/bin/python3.11\n/usr/bin/passwd\n/tmp/x' });
  for (const p of ['/usr/bin/find', '/usr/bin/vim.basic', '/usr/bin/python3.11']) assert.match(su, new RegExp('\\[HIGH\\] Known shell-escape.*: ' + p.replace(/\./g, '\\.')));
  assert.match(su, /\[REVIEW\] System executable.*passwd/); assert.match(su, /\[HIGH\] User-writable.*\/tmp\/x/);
  assert.match(T('k8s-manifest-audit', { manifest: 'spec:\n  containers:\n  - name: a\n    image: nginx:1.25\n    env:\n    - name: DB_PASSWORD\n      value: hunter2\n    - name: TOKEN\n      valueFrom:\n        secretKeyRef: {name: s, key: t}' }), /HIGH line 7: secret-like environment variable DB_PASSWORD/);
  assert.doesNotMatch(T('k8s-manifest-audit', { manifest: 'spec:\n  containers:\n  - name: a\n    image: nginx:1.25\n    env:\n    - name: TOKEN\n      valueFrom:\n        secretKeyRef: {name: s, key: t}' }), /secret-like environment/);
  const wr = T('wrangler-config-audit', { config: '{\n // comment\n "name":"x","main":"src/index.js","compatibility_date":"2020-01-01",\n "vars":{"API_TOKEN":"abc","MODE":"prod",},\n "env":{"production":{"vars":{"DB_PASSWORD":"p"}}}, "workers_dev":true,\n}' });
  assert.match(wr, /HIGH vars\.API_TOKEN/); assert.match(wr, /HIGH env\.production\.vars\.DB_PASSWORD/); assert.match(wr, /workers_dev is enabled/); assert.match(wr, /compatibility_date is more than/); assert.doesNotMatch(wr, /vars\.MODE/); assert.doesNotMatch(wr, /no env\.production/);
  assert.throws(() => tools.find(x => x.id === 'wrangler-config-audit').run({ config: '{ "name": ' }), /Could not parse/);
});
test('k8s host-namespace checks and every GTFOBins name in the SUID list', () => {
  const k = String(tools.find(x => x.id === 'k8s-manifest-audit').run({ manifest: 'spec:\n  hostNetwork: true\n  hostPID: true\n  hostIPC: true\n  containers:\n  - name: a\n    image: x:1\n    securityContext:\n      readOnlyRootFilesystem: false' }));
  for (const m of [/line 2: Pod shares the host network/, /line 3: Pod shares the host PID/, /line 4: Pod shares the host IPC/, /line 9: A writable container root/]) assert.match(k, m);
  const names = 'bash sh dash zsh csh ksh busybox cp env find gdb less more nano vi vim view nmap node perl php python python2 python3 ruby rsync strace tar awk gawk mawk nawk sed tclsh timeout unshare xargs watch ionice nice taskset setarch time'.split(' ');
  const o = String(tools.find(x => x.id === 'kali-suid-audit').run({ paths: names.map(n => '/usr/bin/' + n).join('\n') }));
  for (const n of names) assert.match(o, new RegExp('\\[HIGH\\] Known shell-escape.*: /usr/bin/' + n + '$', 'm'), n);
  assert.doesNotMatch(String(tools.find(x => x.id === 'kali-suid-audit').run({ paths: '/usr/bin/passwd\n/usr/bin/sudo' })), /Known shell-escape/);
});
