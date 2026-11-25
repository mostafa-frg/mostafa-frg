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
    if (c.tool === 'range-cidr') { const got = o.split('\n').filter(x => /^\d+\.\d+\.\d+\.\d+\/\d+$/.test(x)); if (JSON.stringify(got) !== JSON.stringify(c.cidrs)) fail('cidrs'); }
    if (c.tool === 'subnet-split') { const g = o.split('\n').filter(x => /^\d+\.\d+\.\d+\.\d+\/\d+ /.test(x)).map(x => x.split(' ')[0]); if (JSON.stringify(g) !== JSON.stringify(c.subs.slice(0, c.k))) fail('subs'); }
  }
  assert.ok(ok, JSON.stringify(c.v) + ' ' + why + o.slice(0, 120));
}
test('hash, crc32, base32, hex, url, hmac, base-convert, inet-checksum match Python (1268 cases)', async () => { const C = load('review1-hash-encode-python.json'); assert.equal(C.length, 1268); for (const c of C) await check(c); });
test('subnet, wildcard, ipv4, range-cidr, subnet-split, ipv6, ipv6-subnet, cidr-overlap, route-summary, eui64, mac-format match Python (2400 cases)', async () => { const C = load('review1-network-python.json'); assert.equal(C.length, 2400); for (const c of C) await check(c); });
test('ipv6-subnet accepts /0 and /128', () => { const t = tools.find(x => x.id === 'ipv6-subnet'); assert.match(t.run({ addr: '2001:db8::1', prefix: '0' }), /Network: ::\/0/); assert.match(t.run({ addr: '2001:db8::1', prefix: '128' }), /Network: 2001:db8::1\/128/); assert.throws(() => t.run({ addr: '::1', prefix: '129' })); });
