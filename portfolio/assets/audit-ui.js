/* Shared UI for MOSTA browser-side audit tools. Plain DOM, textContent only (no innerHTML). */
(function (root) {
  'use strict';
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x !== undefined) n.textContent = x; return n; }

  function report(title, res) {
    var L = [title, new Date().toISOString(), res.count + ' finding(s)', ''];
    res.findings.forEach(function (f) {
      L.push('[' + f.severity.toUpperCase() + '] ' + f.id + ' - ' + f.title, '  Fix: ' + f.fix);
      if (f.lines && f.lines.length) L.push('  Lines: ' + f.lines.join(', '));
    });
    L.push('', 'Heuristic checks only; not a complete security assessment.');
    return L.join('\n');
  }

  /* cfg: {title, inputLabel, placeholder, sample, accept?, option?:{label,checked}, run(text, optionValue)} */
  function mount(card, cfg) {
    var ta = el('textarea', 'field ca-input'); ta.rows = 8; ta.spellcheck = false; ta.placeholder = cfg.placeholder; ta.setAttribute('aria-label', cfg.inputLabel);
    var opt = null, optWrap = null;
    if (cfg.option) { optWrap = el('label', 'meta ca-option'); opt = el('input'); opt.type = 'checkbox'; opt.checked = !!cfg.option.checked; optWrap.append(opt, ' ' + cfg.option.label); }
    var file = null;
    if (cfg.accept) { file = el('input', 'field'); file.type = 'file'; file.accept = cfg.accept; file.setAttribute('aria-label', 'Or choose a file'); }
    var run = el('button', 'btn primary', cfg.runLabel); run.type = 'button';
    var sample = el('button', 'btn', 'LOAD SAMPLE'); sample.type = 'button';
    var clear = el('button', 'btn', 'CLEAR'); clear.type = 'button';
    var copy = el('button', 'btn', 'COPY REPORT'); copy.type = 'button'; copy.hidden = true;
    var actions = el('div', 'ca-actions'); actions.append(run, sample, clear, copy);
    var out = el('div', 'ca-out'); out.setAttribute('role', 'status'); out.setAttribute('aria-live', 'polite');
    card.append(ta); if (file) card.append(file); if (optWrap) card.append(optWrap); card.append(actions, out);
    var last = null;

    function say(msg, cls) { out.replaceChildren(el('p', 'notice ' + cls, msg)); copy.hidden = true; last = null; }
    function go() {
      if (!ta.value.trim()) return say('Paste or load some input first.', 'status-error');
      var res = cfg.run(ta.value, opt ? opt.checked : undefined);
      if (res.empty) return say(cfg.emptyMessage, 'status-error');
      last = report(cfg.title, res);
      var counts = { high: 0, medium: 0, low: 0 };
      res.findings.forEach(function (f) { counts[f.severity]++; });
      var chips = el('div', 'ca-chips');
      ['high', 'medium', 'low'].forEach(function (s) { chips.append(el('span', 'pill ca-chip ca-chip-' + s, counts[s] + ' ' + s.toUpperCase())); });
      var nodes = [chips];
      if (res.meta) nodes.push(el('p', 'meta', res.meta));
      if (!res.count) nodes.push(el('p', 'notice status-ok', 'No configured checks triggered. This does not prove the target is secure.'));
      res.findings.forEach(function (f) {
        var it = el('article', 'ca-finding ca-' + f.severity);
        it.append(el('span', 'pill', f.severity.toUpperCase()), el('strong', '', f.id + ' — ' + f.title), el('p', '', 'Fix: ' + f.fix));
        if (f.lines && f.lines.length) it.append(el('small', '', 'Line' + (f.lines.length > 1 ? 's' : '') + ': ' + f.lines.join(', ')));
        nodes.push(it);
      });
      nodes.push(el('p', 'meta', 'Heuristic checks only. Review results against your own policy.'));
      out.replaceChildren.apply(out, nodes); copy.hidden = false;
    }
    run.addEventListener('click', go);
    ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); go(); } });
    sample.addEventListener('click', function () { ta.value = cfg.sample; ta.focus(); });
    clear.addEventListener('click', function () { ta.value = ''; if (file) file.value = ''; out.replaceChildren(); copy.hidden = true; last = null; ta.focus(); });
    copy.addEventListener('click', function () {
      if (!last) return;
      var done = function () { copy.textContent = 'COPIED'; setTimeout(function () { copy.textContent = 'COPY REPORT'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(last).then(done, function () { copy.textContent = 'COPY FAILED'; });
      else copy.textContent = 'COPY UNAVAILABLE';
    });
    if (file) file.addEventListener('change', function () {
      var f = file.files && file.files[0]; if (!f) return;
      if (f.size > 512 * 1024) return say('File is larger than 512 KB.', 'status-error');
      var r = new FileReader(); r.onload = function () { ta.value = String(r.result); }; r.readAsText(f);
    });
  }
  root.MostaAuditUI = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
