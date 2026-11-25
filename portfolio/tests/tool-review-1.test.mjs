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
