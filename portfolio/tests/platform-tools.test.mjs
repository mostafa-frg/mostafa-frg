import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { TextDecoder } from 'node:util';

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
  TextDecoder,
  Uint8Array,
  atob,
  btoa,
  URL,
  URLSearchParams,
  fetch: async input => ({
    ok: true,
    status: 200,
    async json() {
      if (String(input).includes('ipify')) return { ip: '203.0.113.10' };
      if (String(input).includes('crt.sh')) return [{ id: 7, common_name: 'example.com', not_before: '2026-01-01', not_after: '2027-01-01' }];
      return { Status: 0, Answer: [{ name: 'example.com.', TTL: 300, data: '93.184.216.34' }] };
    },
    async text() { return 'Example Vendor'; },
    async arrayBuffer() { return new ArrayBuffer(64); },
  }),
  performance,
  document: { createElement() { let html = ''; return { set innerHTML(value) { html = value; }, get value() { return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); } }; } },
  DOMParser: class { parseFromString() { return { querySelector() { return null; } }; } },
  XMLSerializer: class { serializeToString() { return '<root><item>value</item></root>'; } },
});
const byId = id => {
  const tool = tools.find(item => item.id === id);
  assert.ok(tool, `tool ${id} exists`);
  return tool;
};

test('tool registry has unique IDs and five declared domains', () => {
  const ids = tools.map(tool => tool.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(tools.length, 102);
  assert.deepEqual(
    [...new Set(tools.map(tool => tool.cat))].sort(),
    ['developer', 'linux', 'networking', 'security', 'soc'].sort(),
  );
  assert.equal(tools.filter(tool => tool.cat === 'networking').length, 36);
  assert.equal(tools.filter(tool => tool.cat === 'security').length, 28);
  assert.equal(tools.filter(tool => tool.cat === 'soc').length, 6);
  assert.equal(tools.filter(tool => tool.cat === 'linux').length, 15);
  assert.equal(tools.filter(tool => tool.cat === 'developer').length, 17);
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
  const duplicate = byId('sshd-config-audit').run({ config: 'PermitRootLogin no\nPermitRootLogin yes' });
  assert.match(duplicate, /permitrootlogin: no \[OK\]/i);
  assert.match(duplicate, /duplicate directives: permitrootlogin/i);
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


test('every registered utility has a unique ID, description, category and executable handler', () => {
  assert.equal(tools.length, 102);
  for (const tool of tools) {
    assert.match(tool.id, /^[a-z0-9-]+$/);
    assert.ok(tool.name && tool.name.length >= 5, tool.id + ' has a useful name');
    assert.ok(tool.desc && tool.desc.length >= 35, tool.id + ' has a task description');
    assert.ok(['networking','security','soc','linux','developer'].includes(tool.cat));
    assert.equal(typeof tool.run, 'function', tool.id + ' has a run handler');
    const fieldNames = (tool.fields || []).map(field => field[0]);
    assert.equal(new Set(fieldNames).size, fieldNames.length, tool.id + ' has unique input names');
  }
});

test('Cisco wildcard matcher handles subnet and non-contiguous wildcard masks', () => {
  const match = byId('acl-match').run({network:'192.168.10.0',wildcard:'0.0.0.255',host:'192.168.10.25'});
  assert.match(match,/PERMIT MATCH/);
  assert.match(match,/192\.168\.10\.0/);
  const noMatch = byId('acl-match').run({network:'192.168.10.0',wildcard:'0.0.0.255',host:'192.168.11.25'});
  assert.match(noMatch,/NO MATCH/);
  const nonContiguous = byId('acl-match').run({network:'10.0.0.0',wildcard:'0.255.0.255',host:'10.22.0.9'});
  assert.match(nonContiguous,/Non-contiguous/);
  assert.throws(()=>byId('acl-match').run({network:'10.0.0.0',wildcard:'0.0.0.0',host:'999.1.1.1'}),/valid IPv4/);
});

test('web access log analyzer groups status codes and detects suspicious paths', () => {
  const output = byId('access-log-analyzer').run({log:[
    '203.0.113.10 - - [15/Nov/2026:10:15:22 +0000] "GET /.env HTTP/1.1" 404 232',
    '192.0.2.15 - - [15/Nov/2026:10:16:02 +0000] "POST /login HTTP/1.1" 401 512',
    '203.0.113.10 - - [15/Nov/2026:10:17:10 +0000] "GET /wp-login.php HTTP/1.1" 404 232',
  ].join('\n')});
  assert.match(output,/Parsed requests: 3/);
  assert.match(output,/4xx responses: 3/);
  assert.match(output,/Suspicious-path matches: 2/);
  assert.match(output,/203\.0\.113\.10 — 2/);
  assert.throws(()=>byId('access-log-analyzer').run({log:'not an access log'}),/No supported/);
});

test('firewall reviewer identifies exposed management ports and broad inbound policy', () => {
  const output = byId('firewall-review').run({rules:[
    '*filter',
    ':INPUT ACCEPT [0:0]',
    '-A INPUT -p tcp --dport 22 -j ACCEPT',
    '-A INPUT -p tcp --dport 3389 -j ACCEPT',
    'COMMIT',
  ].join('\n')});
  assert.match(output,/INPUT chain default policy is ACCEPT/);
  assert.match(output,/port 22/);
  assert.match(output,/port 3389/);
  const ufw = byId('firewall-review').run({rules:'22/tcp ALLOW Anywhere'});
  assert.match(ufw,/UFW allows 22\/tcp/);
});

test('Dockerfile review flags root, mutable images, secret metadata and unsafe shell pipes', () => {
  const output = byId('dockerfile-audit').run({dockerfile:[
    'FROM ubuntu:latest',
    'ARG API_TOKEN',
    'RUN apt-get update && apt-get install -y curl',
    'ADD . /app',
    'RUN curl https://example.com/install.sh | sh',
  ].join('\n')});
  assert.match(output,/uses :latest/);
  assert.match(output,/No USER instruction/);
  assert.match(output,/Possible secret declared/);
  assert.match(output,/piped directly to a shell/);
  assert.match(output,/ADD at line/);
  assert.throws(()=>byId('dockerfile-audit').run({dockerfile:'   '}),/Paste Dockerfile/);
});


test('IPv4 analyzer classifies common special-purpose ranges instead of calling them public', () => {
  assert.match(byId('ip-analyze').run({ip:'203.0.113.8'}), /Documentation range \(TEST-NET-3\)/);
  assert.match(byId('ip-analyze').run({ip:'198.18.0.1'}), /Benchmarking range/);
  assert.match(byId('ip-analyze').run({ip:'100.64.0.1'}), /CGNAT/);
  assert.match(byId('ip-analyze').run({ip:'192.168.1.1'}), /Private-use address/);
  assert.match(byId('ip-analyze').run({ip:'255.255.255.255'}), /Limited broadcast/);
  assert.match(byId('ip-analyze').run({ip:'8.8.8.8'}), /Public or globally routable candidate/);
});

test('CSV converter supports escaped quotes, commas, multiline fields and UTF-8 BOM', () => {
  const output = JSON.parse(byId('csv-json').run({
    csv: '\uFEFFname,notes\r\nAlice,"line one, with comma\nline two"\r\nBob,"said ""hello"""',
  }));
  assert.deepEqual(output, [
    {name:'Alice',notes:'line one, with comma\nline two'},
    {name:'Bob',notes:'said "hello"'},
  ]);
  assert.throws(() => byId('csv-json').run({csv:'name,notes\nAlice,"unfinished'}), /Unclosed quoted field/);
});
test('password generator guarantees selected character classes and requested length', () => {
  const password = byId('password').run({length:'32',symbols:'yes'});
  assert.equal(password.split('\n')[0].length,32);
  const value = password.split('\n')[0];
  assert.match(value,/[a-z]/);
  assert.match(value,/[A-Z]/);
  assert.match(value,/[2-9]/);
  assert.match(value,/[!@#$%^&*()\-_=\+\[\]{}?]/);
  const noSymbols = byId('password').run({length:'24',symbols:'no'}).split('\n')[0];
  assert.equal(noSymbols.length,24);
  assert.doesNotMatch(noSymbols,/[^a-zA-Z0-9]/);
});

test('Dockerfile audit evaluates the final stage rather than earlier build stages', () => {
  const unsafe = byId('dockerfile-audit').run({dockerfile:[
    'FROM node:20 AS build',
    'USER node',
    'RUN npm ci',
    'FROM scratch',
    'COPY --from=build /app /app',
    'ENTRYPOINT ["/app"]',
  ].join('\n')});
  assert.match(unsafe,/No USER instruction found in the final build stage/);
  const hardened = byId('dockerfile-audit').run({dockerfile:[
    'FROM node:20 AS build',
    'USER node',
    'RUN npm ci',
    'FROM scratch',
    'COPY --from=build /app /app',
    'USER 65532:65532',
    'ENTRYPOINT ["/app"]',
  ].join('\n')});
  assert.doesNotMatch(hardened,/final build stage may run as root/);
  assert.doesNotMatch(hardened,/Base image is unpinned/);
});


test('Base64 encoder and decoder preserve UTF-8 text and reject malformed input', () => {
  const input = 'MOSTA — الشبكات والأمن 🔐';
  const encoded = byId('base64').run({ text: input, mode: 'encode' });
  assert.match(encoded,/^[A-Za-z0-9+/]+={0,2}$/);
  assert.equal(byId('base64').run({ text: encoded, mode: 'decode' }),input);
  assert.throws(()=>byId('base64').run({text:'%%%not-base64%%%',mode:'decode'}),/Base64/);
});

test('chmod calculator preserves setuid, setgid and sticky permission bits', () => {
  const setuid = byId('chmod').run({mode:'4755'});
  assert.match(setuid,/Symbolic: rwsr-xr-x/);
  assert.match(setuid,/Special bits: setuid/);
  const sticky = byId('chmod').run({mode:'1777'});
  assert.match(sticky,/Symbolic: rwxrwxrwt/);
  assert.match(sticky,/Special bits: sticky/);
  const regular = byId('chmod').run({mode:'0644'});
  assert.match(regular,/Symbolic: rw-r--r--/);
  assert.match(regular,/Special bits: none/);
});


test('all browser-independent tools execute with representative inputs', async () => {
  const overrides = {
    hmac: { key: 'ci-test-key', message: 'MOSTA test message' },
    strength: { password: 'CorrectHorseBatteryStaple!42' },
    'hash-text': { text: 'MOSTA regression test' },
    jwt: { token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature' },
    config: { config: 'enable secret test\ntransport input ssh\nlogin local' },
    'ioc-extractor': { data: 'hxxps://evil[.]example/path bad[.]example 203.0.113.9 ' + 'a'.repeat(64) },
    'hash-file': { file: { name: 'sample.txt', size: 3, async arrayBuffer() { return new Uint8Array([1,2,3]).buffer; } } },
  };
  const browserWorkerOnly = new Set(['regex']);
  for (const tool of tools) {
    if (browserWorkerOnly.has(tool.id)) continue;
    const values = Object.fromEntries((tool.fields || []).map(field => [
      field[0],
      field[3] === 'file' ? { name: 'sample.txt', size: 3, async arrayBuffer() { return new Uint8Array([1,2,3]).buffer; } } : (field[2] ?? ''),
    ]));
    Object.assign(values, overrides[tool.id] || {});
    const output = await tool.run(values);
    assert.notEqual(output, undefined, tool.id + ' returned undefined');
    assert.notEqual(output, null, tool.id + ' returned null');
  }
});

test('converter and calculator tools added in platform-v2 return correct results', async () => {
  const r = (id, v) => byId(id).run(v);
  assert.match(await r('base-convert', { value: 'ff', from: '16' }), /Decimal: 255/);
  await assert.rejects(async () => r('base-convert', { value: '12z', from: '10' }));
  assert.equal(await r('text-hex', { text: 'Hi', mode: 'text to hex' }), '48 69');
  assert.equal(await r('text-hex', { text: '48 69', mode: 'hex to text' }), 'Hi');
  assert.match(await r('color', { hex: '#0ea5e9' }), /rgb\(14, 165, 233\)/);
  assert.match(await r('transfer-time', { size: '10', mbps: '100' }), /13m 20s/);
  assert.match(await r('bdp', { mbps: '1000', rtt: '40' }), /5000000/);
  assert.match(await r('mtu-mss', { mtu: '1500', ver: 'IPv4' }), /TCP MSS: 1460/);
  assert.match(await r('entropy', { text: 'aabb' }), /1\.000/);
  assert.match(await r('hash-id', { hash: '5d41402abc4b2a76b9719d911017c592' }), /MD5/);
  assert.match(await r('umask', { umask: '022' }), /0644/);
  assert.match(await r('http-status', { code: '404' }), /Not Found/);
});

test('Nmap, Wireshark, Termux, Kali and OSINT helper tools validate input and build output', async () => {
  const r = (id, v) => byId(id).run(v);
  const d = Object.fromEntries(byId('nmap-builder').fields.map(f => [f[0], f[2]]));
  assert.match(await r('nmap-builder', d), /^nmap -sn -T3 -oN scan\.txt 192\.168\.1\.0\/24/);
  assert.throws(() => byId('nmap-builder').run({ ...d, target: 'x; rm -rf /' }), /Target/);
  assert.throws(() => byId('nmap-builder').run({ ...d, target: '-iL /etc/passwd' }), /Target/);
  assert.throws(() => byId('nmap-builder').run({ ...d, ports: '1;2' }), /Ports/);
  const np = byId('nmap-parser').fields[0][2];
  assert.match(await r('nmap-parser', { out: np }), /Open: 2/);
  assert.match(await r('wireshark-filter', { proto: 'tcp', host: '192.168.1.10', port: '443' }), /ip\.addr == 192\.168\.1\.10 && tcp\.port == 443/);
  assert.throws(() => byId('wireshark-filter').run({ proto: 'dns', host: '', port: '53' }), /Port applies/);
  assert.match(await r('tshark-builder', { iface: 'eth0', filter: 'tcp port 443', count: '10', file: 'a.pcapng' }), /tshark -i eth0 -f "tcp port 443" -c 10 -w a\.pcapng/);
  assert.throws(() => byId('tshark-builder').run({ iface: 'eth0', filter: 'a"; id', count: '10', file: 'a.pcapng' }), /Filter/);
  assert.throws(() => byId('tshark-builder').run({ iface: 'eth0', filter: '', count: '10', file: '../x.pcapng' }), /Output/);
  assert.match(await r('termux-setup', { profile: 'Networking tools' }), /pkg install -y nmap/);
  assert.match(await r('kali-reference', { q: 'packet' }), /wireshark/);
  assert.match(await r('osint-domain', { domain: 'example.com' }), /site:example\.com/);
  const eh = await r('email-header', { h: byId('email-header').fields[0][2] });
  assert.match(eh, /Reply-To domain differs/);
  assert.match(eh, /dkim=fail/);
});

test('security-output analyzers and Termux guides parse samples correctly', async () => {
  const d = id => byId(id).fields[0][2];
  const r = (id, v) => byId(id).run(v);
  const tc = await r('tcpdump-analyzer', { out: d('tcpdump-analyzer') });
  assert.match(tc, /Packets parsed: 3/); assert.match(tc, /192\.168\.1\.5  \(2\)/); assert.match(tc, /\b443  \(1\)/);
  assert.throws(() => byId('tcpdump-analyzer').run({ out: 'nothing' }), /No/);
  const ss = await r('socket-analyzer', { out: d('socket-analyzer') });
  assert.match(ss, /MySQL exposed/); assert.match(ss, /sensitive exposed: 1/); assert.doesNotMatch(ss, /631.*exposed/);
  const ly = await r('lynis-parser', { out: d('lynis-parser') });
  assert.match(ly, /Hardening index: 62/); assert.match(ly, /Warnings: 1/); assert.match(ly, /Suggestions: 2/);
  assert.match(await r('tls-output-analyzer', { out: d('tls-output-analyzer') }), /Findings: none/);
  const bad = await r('tls-output-analyzer', { out: 'Protocol version: TLSv1\nCiphersuite: RC4-MD5\nVerification error: certificate has expired\nnotAfter=Jan  1 00:00:00 2020 GMT' });
  assert.match(bad, /Deprecated protocol/); assert.match(bad, /Weak cipher/); assert.match(bad, /expired/);
  assert.match(await r('termux-guide', { topic: 'SSH server' }), /sshd/);
  assert.match(await r('termux-api', { action: 'Battery status' }), /termux-battery-status/);
  assert.throws(() => byId('termux-api').run({ action: 'x' }), /Choose/);
});

test('professional calculators: VLSM, IPv6, CVSS 3.1, SPF/DMARC, ufw, ssh-keygen', async () => {
  const r = (id, v) => byId(id).run(v);
  const vl = await r('vlsm', { base: '192.168.10.0/24', hosts: '2,100,20,50' });
  assert.match(vl, /100 hosts -> 192\.168\.10\.0\/25/); assert.match(vl, /50 hosts -> 192\.168\.10\.128\/26/);
  assert.match(vl, /20 hosts -> 192\.168\.10\.192\/27/); assert.match(vl, /2 hosts -> 192\.168\.10\.224\/30/);
  assert.throws(() => byId('vlsm').run({ base: '192.168.10.0/24', hosts: '200,100' }), /too small/);
  const v6 = await r('ipv6-subnet', { addr: '2001:db8::1', prefix: '32' });
  assert.match(v6, /Network: 2001:db8::\/32/); assert.match(v6, /4294967296/);
  assert.throws(() => byId('ipv6-subnet').run({ addr: '2001:::1', prefix: '32' }), /valid IPv6/);
  const cv = (vec) => r('cvss', { vec });
  assert.match(await cv('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'), /Base score: 9\.8/);
  assert.match(await cv('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H'), /Base score: 10\.0/);
  assert.match(await cv('CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H'), /Base score: 7\.8/);
  assert.match(await cv('CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N'), /Base score: 6\.1/);
  assert.match(await cv('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N'), /Severity: None/);
  assert.throws(() => byId('cvss').run({ vec: 'CVSS:3.1/AV:N' }), /Missing/);
  assert.match(await r('spf-dmarc', { type: 'SPF', rec: 'v=spf1 +all' }), /dangerous/);
  assert.match(await r('spf-dmarc', { type: 'DMARC', rec: 'v=DMARC1; p=none' }), /monitor-only/);
  assert.match(await r('ufw-builder', { action: 'allow', port: '22', proto: 'tcp', src: '192.168.1.0/24' }), /ufw allow from 192\.168\.1\.0\/24 to any port 22 proto tcp/);
  assert.throws(() => byId('ufw-builder').run({ action: 'allow', port: '22', proto: 'tcp', src: '1.2.3.4; rm' }), /IPv4/);
  assert.match(await r('ssh-keygen', { type: 'ed25519', comment: 'a@b', file: 'k' }), /ssh-keygen -t ed25519 -a 100 -C "a@b" -f ~\/\.ssh\/k/);
  assert.throws(() => byId('ssh-keygen').run({ type: 'ed25519', comment: 'x"; id', file: 'k' }), /Comment/);
});

test('route summary, throughput, converters, command builders, TTL and ATT&CK lookup', async () => {
  const r = (id, v) => byId(id).run(v);
  const rs = await r('route-summary', { nets: '192.168.0.0/24\n192.168.1.0/24\n192.168.2.0/24\n192.168.3.0/24' });
  assert.match(rs, /Summary route: 192\.168\.0\.0\/22/); assert.match(rs, /Exact summary: yes/);
  const rs2 = await r('route-summary', { nets: '10.0.0.0/24, 10.0.2.0/24' });
  assert.match(rs2, /10\.0\.0\.0\/22/); assert.match(rs2, /Extra addresses: 512/);
  assert.match(await r('tcp-throughput', { mss: '1460', rtt: '50', loss: '0.1' }), /9\.01 Mbit\/s/);
  assert.throws(() => byId('tcp-throughput').run({ mss: '1460', rtt: '50', loss: '0' }), /loss/);
  assert.match(await r('bandwidth-convert', { value: '100', unit: 'Mbit/s' }), /MB\/s: 12\.5/);
  assert.match(await r('tcpdump-builder', { iface: 'eth0', filter: 'port 53', count: '10', mode: 'write pcap file', file: 'a.pcap' }), /^sudo tcpdump -i eth0 -nn -c 10 -w a\.pcap 'port 53'/);
  assert.throws(() => byId('tcpdump-builder').run({ iface: 'eth0', filter: "x'; id", count: '1', mode: 'print to screen', file: 'a.pcap' }), /Filter/);
  assert.equal(await r('dig-builder', { name: 'example.com', type: 'MX', server: '1.1.1.1', mode: 'short answer' }), 'dig @1.1.1.1 example.com MX +short');
  assert.throws(() => byId('dig-builder').run({ name: 'a.com; id', type: 'A', server: 'system default', mode: 'short answer' }), /domain/);
  const tt = await r('ttl-guess', { ttl: '117' });
  assert.match(tt, /Likely initial TTL: 128/); assert.match(tt, /Estimated hops: 11/);
  assert.match(await r('attack-reference', { q: 'T1110' }), /Brute Force/);
  assert.match(await r('attack-reference', { q: 'lateral' }), /T1021/);
  assert.match(await r('journalctl-builder', { unit: 'ssh.service', since: '1 hour ago', prio: 'err' }), /journalctl -u ssh\.service --since "1 hour ago" -p err --no-pager/);
  assert.throws(() => byId('journalctl-builder').run({ unit: 'a; rm', since: 'today', prio: 'all' }), /Unit/);
});
