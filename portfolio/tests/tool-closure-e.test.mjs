// Batch 3 (TLS/web tools). Ground truth: OpenSSL 3.0.13 cipher metadata (fixtures/openssl-3.0.13-ciphers.json, generated with
// `openssl ciphers -stdname -v ALL:COMPLEMENTOFALL`), Python (jwt/dns built independently) and the cited RFCs.
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
const CIPHERS = JSON.parse(await readFile(new URL('./fixtures/openssl-3.0.13-ciphers.json', import.meta.url), 'utf8'));
const parseLine = (out, name) => { const l = out.split('\n').find(x => x.startsWith(name + ' =>')); assert.ok(l, 'no line for ' + name);
  const m = /=> (\w+) \| fs=(yes|no) \| aead=(yes|no) \| (.*)$/.exec(l); assert.ok(m, 'bad line ' + l); return { level: m[1], fs: m[2], aead: m[3], why: m[4] }; };

test('cipher-suite-classifier agrees with OpenSSL metadata for all 158 suites, by OpenSSL and IANA name', () => {
  assert.equal(CIPHERS.length, 158);
  for (const key of ['ossl', 'iana']) for (const c of CIPHERS) {
    const r = parseLine(run('cipher-suite-classifier', { text: c[key] }), c[key]);
    const fsT = c.kx === 'any' || (c.au !== 'None' && /^(ECDH|DH|DHEPSK|ECDHEPSK)$/.test(c.kx)) ? 'yes' : 'no';
    const nullEnc = c.enc === 'None', anon = c.au === 'None', ccm8 = /CCM8/.test(c.enc);
    const aeadT = c.mac === 'AEAD' ? 'yes' : 'no';
    assert.equal(r.fs, fsT, key + ' fs ' + c[key]); assert.equal(r.aead, aeadT, key + ' aead ' + c[key]);
    const levelT = nullEnc || anon ? 'INSECURE' : (fsT === 'yes' && aeadT === 'yes' && !ccm8 ? 'RECOMMENDED' : 'LEGACY');
    assert.equal(r.level, levelT, key + ' level ' + c[key]);
  }
});

test('cipher-suite-classifier flags RC4, DES, 3DES, EXPORT, IDEA, SEED per RFC 7465 / Sweet32', () => {
  const L = (n) => parseLine(run('cipher-suite-classifier', { text: n }), n).level;
  for (const n of ['RC4-SHA', 'RC4-MD5', 'TLS_RSA_WITH_RC4_128_SHA', 'TLS_ECDHE_RSA_WITH_RC4_128_SHA', 'DES-CBC-SHA', 'TLS_RSA_WITH_DES_CBC_SHA',
    'EXP-RC4-MD5', 'TLS_RSA_EXPORT_WITH_RC4_40_MD5', 'EXP-DES-CBC-SHA']) assert.equal(L(n), 'INSECURE', n);
  for (const n of ['DES-CBC3-SHA', 'EDH-RSA-DES-CBC3-SHA', 'TLS_RSA_WITH_3DES_EDE_CBC_SHA', 'TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA', 'IDEA-CBC-SHA',
    'SEED-SHA', 'DHE-RSA-SEED-SHA']) assert.equal(L(n), 'WEAK', n);
  for (const n of ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_AES_128_CCM_SHA256']) assert.equal(L(n), 'RECOMMENDED', n);
  assert.equal(L('TLS_AES_128_CCM_8_SHA256'), 'LEGACY');
  const o = run('cipher-suite-classifier', { text: 'HIGH:!aNULL:FOO-BAR\nECDHE-RSA-AES128-GCM-SHA256' });
  assert.match(o, /Unknown: 3/); assert.match(o, /Recommended: 1/); assert.match(o, /HIGH => UNKNOWN/);
  assert.throws(() => run('cipher-suite-classifier', { text: '  ' }), /at least one/);
});

const JW = JSON.parse(await readFile(new URL('./fixtures/jwt-python-fixtures.json', import.meta.url), 'utf8'));
const NOW = new Date(JW.now * 1000).toISOString();
const codes = (name, extra = {}) => { const o = run('jwt-security-audit', { token: JW.T[name], now: NOW, ...extra });
  return { o, c: [...o.matchAll(/^\[(\w+)\] (\w+):/gm)].map(m => m[2]) }; };

test('jwt-security-audit findings match tokens built independently in Python', () => {
  assert.deepEqual(codes('good').c, []);
  assert.match(codes('good').o, /Findings: 0/); assert.match(codes('good').o, /Header alg: RS256/);
  assert.deepEqual(codes('none').c, ['ALG_NONE']); assert.match(codes('none').o, /^\[?.*Type: JWS/m);
  assert.deepEqual(codes('none_mixed').c, ['ALG_NONE']);
  assert.deepEqual(codes('hs_noexp').c.sort(), ['EXP_MISSING', 'HS_SHARED']);
  assert.deepEqual(codes('expired').c, ['EXP_EXPIRED']); assert.match(codes('expired').o, /expired 3600 seconds ago/);
  assert.deepEqual(codes('jku_kid').c.sort(), ['JKU', 'KID_RISK']);
  assert.deepEqual(codes('ms').c, ['EXP_MS']);
  assert.deepEqual(codes('long').c, ['LIFETIME_LONG']); assert.match(codes('long').o, /720 hours/);
  assert.deepEqual(codes('nbf').c, ['NBF_FUTURE']); assert.match(codes('nbf').o, /600 seconds in the future/);
  assert.deepEqual(codes('unsigned').c, ['UNSIGNED']);
  assert.deepEqual(codes('noalg').c, ['ALG_MISSING']);
  assert.deepEqual(codes('jwk').c, ['JWK_EMBEDDED']);
  assert.deepEqual(codes('expstr').c, ['EXP_INVALID']);
  assert.deepEqual(codes('iatfut').c, ['IAT_FUTURE']);
  assert.deepEqual(codes('sens').c, ['SENSITIVE_CLAIM']);
  assert.match(codes('uni').o, /Claims: iss, aud, sub, iat, exp, name/); assert.deepEqual(codes('uni').c, []);
  assert.equal(JW.T.jwe.split('.').length, 5);
});

test('jwt-security-audit handles Bearer prefix, JWE, severity order and bad input', () => {
  assert.match(run('jwt-security-audit', { token: 'Bearer ' + JW.T.none, now: NOW }), /ALG_NONE/);
  assert.match(run('jwt-security-audit', { token: JW.T.jwe }), /JWE \(encrypted, 5 parts\)[\s\S]*RSA-OAEP \/ A256GCM/);
  const o = codes('hs_noexp').o; assert.ok(o.indexOf('[MEDIUM]') < o.indexOf('[INFO]'));
  assert.throws(() => run('jwt-security-audit', { token: JW.T.bad }), /3 dot-separated parts/);
  assert.throws(() => run('jwt-security-audit', { token: 'a!b.c.d' }), /Header is not valid/);
  assert.throws(() => run('jwt-security-audit', { token: JW.T.good, now: 'garbage' }), /not a valid ISO/);
  assert.throws(() => run('jwt-security-audit', { token: '   ' }), /Paste a JWT/);
});

test('jwt-security-audit boundaries: 24h lifetime and seconds/milliseconds threshold', () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const mkTok = (claims) => b64({ alg: 'RS256' }) + '.' + b64({ iss: 'i', aud: 'a', sub: 's', ...claims }) + '.' + Buffer.from('sig').toString('base64url');
  const f = (claims) => [...run('jwt-security-audit', { token: mkTok(claims), now: NOW }).matchAll(/^\[\w+\] (\w+):/gm)].map(m => m[1]);
  assert.deepEqual(f({ iat: JW.now, exp: JW.now + 86400 }), []);
  assert.deepEqual(f({ iat: JW.now, exp: JW.now + 90000 }), ['LIFETIME_LONG']);
  assert.deepEqual(f({ exp: 2e11 }), ['EXP_MS']);
  assert.deepEqual(f({ exp: 9e10 }), []); // year ~4800 in seconds, still below the 1e11 millisecond heuristic
});
