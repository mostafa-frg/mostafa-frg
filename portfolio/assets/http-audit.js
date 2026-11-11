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

  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x !== undefined) n.textContent = x; return n; }

  function mount(card) {
    var ta = el('textarea', 'field ca-input'); ta.rows = 8; ta.spellcheck = false;
    ta.setAttribute('aria-label', 'Paste HTTP response headers'); ta.placeholder = 'Paste response headers (e.g. from curl -I). Analysed locally; nothing is fetched or uploaded.';
    var lab = el('label', 'meta'); var cb = el('input', ''); cb.type = 'checkbox'; cb.checked = true; lab.append(cb, ' These headers came from an HTTPS response');
    var run = el('button', 'btn primary', 'AUDIT HEADERS'); run.type = 'button';
    var sample = el('button', 'btn', 'LOAD SAMPLE'); sample.type = 'button';
    var row = el('div', 'ca-actions'); row.append(run, sample);
    var out = el('div', 'ca-out'); out.setAttribute('role', 'status'); out.setAttribute('aria-live', 'polite');
    card.append(ta, lab, row, out);
    sample.addEventListener('click', function () { ta.value = SAMPLE; });
    run.addEventListener('click', function () {
      var r = audit(ta.value, cb.checked), nodes = [];
      if (r.empty) { out.replaceChildren(el('p', 'notice status-error', 'No headers found. Paste lines like "Name: value".')); return; }
      nodes.push(el('p', 'meta', r.count + ' finding' + (r.count === 1 ? '' : 's')));
      if (!r.count) nodes.push(el('p', 'notice status-ok', 'No configured checks triggered. This does not prove the site is secure.'));
      r.findings.forEach(function (f) {
        var it = el('article', 'ca-finding ca-' + f.severity);
        it.append(el('span', 'pill', f.severity.toUpperCase()), el('strong', '', f.id + ' — ' + f.title), el('p', '', 'Fix: ' + f.fix)); nodes.push(it);
      });
      nodes.push(el('p', 'meta', 'Heuristic checks only. Review results against your own policy.'));
      out.replaceChildren.apply(out, nodes);
    });
  }

  root.MostaHttpAudit = { audit: audit, parse: parse, mount: mount, SAMPLE: SAMPLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MostaHttpAudit;
})(typeof window !== 'undefined' ? window : globalThis);
