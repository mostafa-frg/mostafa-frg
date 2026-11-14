import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = await readFile(new URL('../assets/platform.js', import.meta.url), 'utf8');
const registryStart = source.indexOf('const tools=') + 'const tools='.length;
const registryMarker = source.indexOf('\n];\nfunction rows', registryStart);
const helpersStart = source.indexOf('function rows(');
const helpersEnd = source.indexOf('const grid=', helpersStart);

assert.ok(registryStart >= 'const tools='.length, 'tool registry exists');
assert.ok(registryMarker > registryStart, 'tool registry closes before UI initialization');
assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, 'pure tool helpers exist');

const registryLiteral = source.slice(registryStart, registryMarker + 2);
const helpers = source.slice(helpersStart, helpersEnd);
const tools = vm.runInNewContext(`(()=>{ ${helpers}\n return ${registryLiteral}; })()`, {
  crypto: webcrypto,
  TextEncoder,
  Uint8Array,
  URL,
  URLSearchParams,
});
const byId = id => {
  const tool = tools.find(item => item.id === id);
  assert.ok(tool, `tool ${id} exists`);
  return tool;
};

test('tool registry has unique IDs and five declared domains', () => {
  const ids = tools.map(tool => tool.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(tools.length, 52);
  assert.deepEqual(
    [...new Set(tools.map(tool => tool.cat))].sort(),
    ['developer', 'linux', 'networking', 'security', 'soc'].sort(),
  );
  assert.equal(tools.filter(tool => tool.cat === 'networking').length, 16);
  assert.equal(tools.filter(tool => tool.cat === 'security').length, 13);
  assert.equal(tools.filter(tool => tool.cat === 'soc').length, 4);
  assert.equal(tools.filter(tool => tool.cat === 'linux').length, 8);
  assert.equal(tools.filter(tool => tool.cat === 'developer').length, 11);
});

test('IOC extractor normalizes defanged indicators and classifies hashes', () => {
  const hash = 'a'.repeat(64);
  const output = byId('ioc-extractor').run({
    data: `hxxps://evil[.]example/path bad[.]example 203.0.113.9 ${hash}`,
  });
  assert.match(output, /https:\/\/evil\.example\/path/);
  assert.match(output, /bad\.example/);
  assert.match(output, /203\.0\.113\.9/);
  assert.match(output, /SHA-256/);
  assert.match(output, /URLs \(1\)/);
});

test('SSH and PAM triage counts failed and successful authentication events', () => {
  const output = byId('auth-log-triage').run({
    log: [
      'Nov 15 10:15:22 host sshd[123]: Failed password for invalid user admin from 203.0.113.8 port 51022 ssh2',
      'Nov 15 10:16:02 host sshd[124]: Failed password for root from 203.0.113.8 port 51024 ssh2',
      'Nov 15 10:17:10 host sshd[130]: Accepted publickey for deploy from 192.0.2.15 port 51100 ssh2',
    ].join('\n'),
  });
  assert.match(output, /Parsed events: 3/);
  assert.match(output, /Failed \/ PAM failures: 2/);
  assert.match(output, /Successful logins: 1/);
  assert.match(output, /203\.0\.113\.8 — 2 event\(s\)/);
});

test('timeline sorter orders timestamps by absolute UTC time', () => {
  const output = byId('log-timeline').run({
    events: [
      '2026-11-15T10:02:00Z host-a authentication failed',
      '2026-11-15T09:58:00Z host-b service started',
      '2026-11-15T10:01:30+02:00 host-c alert raised',
    ].join('\n'),
  });
  assert.ok(output.indexOf('host-c alert raised') < output.indexOf('host-b service started'));
  assert.ok(output.indexOf('host-b service started') < output.indexOf('host-a authentication failed'));
  assert.match(output, /UNPARSED LINES \(0\)/);
});

test('Windows event reference returns investigation context for known IDs', () => {
  const output = byId('windows-event-reference').run({ eventId: '4625' });
  assert.match(output, /Failed logon/);
  assert.match(output, /password spraying or brute force/);
  assert.match(byId('windows-event-reference').run({ eventId: '999999' }), /not in this quick-reference list/);
});

test('SOC tools reject empty inputs instead of returning misleading results', () => {
  assert.throws(() => byId('ioc-extractor').run({ data: '  ' }), /Paste text/);
  assert.throws(() => byId('auth-log-triage').run({ log: '' }), /Paste authentication log/);
  assert.throws(() => byId('log-timeline').run({ events: '' }), /Paste log lines/);
});

test('CIDR overlap checker distinguishes containment and separate networks', () => {
  const contained = byId('cidr-overlap').run({ networkA: '10.10.0.0/16', networkB: '10.10.20.0/24' });
  assert.match(contained, /Overlap: YES/);
  assert.match(contained, /Network B is inside A/);
  const separate = byId('cidr-overlap').run({ networkA: '10.0.0.0/24', networkB: '10.0.1.0/24' });
  assert.match(separate, /Overlap: NO/);
});

test('URL triage reports obvious risk signals without fetching the URL', () => {
  const output = byId('url-risk-review').run({ url: 'http://user:pass@xn--bcher-kva.example:8080/path%40x' });
  assert.match(output, /does not use HTTPS/);
  assert.match(output, /embedded user information/);
  assert.match(output, /punycode/);
  assert.match(output, /non-standard destination port/);
});

test('OpenSSH configuration audit flags risky directives', () => {
  const output = byId('sshd-config-audit').run({
    config: 'PermitRootLogin yes\nPasswordAuthentication yes\nPermitEmptyPasswords no\nPubkeyAuthentication yes\nX11Forwarding yes\nMaxAuthTries 6',
  });
  assert.match(output, /permitrootlogin: yes \[RISK\]/i);
  assert.match(output, /passwordauthentication: yes \[RISK\]/i);
  assert.match(output, /x11forwarding: yes \[RISK\]/i);
  assert.match(output, /maxauthtries: 6 \[REVIEW\]/i);
});

test('query string builder safely encodes values and preserves duplicate keys', () => {
  const output = byId('query-string-builder').run({
    base: 'https://example.com/search',
    params: 'q=network security\ntag=linux\ntag=security',
  });
  assert.match(output, /q=network\+security/);
  assert.match(output, /tag=linux&tag=security/);
  assert.match(output, /Parameter count: 3/);
});
