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

const WEB = JSON.parse(await readFile(new URL('./fixtures/web-python-fixtures.json', import.meta.url), 'utf8'));
const NOW8 = '2026-11-21T08:00:00Z';
const findings = (o) => [...o.matchAll(/^\[(\w+)\] (\w+)?:?/gm)].map(m => m[1] + (m[2] ? ' ' + m[2] : ''));

test('hsts-check follows RFC 6797 grammar and the hstspreload.org requirements', () => {
  const H = (s) => run('hsts-check', { header: s });
  let o = H('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
  assert.match(o, /Valid: Yes/); assert.match(o, /Preload-list eligible: Yes/); assert.match(o, /No findings/);
  assert.match(H('max-age=31535999; includeSubDomains; preload'), /Preload-list eligible: No - max-age must be at least 31536000/);
  assert.match(H('max-age=31536000; preload'), /No - includeSubDomains is required/);
  assert.match(H('max-age=31536000; includeSubDomains'), /No - preload directive is required/);
  assert.match(H('MAX-AGE=600; INCLUDESUBDOMAINS'), /max-age: 600 seconds/); // names are case-insensitive
  assert.match(H('max-age="31536000"'), /max-age: 31536000 seconds \(365\.0 days\)/); // quoted-string allowed
  assert.match(H('max-age=600'), /under 180 days \(0 days\)/);
  assert.match(H('max-age=15552000; includeSubDomains'), /^(?![\s\S]*under 180 days)/); // exactly 180 days is not flagged
  assert.match(H('max-age=15551999; includeSubDomains'), /under 180 days/);
  assert.match(H('max-age=0'), /deletes?|delete the HSTS policy/); assert.match(H('max-age=0'), /Valid: Yes/);
  assert.match(H('max-age=1; max-age=2'), /Valid: No[\s\S]*more than once/);
  assert.match(H('includeSubDomains'), /Valid: No[\s\S]*max-age is required/);
  assert.match(H('max-age=abc'), /Valid: No[\s\S]*digits only/); assert.match(H('max-age=-5'), /Valid: No/); assert.match(H('max-age='), /Valid: No/);
  assert.match(H('max-age=31536000; foo=bar'), /unknown directive "foo"/);
  assert.match(H('max-age=31536000; includeSubDomains=1'), /takes no value/);
  assert.throws(() => H('  '), /Paste/); assert.throws(() => H('max-age=1\nmax-age=2'), /single header/);
});

test('security-txt-check enforces RFC 9116 rules; dates agree with Python datetime', () => {
  const T = (text, now = NOW8) => run('security-txt-check', { text, now });
  const good = 'Contact: mailto:a@example.com\nExpires: 2027-06-30T23:59:59Z\n';
  assert.match(T(good), /Result: VALID/);
  assert.match(T('Expires: 2027-06-30T23:59:59Z'), /Contact is required and missing/);
  assert.match(T('Contact: mailto:a@example.com'), /Expires is required and missing/);
  assert.match(T(good + 'Expires: 2027-07-01T00:00:00Z'), /Expires must not appear more than once \(found 2\)/);
  assert.match(T(good + 'Preferred-Languages: en\nPreferred-Languages: ar'), /Preferred-Languages must not appear more than once/);
  assert.match(T('Contact: a@example.com\nExpires: 2027-06-30T23:59:59Z'), /must use the mailto: scheme/);
  assert.match(T('Contact: http://example.com/r\nExpires: 2027-06-30T23:59:59Z'), /must begin with https:\/\//);
  assert.match(T('Contact: tel:+20123456789\nExpires: 2027-06-30T23:59:59Z'), /Result: VALID/);
  assert.match(T('Contact: not a uri\nExpires: 2027-06-30T23:59:59Z'), /not a valid URI/);
  assert.match(T(good + 'Encryption: -----BEGIN PGP PUBLIC KEY BLOCK-----'), /never the key itself/);
  assert.match(T(good + 'Policy: http://example.com/p'), /policy web URI must begin with https/);
  assert.match(T(good + 'CONTACT: https://example.com/c'), /Contact entries: 2/); // names are case-insensitive
  assert.match(T(good + 'X-Custom: 1'), /unknown field "x-custom".*allowed/);
  assert.match(T(good + 'garbage line'), /line 3 is not "Field: value"/);
  assert.match(T('# only a comment\n' + good), /Result: VALID/);
  assert.match(T(good.replace('\n', '\r\n')), /Result: VALID/);
  assert.match(T('-----BEGIN PGP SIGNED MESSAGE-----\nHash: SHA512\n\n' + good + '-----BEGIN PGP SIGNATURE-----\nabc\n-----END PGP SIGNATURE-----'), /Signed: yes/);
  assert.match(T('Contact: mailto:a@example.com\nExpires: 2026-11-21T07:59:59Z'), /has expired/);
  assert.match(T('Contact: mailto:a@example.com\nExpires: 2026-11-21T08:00:00Z'), /has expired/); // equal to now counts as expired
  assert.match(T('Contact: mailto:a@example.com\nExpires: 2028-01-01T00:00:00Z'), /more than a year away/);
  assert.match(T('Contact: mailto:a@example.com\nExpires: 2027-11-21T08:00:00Z'), /^(?![\s\S]*more than a year)/);
  assert.match(T('Contact: mailto:a@example.com\nExpires: 2027-11-22T08:00:00Z'), /^(?![\s\S]*more than a year)/); // exactly 366 days ahead
  assert.match(T('Contact: mailto:a@example.com\nExpires: 2027-11-22T08:00:01Z'), /more than a year away/);
  for (const d of WEB.dates.filter(x => x.d && x.d !== '2027-06-30T23:59:60Z')) {
    const o = T('Contact: mailto:a@example.com\nExpires: ' + d.d, '2000-01-01T00:00:00Z');
    assert.equal(/not a valid RFC 3339/.test(o), !d.valid, 'date ' + d.d);
  }
  assert.throws(() => T(good, 'x'), /not a valid ISO/);
});

test('cors-config-audit flags credentialed wildcards, null and missing Vary', () => {
  const C = (headers, origin = 'https://app.example.com') => findings(run('cors-config-audit', { origin, headers }));
  assert.deepEqual(C('Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true'), ['HIGH WILDCARD_CREDENTIALS']);
  assert.deepEqual(C('Access-Control-Allow-Origin: *'), ['INFO WILDCARD']);
  assert.deepEqual(C('Access-Control-Allow-Origin: null\nAccess-Control-Allow-Credentials: true', 'null'), ['CRITICAL NULL_ORIGIN']);
  assert.deepEqual(C('Access-Control-Allow-Origin: null'), ['HIGH NULL_ORIGIN']);
  assert.deepEqual(C('Content-Type: text/html'), ['INFO NO_CORS']);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://app.example.com\nVary: Origin'), []);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://app.example.com'), ['MEDIUM VARY_MISSING']);
  assert.deepEqual(C('access-control-allow-origin: https://app.example.com\nvary: Accept-Encoding, ORIGIN'), []); // header names and Vary tokens case-insensitive
  assert.deepEqual(C('Access-Control-Allow-Origin: https://app.example.com\nVary: *'), []);
  assert.deepEqual(C('Access-Control-Allow-Origin: http://app.example.com\nVary: Origin', 'http://app.example.com'), ['MEDIUM HTTP_ORIGIN']);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://a.example, https://b.example\nVary: Origin'), ['HIGH ACAO_MULTIPLE']);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://*.example.com\nVary: Origin', 'https://x.example.com'), ['MEDIUM PARTIAL_WILDCARD', 'INFO ORIGIN_MISMATCH']);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://other.example\nVary: Origin'), ['INFO ORIGIN_MISMATCH']);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://app.example.com\nVary: Origin\nAccess-Control-Allow-Credentials: yes'), ['WARN CREDENTIALS_VALUE']);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://app.example.com\nVary: Origin\nAccess-Control-Max-Age: 86401'), ['INFO MAXAGE_CAPPED']);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://app.example.com\nVary: Origin\nAccess-Control-Max-Age: 86400'), []);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://app.example.com\nVary: Origin\nAccess-Control-Max-Age: soon'), ['WARN MAXAGE_INVALID']);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://app.example.com\nVary: Origin\nAccess-Control-Allow-Credentials: true\nAccess-Control-Allow-Methods: GET, PATCH'),
    ['LOW STATE_CHANGING_METHODS', 'INFO ORIGIN_ECHO']);
  assert.deepEqual(C('Access-Control-Allow-Origin: https://app.example.com\nVary: Origin\nAccess-Control-Allow-Methods: DELETE'), []); // no credentials -> not flagged
});

test('http-smuggling-lint finds RFC 9112 framing ambiguities; body length matches Python', () => {
  const L = (req) => findings(run('http-smuggling-lint', { request: req }));
  const CRLF = '\r\n';
  const req = (hs, body = '') => 'POST / HTTP/1.1' + CRLF + 'Host: x' + CRLF + hs.map(h => h + CRLF).join('') + CRLF + body;
  assert.deepEqual(L(req(['Content-Length: 3'], 'abc')), []);
  assert.deepEqual(L(req(['Content-Length: 3', 'Transfer-Encoding: chunked'], '0' + CRLF + CRLF)), ['CRITICAL CL_AND_TE']);
  assert.deepEqual(L(req(['Content-Length: 3', 'Content-Length: 4'], 'abcd')), ['CRITICAL DUPLICATE_CL']);
  assert.deepEqual(L(req(['Content-Length: 3', 'Content-Length: 3'], 'abc')), ['MEDIUM DUPLICATE_CL']);
  assert.deepEqual(L(req(['Transfer-Encoding: chunked'], '0' + CRLF + CRLF)), []);
  assert.deepEqual(L(req(['Transfer-Encoding: xchunked'], '0' + CRLF + CRLF)), ['HIGH TE_OBFUSCATED']);
  assert.deepEqual(L(req(['Transfer-Encoding: chunked, identity'], '0' + CRLF + CRLF)), ['HIGH TE_CHUNKED_NOT_LAST']);
  assert.deepEqual(L(req(['Transfer-Encoding: gzip, chunked'], '0' + CRLF + CRLF)), ['MEDIUM TE_LIST']);
  assert.deepEqual(L(req(['Transfer-Encoding: gzip'], 'x')), ['MEDIUM TE_NO_CHUNKED']);
  assert.deepEqual(L(req(['Transfer-Encoding : chunked'], '0' + CRLF + CRLF)), ['HIGH SPACE_BEFORE_COLON']);
  assert.deepEqual(L(req(['Content-Length : 3'], 'abc')), ['HIGH SPACE_BEFORE_COLON']);
  assert.deepEqual(L(req(['Content-Length: +3'], 'abc')), ['HIGH CL_INVALID']);
  assert.deepEqual(L(req(['Content-Length: 3, 3'], 'abc')), ['HIGH CL_INVALID']);
  assert.deepEqual(L(req(['Content-Length: -1'], '')), ['HIGH CL_INVALID']);
  assert.deepEqual(L(req(['Transfer_Encoding: chunked', 'Content-Length: 3'], 'abc')), ['HIGH TE_NAME_VARIANT']);
  assert.deepEqual(L(req(['Content-Length: 5'], 'abc')), ['MEDIUM BODY_SHORTER']);
  assert.deepEqual(L(req(['Content-Length: 2'], 'abc')), ['HIGH BODY_LONGER']);
  assert.deepEqual(L(req(['Transfer-Encoding: chunked'], '5;ext=1' + CRLF + 'hello' + CRLF + '0' + CRLF + CRLF)), ['LOW CHUNK_EXTENSION']);
  assert.deepEqual(L(req(['Transfer-Encoding: chunked'], '5' + CRLF + 'hello' + CRLF)), ['MEDIUM CHUNK_TERMINATOR']);
  assert.deepEqual(L('GET / HTTP/1.1\nHost: x\n\n'), ['MEDIUM BARE_LF']);
  assert.deepEqual(L('GET / HTTP/1.1\r\nHost: x\r\n folded\r\n\r\n'), ['HIGH OBS_FOLD']);
  assert.deepEqual(L('GET / HTTP/1.1\r\nHost x\r\n\r\n'), ['HIGH HEADER_SYNTAX', 'MEDIUM NO_HOST']);
  assert.deepEqual(L('GET / HTTP/1.1\r\nAccept: */*\r\n\r\n'), ['MEDIUM NO_HOST']);
  assert.deepEqual(L('POST / HTTP/1.0\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n'), ['MEDIUM TE_IN_HTTP10']);
  assert.deepEqual(L('nonsense\r\nHost: x\r\n\r\n'), ['HIGH REQUEST_LINE']);
  for (const { b, n } of WEB.bodies) assert.deepEqual(L(req(['Content-Length: ' + n], b)), [], 'body ' + JSON.stringify(b));
  for (const { b, n } of WEB.bodies.filter(x => x.n > 0)) assert.deepEqual(L(req(['Content-Length: ' + (n - 1)], b)), ['HIGH BODY_LONGER'], 'body+1 ' + JSON.stringify(b));
  assert.throws(() => run('http-smuggling-lint', { request: '  ' }), /Paste a raw/);
});

const ZONES = JSON.parse(await readFile(new URL('./fixtures/dnspython-zones.json', import.meta.url), 'utf8'));
const zfind = (o) => [...o.matchAll(/^\[(\w+)\] (.*)$/gm)].map(m => m[1] + ' ' + m[2]);

test('dns-zone-audit records match dnspython for every record of three zone files', () => {
  for (const z of ZONES) {
    const o = run('dns-zone-audit', { origin: z.origin, zone: z.zone });
    const got = o.split('\nRecords:\n')[1].split('\n\nFindings:')[0].split('\n').map(l => l.toLowerCase().replace(/ (txt) /, ' $1 ')).sort();
    assert.deepEqual(got, z.expected.map(l => l.toLowerCase()), z.origin);
    assert.match(o, new RegExp('Records: ' + z.expected.length + '\\n'));
  }
});

test('dns-zone-audit findings and errors', () => {
  const Z = (zone, origin = 'example.com') => run('dns-zone-audit', { origin, zone });
  const head = '$TTL 3600\n@ IN SOA ns1.example.com. h.example.com. 2026112201 7200 3600 1209600 3600\n@ IN NS ns1.example.com.\n@ IN NS ns2.example.com.\n@ TXT "v=spf1 -all"\n@ CAA 0 issue "ca.example"\n';
  assert.match(Z(head), /Findings: 0/);
  assert.deepEqual(zfind(Z(head + 'www CNAME @\nwww A 192.0.2.1')), ['HIGH www.example.com. has a CNAME together with other record types (A); a CNAME must be the only data at a name (RFC 1034/2181).']);
  assert.match(Z(head + '@ CNAME other.example.net.'), /\[HIGH\] example\.com\. has a CNAME together with other record types/);
  assert.match(Z(head + 'a CNAME x.example.net.\na CNAME y.example.net.'), /a\.example\.com\. has 2 CNAME records/);
  assert.match(Z(head + 'alias CNAME t.example.net.\n@ MX 10 alias'), /MX record at example\.com\. points to alias\.example\.com\., which is a CNAME/);
  assert.match(Z(head + 'alias CNAME t.example.net.\n@ NS alias'), /NS record at example\.com\. points to alias\.example\.com\., which is a CNAME/);
  assert.match(Z(head.replace(/@ IN NS ns2[^\n]*\n/, '')), /apex has 1 NS record/);
  assert.match(Z(head.replace(/@ IN SOA[^\n]*\n/, '')), /no SOA record/);
  assert.match(Z(head.replace('2026112201', '5')), /SOA serial 5 is not in YYYYMMDDnn/);
  assert.match(Z(head.replace('@ TXT "v=spf1 -all"\n', '')), /no SPF TXT record/);
  assert.match(Z(head.replace('@ CAA 0 issue "ca.example"\n', '')), /no CAA record/);
  assert.match(Z(head + '*.x A 192.0.2.5'), /wildcard record \*\.x\.example\.com\./);
  assert.match(Z(head + 'q 30 A 192.0.2.5'), /TTL 30 \(under 60 seconds\)/);
  assert.match(Z(head + 'q 604801 A 192.0.2.5'), /TTL 604801 \(over 7 days\)/);
  assert.doesNotMatch(Z(head + 'q 604800 A 192.0.2.5'), /over 7 days/);
  assert.doesNotMatch(Z(head + 'q 60 A 192.0.2.5'), /under 60/);
  assert.match(Z(head + 'q A 192.0.2.5\nq A 192.0.2.5'), /duplicate record q\.example\.com\. A 192\.0\.2\.5/);
  assert.throws(() => Z('@ IN A 192.0.2.1'), /No TTL/);
  assert.throws(() => Z('$TTL 5\n@ A 300.1.1.1'), /Invalid A record/);
  assert.throws(() => Z('$TTL 5\n@ A 192.0.2.256'), /Invalid A record/);
  assert.throws(() => Z('$TTL 5\n@ FOO bar'), /Unsupported or missing record type "FOO"/);
  assert.throws(() => Z('$TTL 5\n@ TXT "open'), /Unterminated quoted/);
  assert.throws(() => Z('$TTL 5\n@ SOA a b ( 1 2 3'), /Unbalanced \(/);
  assert.throws(() => Z('$TTL 5\n@ MX x y'), /Invalid MX/);
  assert.throws(() => Z('$TTL abc'), /Invalid \$TTL/);
  assert.throws(() => Z('$TTL 5\n@ A 1.1.1.1', 'bad domain!'), /Origin must be/);
});

const CIDR = JSON.parse(await readFile(new URL('./fixtures/cidr-python-fuzz.json', import.meta.url), 'utf8'));
const cidrOut = (o) => o.split('\n\n')[1] === '(empty: everything was excluded)' ? [] : o.split('\n\n')[1].split('\n');

test('cidr-aggregate equals Python ipaddress (collapse_addresses / address_exclude) on 310 cases', () => {
  assert.equal(CIDR.length, 310);
  for (const c of CIDR) {
    const o = run('cidr-aggregate', { list: c.list.join('\n'), exclude: c.ex.join(', ') });
    assert.deepEqual(cidrOut(o), c.out, JSON.stringify(c.list) + ' minus ' + JSON.stringify(c.ex));
    assert.match(o, new RegExp('Resulting blocks: ' + c.out.length + '\\n'));
  }
});

test('cidr-aggregate input validation', () => {
  const A = (list, exclude = '') => run('cidr-aggregate', { list, exclude });
  for (const bad of ['10.0.0.256', '10.0.0.0/33', '1.2.3', '::g', '1::2::3', '1:2:3:4:5:6:7:8:9', ':::', '10.0.0.01', 'abc', '2001:db8::/129', '1.2.3.4/'])
    assert.throws(() => A(bad), /Invalid|too long/, bad);
  assert.throws(() => A('  '), /at least one/);
  assert.throws(() => A('10.0.0.1', 'zzz'), /Invalid/);
  assert.match(A('1:2:3:4:5:6:7:8'), /1:2:3:4:5:6:7:8\/128/);
  assert.match(A('2001:db8:0:1:1:1:1:1'), /2001:db8:0:1:1:1:1:1\/128/); // a single zero group is not compressed (RFC 5952)
  assert.match(A('2001:db8:0:0:1:0:0:1'), /2001:db8::1:0:0:1\/128/); // RFC 5952: compress the leftmost longest zero run
});

const SSHK = JSON.parse(await readFile(new URL('./fixtures/sshkeys-cryptography.json', import.meta.url), 'utf8'));
const akOut = (text) => run('authorized-keys-audit', { text });
const akKeys = (o) => [...o.matchAll(/^line (\d+): (\S+) (\d+) bits/gm)].map(m => [+m[1], m[2], +m[3]]);
const akFind = (o) => [...o.matchAll(/^\[(\w+)\] line (\d+): /gm)].map(m => m[1] + '@' + m[2]);

test('authorized-keys-audit reads real keys generated by Python cryptography (type and size)', () => {
  for (const [name, k] of Object.entries(SSHK)) {
    assert.deepEqual(akKeys(akOut(k.line + ' me@x')), [[1, k.type, k.bits]], name);
  }
  assert.deepEqual(akFind(akOut(SSHK.rsa1024.line)).filter(x => x.startsWith('HIGH')), ['HIGH@1']);
  assert.deepEqual(akFind(akOut(SSHK.rsa2048.line)).filter(x => !x.startsWith('INFO')), []);
  assert.match(akOut(SSHK.rsa2047.line), /\[HIGH\] line 1: RSA key is only 2047 bits/); // odd bit lengths are measured exactly
  assert.match(akOut(SSHK.rsa3071.line), /\[INFO\] line 1: RSA 3071 bits meets/);
  assert.match(akOut(SSHK.rsa2048.line), /RSA 2048 bits meets/);
  assert.doesNotMatch(akOut(SSHK.rsa3072.line), /RSA \d+ bits/);
  assert.match(akOut(SSHK.dsa1024.line), /\[HIGH\] line 1: DSA keys are disabled/);
  assert.deepEqual(akFind(akOut(SSHK.ed25519.line)), ['INFO@1']); // only "no options"
});

test('authorized-keys-audit options, duplicates, errors', () => {
  const ed = SSHK.ed25519.line, ec = SSHK.ecdsa256.line;
  let o = akOut('restrict,from="10.0.0.0/8,192.168.0.0/16",command="echo a b" ' + ed + ' bk host');
  assert.deepEqual(akFind(o), []); assert.match(o, /comment=bk host/); assert.match(o, /options=restrict,from="10\.0\.0\.0\/8,192\.168\.0\.0\/16",command="echo a b"/);
  assert.deepEqual(akFind(akOut('no-pty ' + ed)), ['INFO@1']); // options without restrict/from/command
  assert.match(akOut('no-pty ' + ed), /no restrict, from= or command=/);
  assert.deepEqual(akFind(akOut('from="*" ' + ed)), ['MEDIUM@1']);
  assert.deepEqual(akFind(akOut('restrict,environment="A=b" ' + ed)).sort(), ['MEDIUM@1']);
  assert.deepEqual(akFind(akOut('cert-authority,restrict ' + ed)), ['INFO@1']);
  assert.deepEqual(akFind(akOut(ed + '\n' + ec + '\n# c\n\n' + ed)).sort(), ['INFO@1', 'INFO@2', 'INFO@5', 'WARN@5']);
  assert.match(akOut(ed + '\n' + ed), /duplicate of the key on line 1/);
  // declared type disagrees with blob
  assert.match(akOut(ed.replace('ssh-ed25519', 'ssh-rsa')), /\[ERROR\] line 1: declared type ssh-rsa does not match the key blob \(ssh-ed25519\)/);
  assert.match(akOut(ec.replace('ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384')), /\[ERROR\] line 1: declared type/);
  assert.match(akOut('no-pty extra ' + ed), /no recognised key type/); // at most one options token before the key type
  const be0 = (...parts) => Buffer.concat(parts.map(p => { const b = Buffer.from(p); const l = Buffer.alloc(4); l.writeUInt32BE(b.length); return Buffer.concat([l, b]); }));
  assert.match(akOut('ecdsa-sha2-nistp256 ' + be0('ecdsa-sha2-nistp256', 'nistp384', Buffer.alloc(65, 4)).toString('base64')), /curve nistp384 does not match ecdsa-sha2-nistp256/);
  assert.match(akOut('ssh-ed25519 !!!notbase64'), /not valid base64/);
  assert.match(akOut('ssh-ed25519 AAAA'), /truncated or malformed/);
  assert.match(akOut('ssh-rsa ' + SSHK.rsa2048.line.split(' ')[1].slice(0, 60)), /truncated or malformed/);
  assert.match(akOut('hello world'), /no recognised key type/);
  const be = (...parts) => Buffer.concat(parts.map(p => { const b = Buffer.from(p); const l = Buffer.alloc(4); l.writeUInt32BE(b.length); return Buffer.concat([l, b]); }));
  assert.match(akOut('ssh-ed25519 ' + be('ssh-ed25519', Buffer.alloc(31)).toString('base64')), /must be 32 bytes \(found 31\)/);
  assert.match(akOut('ssh-ed25519 ' + be('ssh-ed25519', Buffer.alloc(32, 7)).toString('base64')), /ssh-ed25519 256 bits/);
  assert.throws(() => akOut('# nothing\n'), /No keys found/);
});
