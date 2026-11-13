/* Account security + (admin) session management. DOM built with textContent only. */
(() => {
  'use strict';
  if (location.hostname.endsWith('.github.io')) return; // dashboard.js redirects to the Worker origin
  const $ = (s) => document.querySelector(s);
  const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x !== undefined) n.textContent = x; return n; };
  async function api(p, o = {}) {
    const r = await fetch('/api' + p, { credentials: 'same-origin', ...o, headers: { 'content-type': 'application/json', ...(o.headers || {}) } });
    const d = await r.json().catch(() => ({ error: 'Invalid response' }));
    if (!r.ok) throw Error(d.error || 'Request failed');
    return d;
  }
  const say = (msg, ok) => { const n = $('#accountStatus'); n.textContent = msg; n.className = 'notice ' + (ok ? 'status-ok' : 'status-error'); };

  $('#changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.disabled = true;
    try {
      await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: $('#currentPassword').value, newPassword: $('#newPasswordSelf').value }) });
      $('#currentPassword').value = ''; $('#newPasswordSelf').value = '';
      say('Password changed. Other sessions were signed out.', true);
    } catch (x) { say(x.message, false); } finally { btn.disabled = false; }
  });
  $('#logoutAllButton').addEventListener('click', async () => {
    try { await api('/auth/logout-all', { method: 'POST', body: '{}' }); } finally { location.href = 'auth.html'; }
  });

  async function sessions() {
    const { sessions: list } = await api('/admin/sessions'), box = $('#sessionList');
    box.replaceChildren();
    if (!list.length) box.append(el('p', 'meta', 'No active sessions.'));
    list.forEach((s) => {
      const row = el('div', 'user-row', s.username + ' · signed in ' + new Date(s.created_at * 1000).toLocaleString() + (s.current ? ' · THIS SESSION' : ''));
      if (!s.current) {
        const b = el('button', 'btn', 'REVOKE'); b.type = 'button';
        b.addEventListener('click', async () => { try { await api('/admin/sessions/' + s.id + '/revoke', { method: 'POST', body: '{}' }); } catch (x) { say(x.message, false); } sessions(); });
        row.append(b);
      }
      box.append(row);
    });
  }
  $('#resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const name = $('#resetUsername').value.trim().toLowerCase();
      const { users } = await api('/admin/users'), u = users.find((x) => x.username === name && x.role === 'user');
      if (!u) throw Error('No such user account.');
      await api('/admin/users/' + u.id + '/password', { method: 'POST', body: JSON.stringify({ password: $('#resetPassword').value }) });
      $('#resetUsername').value = ''; $('#resetPassword').value = '';
      say('Password reset for ' + name + '. Their sessions were signed out.', true); sessions();
    } catch (x) { say(x.message, false); }
  });

  api('/auth/me').then(({ user }) => { if (user.role === 'admin') { $('#sessionPanel').hidden = false; return sessions(); } }).catch(() => {});
})();
