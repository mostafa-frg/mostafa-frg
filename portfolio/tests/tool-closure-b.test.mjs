// Known-answer / syntax-validity closure tests for the Linux, Ubuntu, Kali, Bash, Windows and supply-chain tools.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { TextDecoder } from 'node:util';

const source = await readFile(new URL('../assets/platform.js', import.meta.url), 'utf8');
const a = source.indexOf('let tools=') + 'let tools='.length;
const b = source.indexOf('\n];\nfunction rows', a);
const hs = source.indexOf('function rows('), he = source.indexOf('const grid=', hs);
const ctx = { crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, atob, btoa, URL, Date, Math, JSON, BigInt, Number, String,
  Array, Object, RegExp, Error, Set, Map, Intl, encodeURIComponent, decodeURIComponent, parseInt, parseFloat, isNaN, performance,
  Promise, AbortController, setTimeout, clearTimeout };
const tools = vm.runInNewContext(`(()=>{${source.slice(hs, he)}\nconst r=${source.slice(a, b + 2)};r.forEach(withValidatedInputs);return r;})()`, ctx);
const run = (id, v = {}) => {
  const t = tools.find(x => x.id === id); assert.ok(t, 'unknown tool ' + id);
  const values = {}; for (const f of t.fields) values[f[0]] = f[2];
  return t.run({ ...values, ...v });
};
const bashOk = script => { const r = spawnSync('bash', ['-n'], { input: script }); assert.equal(r.status, 0, 'bash -n failed: ' + r.stderr); };

test('Bash generators emit syntactically valid, behaviourally correct scripts', async () => {
  const g = await run('bash-getopts-builder', { flags: 'f:v:qh' });
  bashOk(g); assert.match(g, /getopts 'f:v:qh' opt/); assert.match(g, /f\) value=\$OPTARG/); assert.match(g, /q\) flag_q=1/);
  const p = await run('bash-arg-parser', { options: 'input\noutput\nverbose' });
  bashOk(p); assert.match(p, /--input\)/); assert.match(p, /--output\)/);
  const s = await run('bash-strict-template', { name: 'maintenance-task' });
  bashOk(s); assert.match(s, /^#!\/usr\/bin\/env bash/); assert.match(s, /set -Eeuo pipefail/);
  const h = await run('bash-heredoc-builder', { delimiter: 'MOSTA_EOF', content: 'line $HOME' });
  assert.match(h, /<<MOSTA_EOF\nline \$HOME\nMOSTA_EOF/); bashOk(h.split('\n\n')[0]);
  const l = await run('bash-log-function', { format: 'iso', levels: 'INFO WARN ERROR' });
  bashOk(l); assert.match(l, /INFO\|WARN\|ERROR/);
  const t = await run('bash-tempdir-builder', { prefix: 'mosta-task' });
  bashOk(t); assert.match(t, /mktemp -d/); assert.match(t, /trap cleanup EXIT INT TERM/); assert.match(t, /umask 077/);
});

test('Linux/Ubuntu/Kali command builders produce the exact documented commands', async () => {
  assert.equal(await run('kali-apt-builder', { action: 'update', package: 'nmap' }), 'sudo apt update');
  assert.match(await run('kali-apt-builder', { action: 'install', package: 'nmap' }), /sudo apt install.*nmap/);
  const tar = await run('linux-tar-backup', { source: '/etc', destination: '/var/backups/etc-backup.tar.gz' });
  assert.match(tar, /tar --acls --xattrs -czf '\/var\/backups\/etc-backup\.tar\.gz' -C '\/etc' \./);
  assert.match(tar, /tar -tzf/); bashOk(tar.split('\n\n')[0]);
  assert.equal(await run('linux-log-filter', { source: 'journalctl', keyword: 'sshd', since: '30 minutes ago' }),
    "journalctl --since '30 minutes ago' --grep='sshd' --no-pager -n 300");
  assert.match(await run('ubuntu-autoremove-plan', { task: 'autoremove' }), /^sudo apt-get -s autoremove/);
  const upd = await run('ubuntu-update-readiness', { scope: 'server' });
  assert.match(upd, /apt list --upgradable/); assert.match(upd, /apt-mark showhold/); assert.match(upd, /reboot-required/);
  bashOk(upd.split('\n\n')[0]);
  assert.match(await run('ubuntu-netplan-try-builder', {}), /netplan generate\nsudo netplan try/);
  assert.match(await run('ubuntu-snap-refresh', { task: 'check' }), /snap refresh --list/);
});

test('Linux parsers compute known answers', async () => {
  const m = await run('linux-mode-converter', { mode: '4755' });
  assert.match(m, /Symbolic: rwsr-xr-x/); assert.match(m, /Special bits: 4/);
  assert.match(await run('linux-mode-converter', { mode: '0644' }), /Symbolic: rw-r--r--/);
  await assert.rejects(async () => run('linux-mode-converter', { mode: '9999' }));
  const mem = await run('linux-memory-analyzer', { total: '8192', used: '4096', available: '3584', swapTotal: '2048', swapUsed: '256' });
  assert.match(mem, /RAM utilization: 50\.0%/); assert.match(mem, /Swap utilization: 12\.5%/); assert.match(mem, /Other\/cache estimate: 512 MiB/);
  const id = await run('linux-id-analyzer', { output: 'uid=1000(mms) gid=1000(mms) groups=1000(mms),27(sudo),4(adm)' });
  assert.match(id, /UID: 1000/); assert.match(id, /Root identity: No/);
  assert.match(await run('linux-id-analyzer', { output: 'uid=0(root) gid=0(root) groups=0(root)' }), /Root identity: Yes/);
  const k = await run('linux-kernel-info', { output: 'Linux host 6.8.0-52-generic #53-Ubuntu SMP x86_64 GNU/Linux' });
  assert.match(k, /Kernel release: 6\.8\.0-52-generic/); assert.match(k, /Architecture: x86_64/);
});

test('Kali/Ubuntu output reviewers flag the risky rows', async () => {
  const cap = await run('kali-capability-audit', { output: '/usr/bin/ping cap_net_raw=ep\n/usr/local/bin/helper cap_setuid,cap_net_bind_service=ep' });
  assert.match(cap, /Entries: 2/); assert.match(cap, /High-risk matches: 1/); assert.match(cap, /\[HIGH\] \/usr\/local\/bin\/helper/);
  const ls = await run('kali-listen-audit', {
    output: 'Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port Process\ntcp LISTEN 0 128 0.0.0.0:22 0.0.0.0:* users:(("sshd",pid=123,fd=3))\ntcp LISTEN 0 128 127.0.0.1:631 0.0.0.0:*' });
  assert.match(ls, /Listening sockets: 2/); assert.match(ls, /Wildcard listeners: 1/); assert.match(ls, /Loopback listeners: 1/);
  const ifc = await run('kali-interface-report', { output: 'lo UNKNOWN 127.0.0.1/8 ::1/128\neth0 UP 192.0.2.10/24\nwlan0 DOWN' });
  assert.match(ifc, /Interfaces: 3/); assert.match(ifc, /UP: 1/); assert.match(ifc, /DOWN: 1|DOWN: 0/);
  const snap = await run('ubuntu-snap-audit', {
    output: 'Name Version Rev Tracking Publisher Notes\ncore22 20250114 1748 latest/stable canonical✓ base\ncode 1.95.0 180 latest/stable vscode✓ classic\ncode 1.94.0 170 latest/stable vscode✓ disabled,classic' });
  assert.match(snap, /Disabled revisions: 1/); assert.match(snap, /Classic confinement: 2/); assert.match(snap, /\[CLEANUP CANDIDATE\] code 1\.94\.0/);
  const svc = await run('ubuntu-service-audit', {
    output: 'UNIT LOAD ACTIVE SUB DESCRIPTION\nssh.service loaded active running OpenBSD Secure Shell server\nnginx.service loaded active running Web server\ncups.service loaded active running CUPS Scheduler\ndocker.service loaded active running Docker Engine' });
  assert.match(svc, /Running service rows: 4/); assert.match(svc, /\[REVIEW\] ssh\.service/);
});

test('Windows posture auditors detect weak and healthy configurations', async () => {
  const bad = await run('windows-bitlocker-status-audit', { data: 'MountPoint : C:\nVolumeStatus : FullyDecrypted\nProtectionStatus : Off\nEncryptionPercentage : 0' });
  assert.match(bad, /Volumes parsed: 1/); assert.match(bad, /HIGH C:.*fully decrypted/); assert.match(bad, /HIGH C:.*protection is Off/);
  const good = await run('windows-bitlocker-status-audit', { data: 'MountPoint : C:\nVolumeStatus : FullyEncrypted\nProtectionStatus : On\nEncryptionPercentage : 100' });
  assert.doesNotMatch(good, /HIGH/);
  const rdp = await run('windows-rdp-posture-audit', { data: 'fDenyTSConnections : 0\nUserAuthentication : 0\nPortNumber : 3389' });
  assert.match(rdp, /RDP enabled: Yes/); assert.match(rdp, /NLA enabled: No/); assert.match(rdp, /HIGH|REVIEW/);
  assert.match(await run('windows-rdp-posture-audit', { data: 'fDenyTSConnections : 1\nUserAuthentication : 1\nPortNumber : 3389' }), /RDP enabled: No/);
  const uacBad = await run('windows-uac-policy-audit', { data: 'EnableLUA : 0\nConsentPromptBehaviorAdmin : 0\nPromptOnSecureDesktop : 0\nFilterAdministratorToken : 0' });
  assert.match(uacBad, /Findings: [1-9]/);
  assert.match(await run('windows-uac-policy-audit', {}), /Findings: 0/);
});

test('Supply-chain auditors flag unpinned, insecure and unhashed dependencies', async () => {
  const py = await run('python-requirements-supply-chain-audit', { data: 'requests>=2.31\nflask==3.0.0 --hash=sha256:0123456789abcdef\n--index-url http://pypi.example.invalid/simple\ngit+https://example.invalid/x.git#egg=x' });
  assert.match(py, /line 1 is not pinned to an exact version/); assert.match(py, /HIGH line 3 uses a plaintext HTTP package index/);
  assert.match(py, /direct URL or VCS reference/);
  assert.doesNotMatch(py, /line 2 is not pinned/); assert.doesNotMatch(py, /line 2 has no SHA-256/);
  const lock = JSON.stringify({ name: 'demo', lockfileVersion: 3, packages: { '': { name: 'demo' },
    'node_modules/a': { version: '1.0.0', resolved: 'http://registry.example.invalid/a.tgz' },
    'node_modules/b': { version: '2.0.0', resolved: 'https://registry.npmjs.org/b/-/b-2.0.0.tgz', integrity: 'sha512-abc' } } });
  const npm = await run('npm-lockfile-integrity-audit', { data: lock });
  assert.match(npm, /Lockfile version: 3/); assert.match(npm, /Missing integrity: 1/); assert.match(npm, /HTTP resolutions: 1/); assert.match(npm, /HIGH insecure HTTP package URL: node_modules\/a/);
  await assert.rejects(async () => run('npm-lockfile-integrity-audit', { data: 'not json' }));
  const co = await run('codeowners-coverage-audit', { data: '* @org/maintainers\n/.github/ @org/platform\n/backend/ @org/backend' });
  assert.match(co, /Rules parsed: 3/); assert.match(co, /Unique owners: 3/);
  assert.match(await run('codeowners-coverage-audit', { data: '/backend/ @org/backend' }), /no repository-wide|REVIEW|Findings: [1-9]/);
});
