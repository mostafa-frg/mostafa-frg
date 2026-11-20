import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../terminal-tools.html', import.meta.url), 'utf8');
const catalog = await readFile(new URL('../../desktop/CLI-CATALOG.md', import.meta.url), 'utf8');
const install = await readFile(new URL('../../desktop/INSTALL.md', import.meta.url), 'utf8');
const styles = await readFile(new URL('../assets/terminal-tools.css', import.meta.url), 'utf8');

test('public CLI page is desktop-only and links to full GitHub documentation', () => {
  assert.match(html, /Windows 10\/11, Linux distributions, and macOS/);
  assert.match(html, /OPEN FULL CLI CATALOG ON GITHUB/);
  assert.match(html, /DOWNLOAD &amp; INSTALL GUIDE|DOWNLOAD & INSTALL GUIDE/);
  assert.match(html, /personal profile data/);
  assert.match(html, /does not execute commands/);
  assert.doesNotMatch(html, /Termux|Android terminal|pkg install|termux-change-repo/i);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /name="viewport"/);
});

test('desktop CLI catalog has broad tool coverage and upstream references', () => {
  for (const name of ['Nmap', 'Wireshark', 'OWASP ZAP', 'Burp Suite', 'Zeek', 'Suricata', 'YARA', 'Volatility', 'Ghidra', 'John the Ripper', 'Hashcat', 'Docker', 'Terraform', 'kubectl']) {
    assert.ok(catalog.includes(name), 'catalog missing ' + name);
  }
  assert.match(catalog, /Windows/);
  assert.match(catalog, /macOS/);
  assert.match(catalog, /Ubuntu\/Debian/);
  assert.match(catalog, /official upstream project/);
  assert.match(catalog, /explicit written authorization/);
  assert.doesNotMatch(catalog, /Termux|Android terminal/i);
});

test('desktop download guide avoids personal data and mobile installation', () => {
  assert.match(install, /Download ZIP/);
  assert.match(install, /Windows/);
  assert.match(install, /Linux/);
  assert.match(install, /macOS/);
  assert.match(install, /does not collect profile details/);
  assert.doesNotMatch(install, /Termux|Android/i);
});

test('desktop catalog page remains accessible and responsive', () => {
  assert.match(html, /Skip to desktop CLI catalog/);
  assert.match(html, /aria-label="Main navigation"/);
  assert.match(styles, /@media\(max-width:720px\)/);
  assert.match(styles, /focus-visible/);
});
