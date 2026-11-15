import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { TextDecoder } from 'node:util';

const source = await readFile(new URL('../assets/platform.js', import.meta.url), 'utf8');
const directoryMarkup = await readFile(new URL('../tools.html', import.meta.url), 'utf8');
const registryStart = source.indexOf('const tools=') + 'const tools='.length;
const registryMarker = source.indexOf('\n];\nfunction rows', registryStart);
const helpersStart = source.indexOf('function rows(');
const helpersEnd = source.indexOf('const grid=', helpersStart);

assert.ok(registryStart >= 'const tools='.length, 'tool registry exists');
assert.ok(registryMarker > registryStart, 'tool registry closes before UI initialization');
assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, 'pure tool helpers exist');

const registryLiteral = source.slice(registryStart, registryMarker + 2);
const helpers = source.slice(helpersStart, helpersEnd);
const tools = vm.runInNewContext(`(()=>{ ${helpers}\n const registry=${registryLiteral}; registry.forEach(withValidatedInputs); return registry; })()`, {
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
  setTimeout,
  clearTimeout,
  Worker: class {
    postMessage() { this.onmessage?.({ data: { ok: true, matches: [] } }); }
    terminate() {}
  },
  document: { createElement() { let html = ''; return { set innerHTML(value) { html = value; }, get value() { return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); } }; } },
  DOMParser: class { parseFromString() { return { querySelector() { return null; } }; } },
  XMLSerializer: class { serializeToString() { return '<root><item>value</item></root>'; } },
});
const byId = id => {
  const tool = tools.find(item => item.id === id);
  assert.ok(tool, `tool ${id} exists`);
  return tool;
};


test('IPv4 subnet boundaries preserve RFC 3021 /31 and single-address /32 behavior', () => {
  const pointToPoint = byId('subnet').run({ip:'192.0.2.10',prefix:'31'});
  assert.match(pointToPoint,/Network: 192\.0\.2\.10\/31/);
  assert.match(pointToPoint,/Broadcast: 192\.0\.2\.11/);
  assert.match(pointToPoint,/Usable hosts: 2/);
  const single = byId('subnet').run({ip:'203.0.113.9',prefix:'32'});
  assert.match(single,/First host: 203\.0\.113\.9/);
  assert.match(single,/Last host: 203\.0\.113\.9/);
  assert.match(single,/Usable hosts: 1/);
  assert.throws(()=>byId('subnet').run({ip:'192.168.1.256',prefix:'24'}),/valid IPv4/);
});

test('IPv6 compression handles leading, trailing, all-zero and leftmost longest runs', () => {
  assert.match(byId('ipv6').run({address:'::1'}),/Compressed: ::1/);
  assert.match(byId('ipv6').run({address:'2001:db8::'}),/Compressed: 2001:db8::/);
  assert.match(byId('ipv6').run({address:'::'}),/Compressed: ::/);
  assert.match(byId('ipv6').run({address:'2001:0:0:1:0:0:1:1'}),/Compressed: 2001::1:0:0:1:1/);
  assert.throws(()=>byId('ipv6').run({address:'2001::1::2'}),/standard hexadecimal IPv6/);
});

test('Set-Cookie auditor enforces prefix and SameSite=None invariants', () => {
  const output = byId('cookies').run({cookies:[
    '__Host-session=abc; Secure; Path=/; Domain=example.com',
    'session=abc; SameSite=None',
    '__Secure-id=1; HttpOnly',
  ].join('\n')});
  assert.match(output,/__Host- requires Secure, Path=\/ and no Domain attribute/);
  assert.match(output,/SameSite=None requires Secure/);
  assert.match(output,/__Secure- prefix requires Secure/);
});

test('IP range summarizer emits aligned minimal CIDR blocks and rejects reversed ranges', () => {
  const output = byId('range-cidr').run({start:'192.168.1.1',end:'192.168.1.6'});
  assert.match(output,/192\.168\.1\.1\/32/);
  assert.match(output,/192\.168\.1\.2\/31/);
  assert.match(output,/192\.168\.1\.4\/31/);
  assert.match(output,/192\.168\.1\.6\/32/);
  assert.match(output,/CIDR blocks: 4/);
  assert.throws(()=>byId('range-cidr').run({start:'192.168.1.6',end:'192.168.1.1'}),/End address must not be lower/);
});



test('Linux signal reference returns canonical names for numeric and symbolic lookups', () => {
  const numeric = byId('signals').run({query:'15'});
  const symbolic = byId('signals').run({query:'SIGTERM'});
  assert.match(numeric,/Signal: SIGTERM/);
  assert.match(numeric,/Number: 15/);
  assert.match(symbolic,/Signal: SIGTERM/);
  assert.match(symbolic,/Number: 15/);
  assert.match(byId('signals').run({query:'9'}),/Signal: SIGKILL/);
  assert.match(byId('signals').run({query:'2'}),/Signal: SIGINT/);
});

test('tool processing labels distinguish external requests from local-only processing', () => {
  const external = ['dns','public-ip','mac','latency','speed','crt'];
  for (const tool of tools) {
    assert.equal(Boolean(tool.external),external.includes(tool.id),tool.id+' external classification');
  }
  for (const id of ['hmac','csp','jwt']) assert.equal(byId(id).external,undefined,id+' must remain local');
});

test('all registered tools execute a valid representative input', async () => {
  const samples = {
    key:'local-test-key',
    message:'MOSTA integrity test',
    password:'Correct-Horse-Battery-42!',
    text:'MOSTA test input',
    token:'eyJhbGciOiJub25lIn0.eyJzdWIiOiJkZW1vIn0.',
    config:'enable secret test-secret\nno ip http server\ntransport input ssh\nlogin local\nexec-timeout 5 0',
    left:'before\nsame',
    right:'after\nsame',
    query:'SIGTERM',
    file:{name:'sample.txt',size:5,arrayBuffer:async()=>new TextEncoder().encode('hello').buffer},
  };
  const failures=[];
  for (const tool of tools) {
    const values={};
    for (const field of tool.fields||[]) {
      const [key,,defaultValue,type,options]=field;
      if (type==='file') values[key]=samples.file;
      else if (defaultValue!==undefined&&defaultValue!=='') values[key]=defaultValue;
      else if (type==='select') values[key]=options?.[0]??'';
      else if (Object.hasOwn(samples,key)) values[key]=samples[key];
      else if (key==='domain') values[key]='example.com';
      else if (key==='text'||key==='message') values[key]='MOSTA test input';
      else if (key==='password') values[key]='Correct-Horse-Battery-42!';
      else if (key==='token') values[key]=samples.token;
      else values[key]='sample input';
    }
    try {
      const output=await tool.run(values);
      assert.ok(output!==undefined&&output!==null,String(tool.id)+' returned no output');
      assert.ok(String(output).length>0,String(tool.id)+' returned empty output');
    } catch (error) {
      failures.push(tool.id+': '+(error?.message||String(error)));
    }
  }
  assert.deepEqual(failures,[], 'Every tool should execute its representative input without an unexpected error');
});

test('select inputs reject values outside their declared allowlists and apply defaults', () => {
  let checked=0;
  for(const tool of tools){
    for(const field of tool.fields||[]){
      if(field[3]!=='select')continue;
      const [key,label,, ,options]=field;
      const values=Object.fromEntries((tool.fields||[]).map(item=>[item[0],item[2]??'']));
      values[key]='__MOSTA_INVALID_OPTION__';
      assert.throws(()=>tool.run(values),/Invalid option for .*Choose one of the listed values/,tool.id+' rejects invalid '+label);
      checked++;
    }
  }
  assert.ok(checked>=20,'Expected broad coverage of enumerated select fields');
});

test('tool registry has unique IDs and nine declared workspaces', () => {
  const ids = tools.map(tool => tool.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(tools.length, 117);
  assert.deepEqual(
    [...new Set(tools.map(tool => tool.cat))].sort(),
    ['bash','developer','kali','linux','networking','security','soc','termux','ubuntu'].sort(),
  );
  const expected={networking:17,security:15,soc:5,linux:17,ubuntu:12,kali:14,termux:13,bash:13,developer:11};
  for(const [category,count] of Object.entries(expected))
    assert.equal(tools.filter(tool=>tool.cat===category).length,count,category+' tool count');
});



test('new operating-system workspaces contain real handlers and explicit command-only boundaries', async () => {
  const required = [
    'termux-pkg-builder','termux-storage-setup','termux-battery-json','termux-boot-builder',
    'bash-quote-builder','bash-array-builder','bash-script-audit','bash-check-command',
    'kali-nmap-builder','kali-tcpdump-filter','kali-monitor-capability','kali-suid-audit',
    'linux-find-builder','linux-df-analyzer','linux-process-review',
    'ubuntu-apt-plan','ubuntu-netplan-review','ubuntu-apparmor-audit','ubuntu-cloud-init-audit',
  ];
  for (const id of required) {
    const tool=byId(id);
    assert.equal(typeof tool.run,'function',id+' handler');
  }
  for (const tool of tools.filter(x=>x.mode==='command')) {
    assert.match(String(await tool.run(Object.fromEntries((tool.fields||[]).map(f=>[f[0],f[2]??''])))),/./,tool.id+' generated output');
  }
  assert.match(byId('kali-nmap-builder').disclaimer,/authorized/i);
  assert.match(byId('ubuntu-ufw-builder').disclaimer,/remote access/i);
});

test('Termux JSON analyzers reject malformed and out-of-range payloads', () => {
  assert.match(byId('termux-battery-json').run({payload:'{"percentage":72}'}),/72%/);
  assert.throws(()=>byId('termux-battery-json').run({payload:'{"percentage":140}'}),/0 to 100/);
  assert.throws(()=>byId('termux-wifi-json').run({payload:'not json'}),/valid JSON/);
});

test('Bash argument and environment tools preserve quoting and avoid echoing secret values', () => {
  const quoted=byId('bash-quote-builder').run({value:"it's a test"});
  assert.match(quoted, /\\/);
  const array=byId('bash-array-builder').run({values:'one\nvalue with spaces\nthree'});
  assert.match(array,/'value with spaces'/);
  assert.match(array,/\$\{items\[@\]\}/);
  const audit=byId('bash-env-audit').run({content:'API_TOKEN=super-secret-value\nAPP_ENV=prod'});
  assert.match(audit,/API_TOKEN appears sensitive/);
  assert.doesNotMatch(audit,/super-secret-value/);
});

test('Kali command builders validate targets and produce bounded defensive commands', () => {
  const cmd=byId('kali-nmap-builder').run({target:'192.0.2.0/24',profile:'common-ports',timing:'3'});
  assert.match(cmd,/nmap -sT --top-ports 100 -T3/);
  assert.throws(()=>byId('kali-nmap-builder').run({target:'192.0.2.0/33',profile:'common-ports',timing:'3'}),/0 to 32/);
  assert.match(byId('kali-wireshark-filter').run({protocol:'dns',ipaddr:'192.0.2.10',port:'53'}),/dns && ip.addr == 192.0.2.10/);
});

test('Linux and Ubuntu analyzers detect risky conditions in pasted command output', () => {
  assert.match(byId('linux-df-analyzer').run({output:'Filesystem 1024-blocks Used Available Capacity Mounted on\n/dev/sda1 1000 900 100 90% /',threshold:'80'}),/WARNING/);
  assert.match(byId('ubuntu-cloud-init-audit').run({config:'ssh_pwauth: true\ndisable_root: false\nsudo: ALL=(ALL) NOPASSWD:ALL'}),/passwordless sudo/);
  assert.match(byId('ubuntu-source-audit').run({sources:'deb [trusted=yes] http://repo.example.test stable main'}),/trusted=yes/);
});

test('tool directory exposes accessible navigation, search, category filters and a real tool workspace', () => {
  assert.match(directoryMarkup, /<html lang="en">/);
  assert.match(directoryMarkup, /<main id="main-content">/);
  assert.match(directoryMarkup, /id="toolSearch"[^>]*type="search"/);
  assert.match(directoryMarkup, /id="toolGrid"[^>]*aria-live="polite"/);
  assert.match(directoryMarkup, /id="categoryTabs"/);
  for (const category of ['all','networking','security','soc','linux','ubuntu','kali','termux','bash','developer']) {
    assert.match(source, new RegExp(category));
  }
  assert.match(directoryMarkup,/id="categoryTabs"/);
  assert.match(source,/function renderCategories\(\)/);
  assert.match(source,/function setCategory\(/);
  assert.match(directoryMarkup, /role="dialog" aria-modal="true"/);
  assert.match(directoryMarkup, /id="toolRunForm"/);
  assert.match(directoryMarkup, /id="toolResult" aria-live="polite"/);
  assert.match(directoryMarkup, /id="clearToolSearch"/);
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
  assert.equal(tools.length, 117);
  for (const tool of tools) {
    assert.match(tool.id, /^[a-z0-9-]+$/);
    assert.ok(tool.name && tool.name.length >= 5, tool.id + ' has a useful name');
    assert.ok(tool.desc && tool.desc.length >= 35, tool.id + ' has a task description');
    assert.ok(['networking','security','soc','linux','ubuntu','kali','termux','bash','developer'].includes(tool.cat));
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
  const switchedBack = byId('dockerfile-audit').run({dockerfile:[
    'FROM node:20',
    'USER app',
    'RUN npm ci',
    'USER root',
    'CMD ["node","server.js"]',
  ].join('\n')});
  assert.match(switchedBack,/switches to the root user/);
  const numericRoot = byId('dockerfile-audit').run({dockerfile:[
    'FROM node:20',
    'USER 1000:1000',
    'USER 0:0',
  ].join('\n')});
  assert.match(numericRoot,/switches to the root user/);
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
