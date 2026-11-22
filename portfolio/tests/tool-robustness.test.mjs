// Robustness gate for EVERY tool in the catalog (applies to future tools automatically): hostile inputs must never produce an
// internal error (TypeError/ReferenceError text), non-string output, NaN/[object Object] in results, or a hang.
// Tools that need browser-only APIs (fetch, Worker, DOMParser, File) are exercised in the browser sweep instead, not here.
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
const tools = vm.runInNewContext(`(()=>{${source.slice(hs, he)}\nconst r=${source.slice(a, b + 2)};r.forEach(withValidatedInputs);return r;})()`, {
  crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, atob, btoa, URL, Date, Math, JSON, BigInt, Number, String, Array, Object, RegExp, Error, Set, Map,
  Intl, encodeURIComponent, decodeURIComponent, parseInt, parseFloat, isNaN, performance, Promise, AbortController, setTimeout, clearTimeout });

const BROWSER_ONLY = new Set(['public-ip', 'speed', 'hash-file', 'xml', 'regex']);
const INTERNAL = /Cannot read|is not a function|is not defined|Invalid array length|Maximum call stack|Cannot convert|is not iterable|reading '|Unexpected token(?![\s\S]*not valid JSON)/;
const VARIANTS = {
  empty: () => '', blank: () => '   \n\t ', long: () => 'A1b2 '.repeat(8000), lines: () => 'a b c\n'.repeat(3000),
  junk: () => '¤§ 😀 مصطفى <script>alert(1)</script> ../../etc/passwd %00 ${x} {{7*7}} \\\\ "\'` ;|&$()',
  huge: () => '9'.repeat(400), negative: () => '-1', exp: () => '1e999',
};

test('every tool survives hostile inputs without internal errors, NaN output or hangs', async () => {
  assert.ok(tools.length >= 179);
  const problems = []; let runs = 0;
  for (const t of tools) {
    if (BROWSER_ONLY.has(t.id)) continue;
    for (const [name, make] of Object.entries(VARIANTS)) {
      const values = {};
      for (const [k, , def, type, opts] of (t.fields || [])) values[k] = type === 'select' ? (def || opts[0]) : make();
      const t0 = performance.now(); let out, err;
      try { out = await t.run(values); } catch (e) { err = e; }
      runs++;
      if (performance.now() - t0 > 3000) problems.push(`${t.id}/${name}: slow (${Math.round(performance.now() - t0)} ms)`);
      if (err) {
        if (!err || typeof err.message !== 'string') problems.push(`${t.id}/${name}: non-Error throw`);
        else if (INTERNAL.test(err.message)) problems.push(`${t.id}/${name}: internal error "${err.message.slice(0, 80)}"`);
      } else if (typeof out !== 'string' && !(out && typeof out === 'object')) problems.push(`${t.id}/${name}: returned ${typeof out}`);
      else if (typeof out === 'string' && /\bNaN\b|\[object Object\]|(?:^|[\s:=(])undefined(?:$|[\s,)])/.test(out) && name !== 'junk')
        problems.push(`${t.id}/${name}: bad value in output "${(out.match(/.{0,25}(NaN|\[object Object\]|undefined).{0,25}/) || [''])[0].replace(/\n/g, ' ')}"`);
    }
  }
  assert.ok(runs > 1000);
  assert.deepEqual(problems, []);
});

test('number fields reject Infinity, overflow and non-numeric text with a clear message', () => {
  const t = tools.find(x => x.id === 'transfer-time');
  for (const bad of ['9'.repeat(400), '1e999', 'Infinity', 'abc', '--5']) assert.throws(() => t.run({ size: bad, mbps: '100' }), /must be a finite number/, bad);
  assert.match(t.run({ size: '10', mbps: '100' }), /Ideal time: 0h 13m 20s/); // 10 GB at 100 Mbps = 800 s, independent arithmetic
  assert.match(t.run({ size: 10, mbps: 100 }), /Seconds: 800\.0/);
});
