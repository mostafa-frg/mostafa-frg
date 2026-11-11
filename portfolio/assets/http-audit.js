/* MOSTA HTTP Header Audit — runs entirely in the browser. Nothing is fetched or uploaded.
 * You paste response headers you already captured (for example from "curl -I" or browser dev tools).
 * Heuristic review aid, not a full security assessment. */
(function (root) {
  'use strict';
  var ORDER = { high: 0, medium: 1, low: 2 };

  function parse(text) {
    var headers = {}, cookies = [];
    String(text).replace(/\r/g, '').split('\n').forEach(function (line) {
      var i = line.indexOf(':');
      if (i < 1 || /^HTTP\//i.test(line)) return;
      var k = line.slice(0, i).trim().toLowerCase(), v = line.slice(i + 1).trim();
      if (k === 'set-cookie') cookies.push(v); else headers[k] = headers[k] ? headers[k] + ', ' + v : v;
    });
    return { headers: headers, cookies: cookies };
  }

  function audit(text, https) {
    var p = parse(text), h = p.headers, out = [];
    function add(id, sev, title, fix) { out.push({ id: id, severity: sev, title: title, fix: fix }); }
    if (!Object.keys(h).length && !p.cookies.length) return { count: 0, findings: [], empty: true };

    if (!https) add('NOT_HTTPS', 'high', 'Response was not served over HTTPS', 'Serve the site over HTTPS and redirect HTTP to it.');
    else {
      var hsts = h['strict-transport-security'];
      if (!hsts) add('HSTS_MISSING', 'medium', 'Strict-Transport-Security is missing', 'Add "Strict-Transport-Security: max-age=31536000; includeSubDomains".');
      else { var m = /max-age=(\d+)/i.exec(hsts); if (!m || Number(m[1]) < 15552000) add('HSTS_SHORT', 'low', 'HSTS max-age is under 180 days', 'Use at least max-age=15552000 (one year is common).'); }
    }
    var csp = h['content-security-policy'];
    if (!csp) add('CSP_MISSING', 'medium', 'Content-Security-Policy is missing', 'Define a CSP that limits where scripts and other content can load from.');
    else if (/'unsafe-inline'|'unsafe-eval'|script-src[^;]*\s\*/i.test(csp)) add('CSP_WEAK', 'medium', 'CSP allows unsafe-inline, unsafe-eval or a wildcard script source', 'Tighten script-src; prefer nonces or hashes.');
    if (!/^nosniff$/i.test(h['x-content-type-options'] || '')) add('NOSNIFF_MISSING', 'low', 'X-Content-Type-Options: nosniff is missing', 'Add "X-Content-Type-Options: nosniff".');
    if (!h['referrer-policy']) add('REFERRER_MISSING', 'low', 'Referrer-Policy is missing', 'Add e.g. "Referrer-Policy: strict-origin-when-cross-origin".');
    if (!h['permissions-policy']) add('PERMISSIONS_MISSING', 'low', 'Permissions-Policy is missing', 'Add a Permissions-Policy that disables features you do not use.');
    if (!h['x-frame-options'] && !/frame-ancestors/i.test(csp || '')) add('FRAMING_UNRESTRICTED', 'medium', 'No clickjacking protection (X-Frame-Options or CSP frame-ancestors)', 'Add "frame-ancestors \'none\'" (or \'self\') to the CSP.');
    if (h['server'] && /\d/.test(h['server'])) add('SERVER_VERSION', 'low', 'Server header exposes a version (' + h['server'] + ')', 'Remove or generalise version details.');
    if (h['x-powered-by']) add('POWERED_BY', 'low', 'X-Powered-By reveals technology (' + h['x-powered-by'] + ')', 'Remove the header.');

    p.cookies.forEach(function (c) {
      var name = c.split('=')[0].trim(), miss = [];
      if (https && !/;\s*secure\b/i.test(c)) miss.push('Secure');
      if (!/;\s*httponly\b/i.test(c)) miss.push('HttpOnly');
      if (!/;\s*samesite=/i.test(c)) miss.push('SameSite');
      if (miss.length) add('COOKIE_FLAGS', 'medium', 'Cookie "' + name + '" lacks: ' + miss.join(', '), 'Set the missing attributes (HttpOnly is not needed for cookies scripts must read).');
    });
    out.sort(function (a, b) { return ORDER[a.severity] - ORDER[b.severity]; });
    return { count: out.length, findings: out, empty: false };
  }

  var SAMPLE = ['HTTP/2 200', 'content-type: text/html', 'server: nginx/1.18.0', 'x-powered-by: Express', 'content-security-policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'', 'set-cookie: sid=abc123; Path=/'].join('\n');

  function mount(card) {
    root.MostaAuditUI.mount(card, {
      title: 'MOSTA HTTP Header Audit', runLabel: 'AUDIT HEADERS', inputLabel: 'Paste HTTP response headers',
      placeholder: 'Paste response headers, e.g. from curl -I (Ctrl+Enter to run). Analysed locally; nothing is fetched or uploaded.',
      sample: SAMPLE, option: { label: 'These headers came from an HTTPS response', checked: true },
      emptyMessage: 'No headers found. Paste lines like "Name: value".',
      run: function (text, https) { return audit(text, https); }
    });
  }

  root.MostaHttpAudit = { audit: audit, parse: parse, mount: mount, SAMPLE: SAMPLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MostaHttpAudit;
})(typeof window !== 'undefined' ? window : globalThis);
