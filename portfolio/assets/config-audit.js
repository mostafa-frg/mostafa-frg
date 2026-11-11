/* MOSTA Config Audit — runs entirely in the browser. Nothing is uploaded.
 * Heuristic, line-based checks for Cisco-style configurations. It reads text only:
 * it never connects to a device, and it is a review aid, not a compliance verdict. */
(function (root) {
  'use strict';

  var SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

  // Split a config into "line vty ..." style blocks: header at column 0, body lines are indented.
  function blocks(lines, headerRe) {
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      if (headerRe.test(lines[i])) {
        var body = [], j = i + 1;
        while (j < lines.length && /^\s+\S/.test(lines[j])) { body.push({ n: j + 1, t: lines[j].trim() }); j++; }
        out.push({ n: i + 1, header: lines[i].trim(), body: body });
      }
    }
    return out;
  }

  function audit(text) {
    var lines = String(text).replace(/\r/g, '').split('\n');
    var findings = [];
    function add(id, severity, title, fix, ln) {
      findings.push({ id: id, severity: severity, title: title, fix: fix, lines: ln || [] });
    }
    function matches(re) {
      var hit = [];
      lines.forEach(function (l, i) { if (re.test(l)) hit.push(i + 1); });
      return hit;
    }

    var vty = blocks(lines, /^line\s+vty\b/i);
    vty.forEach(function (b) {
      var telnet = b.body.filter(function (x) { return /^transport input\b.*\b(telnet|all)\b/i.test(x.t); });
      if (telnet.length) add('TELNET_VTY', 'high', 'VTY lines allow Telnet (' + b.header + ')', 'Use "transport input ssh" so management traffic is encrypted.', telnet.map(function (x) { return x.n; }));
      else if (!b.body.some(function (x) { return /^transport input\s+ssh\s*$/i.test(x.t); }))
        add('NO_SSH_ONLY_VTY', 'medium', 'VTY lines do not restrict transport to SSH (' + b.header + ')', 'Add "transport input ssh".', [b.n]);
      if (!b.body.some(function (x) { return /^access-class\b/i.test(x.t); }))
        add('VTY_NO_ACL', 'medium', 'No access-class limits who can reach (' + b.header + ')', 'Apply a management ACL with "access-class <acl> in".', [b.n]);
      var nologin = b.body.filter(function (x) { return /^no login\b/i.test(x.t); });
      if (nologin.length) add('VTY_NO_LOGIN', 'high', 'VTY lines allow access without login (' + b.header + ')', 'Remove "no login" and require authentication.', nologin.map(function (x) { return x.n; }));
    });

    var http = matches(/^\s*ip http server\s*$/i);
    if (http.length) add('HTTP_SERVER', 'medium', 'Cleartext HTTP management is enabled', 'Use "no ip http server"; prefer "ip http secure-server" if a web UI is needed.', http);

    var enable = matches(/^\s*enable password\s+/i);
    if (enable.length) add('ENABLE_PASSWORD', 'high', '"enable password" is used', 'Use "enable secret" (hashed) instead.', enable);

    var userPw = matches(/^\s*username\s+\S+(\s+privilege\s+\d+)?\s+password\s+/i);
    if (userPw.length) add('USER_PASSWORD', 'high', 'Local user defined with "password" instead of "secret"', 'Use "username <name> secret <password>".', userPw);

    if (!matches(/^\s*service password-encryption\s*$/i).length)
      add('NO_PASSWORD_ENCRYPTION', 'low', '"service password-encryption" not found', 'Enable it to avoid clear-text passwords in the config (type 7 is obfuscation, not strong protection).');

    var pub = matches(/^\s*snmp-server community\s+(public|private)\b/i);
    if (pub.length) add('SNMP_DEFAULT_COMMUNITY', 'high', 'Default SNMP community string (public/private)', 'Replace it with a non-default secret, or use SNMPv3.', pub);
    var rw = matches(/^\s*snmp-server community\s+\S+\s+(rw)\b/i);
    if (rw.length) add('SNMP_RW', 'medium', 'SNMP community with read-write access', 'Remove RW unless required and restrict it with an ACL.', rw);

    if (matches(/^\s*transport input\s+ssh\s*$/i).length && !matches(/^\s*ip ssh version 2\s*$/i).length)
      add('SSH_V2_NOT_SET', 'low', 'SSH is used but "ip ssh version 2" is not set', 'Add "ip ssh version 2".');

    findings.sort(function (a, b) { return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]; });
    return { lineCount: lines.length, findings: findings };
  }

  var SAMPLE = [
    'hostname EDGE-SW1', '!', 'enable password cisco123', 'username admin password admin', '!',
    'ip http server', 'snmp-server community public RO', 'snmp-server community s3cret RW', '!',
    'line vty 0 4', ' transport input telnet', ' login local', '!', 'end'
  ].join('\n');

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt !== undefined) n.textContent = txt; return n; }

  function mount(card) {
    var ta = el('textarea', 'field ca-input');
    ta.rows = 8; ta.spellcheck = false; ta.setAttribute('aria-label', 'Paste a Cisco-style configuration');
    ta.placeholder = 'Paste a configuration here. It is analysed in your browser and never uploaded.';
    var file = el('input', 'field'); file.type = 'file'; file.accept = '.txt,.cfg,.conf,.log'; file.setAttribute('aria-label', 'Or choose a configuration file');
    var run = el('button', 'btn primary', 'AUDIT CONFIG'); run.type = 'button';
    var sample = el('button', 'btn', 'LOAD SAMPLE'); sample.type = 'button';
    var out = el('div', 'ca-out'); out.setAttribute('role', 'status'); out.setAttribute('aria-live', 'polite');
    var row = el('div', 'ca-actions'); row.append(run, sample);
    card.append(ta, file, row, out);

    file.addEventListener('change', function () {
      var f = file.files && file.files[0]; if (!f) return;
      if (f.size > 512 * 1024) { out.replaceChildren(el('p', 'notice status-error', 'File is larger than 512 KB.')); return; }
      var r = new FileReader(); r.onload = function () { ta.value = String(r.result); }; r.readAsText(f);
    });
    sample.addEventListener('click', function () { ta.value = SAMPLE; });
    run.addEventListener('click', function () {
      if (!ta.value.trim()) { out.replaceChildren(el('p', 'notice status-error', 'Paste or load a configuration first.')); return; }
      var res = audit(ta.value), nodes = [];
      nodes.push(el('p', 'meta', res.findings.length + ' finding' + (res.findings.length === 1 ? '' : 's') + ' · ' + res.lineCount + ' lines checked'));
      if (!res.findings.length) nodes.push(el('p', 'notice status-ok', 'No configured checks triggered. This does not prove the device is secure.'));
      res.findings.forEach(function (f) {
        var item = el('article', 'ca-finding ca-' + f.severity);
        item.append(el('span', 'pill', f.severity.toUpperCase()), el('strong', '', f.id + ' — ' + f.title), el('p', '', 'Fix: ' + f.fix));
        if (f.lines.length) item.append(el('small', '', 'Line' + (f.lines.length > 1 ? 's' : '') + ': ' + f.lines.join(', ')));
        nodes.push(item);
      });
      nodes.push(el('p', 'meta', 'Heuristic checks only. Review results against your own policy.'));
      out.replaceChildren.apply(out, nodes);
    });
  }

  root.MostaConfigAudit = { audit: audit, mount: mount, SAMPLE: SAMPLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MostaConfigAudit;
})(typeof window !== 'undefined' ? window : globalThis);
