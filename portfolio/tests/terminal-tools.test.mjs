import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../assets/terminal-tools.json', import.meta.url), 'utf8'));
const html = await readFile(new URL('../terminal-tools.html', import.meta.url), 'utf8');
const source = await readFile(new URL('../assets/terminal-tools.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../assets/terminal-tools.css', import.meta.url), 'utf8');

test('catalog has unique, complete upstream-linked tool records', () => {
  assert.equal(data.tools.length, 50);
  assert.equal(data.termuxPackagesChecked.length, 50);
  const ids = data.tools.map(tool => tool.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const tool of data.tools) {
    for (const key of ['name', 'category', 'summary', 'tags', 'termuxPackage', 'verifyTermux', 'note', 'trouble', 'sourceUrl', 'docsUrl']) {
      assert.ok(tool[key], tool.id + ' is missing ' + key);
    }
    assert.ok(data.categories.some(category => category.id === tool.category), tool.id + ' has an unknown category');
    assert.match(tool.sourceUrl, /^https:\/\//, tool.id + ' source must use HTTPS');
    assert.match(tool.docsUrl, /^https:\/\//, tool.id + ' docs must use HTTPS');
    assert.match(tool.termuxPackage, /^[a-z0-9+.-]+$/, tool.id + ' has an unsafe Termux package identifier');
    assert.ok(data.termuxPackagesChecked.includes(tool.termuxPackage), tool.id + ' package metadata was not checked');
    if (tool.debianPackage) {
      assert.ok(tool.verifyDebian, tool.id + ' is missing its APT verification command');
      assert.match(tool.debianPackage, /^[a-z0-9+.-]+$/, tool.id + ' has an unsafe APT package identifier');
    } else {
      assert.equal(tool.termuxOnly, true, tool.id + ' must declare why it is Termux-only');
      assert.equal(tool.verifyDebian, null);
    }
  }
});

test('Termux and APT commands are generated from package identifiers, not arbitrary scripts', () => {
  for (const tool of data.tools) {
    assert.doesNotMatch(tool.termuxPackage, /[;&|\x60$<>]/);
    assert.ok(tool.verifyTermux.length < 120);
    if (tool.debianPackage) {
      assert.doesNotMatch(tool.debianPackage, /[;&|\x60$<>]/);
      assert.ok(tool.verifyDebian.length < 120);
    }
  }
  assert.match(source, /'pkg install ' \+ pkg/);
  assert.match(source, /'sudo apt install ' \+ pkg/);
  assert.match(source, /'pkg uninstall ' \+ pkg/);
  assert.match(source, /'sudo apt remove ' \+ pkg/);
  assert.match(source, /Boolean\(tool\.debianPackage\)/);
  assert.doesNotMatch(source, /curl[^\n]*\|\s*(ba)?sh/i);
  assert.doesNotMatch(source, /innerHTML|eval\s*\(/);
});

test('each tool documents operational caveats and troubleshooting', () => {
  for (const tool of data.tools) {
    assert.ok(tool.note.length >= 30, tool.id + ' needs an operational note');
    assert.ok(tool.trouble.length >= 30, tool.id + ' needs troubleshooting guidance');
  }
  assert.match(source, /License: review the license in the original project/);
  assert.match(source, /UPSTREAM SOURCE/);
  assert.match(source, /OFFICIAL DOCUMENTATION/);
});

test('future firmware and flashing entries are clearly separated from installable tools', () => {
  assert.equal(data.roadmap.length, 8);
  const ids = data.roadmap.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of data.roadmap) {
    assert.ok(item.name && item.purpose && item.sourceUrl && item.docsUrl && item.safety);
    assert.ok(Array.isArray(item.platforms) && item.platforms.length > 0);
    assert.equal(Object.hasOwn(item, 'termuxPackage'), false);
    assert.equal(Object.hasOwn(item, 'debianPackage'), false);
  }
  assert.ok(data.roadmap.some(item => item.id === 'esptool'));
  assert.ok(data.roadmap.some(item => item.id === 'esp-idf'));
  assert.ok(data.roadmap.some(item => item.id === 'arduino-cli'));
  assert.ok(data.roadmap.some(item => item.id === 'openocd-esp32'));
  assert.ok(data.tools.filter(item => item.termuxOnly).length === 3);
});

test('page exposes accessible search, environment selection, category filters and safety notes', () => {
  for (const id of ['terminalToolSearch', 'installEnvironment', 'terminalCategoryTabs', 'terminalToolGrid', 'terminalNoResults', 'terminalLibraryStatus', 'firmwareRoadmapGrid']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /href="terminal-tools\.html"/);
  assert.match(html, /never executes them on your device/);
  assert.match(html, /Destructive-operation policy/);
  assert.match(html, /pkg update && pkg upgrade/);
  assert.match(html, /sudo apt update/);
  assert.match(html, /Termux installation guidance/);
  assert.match(styles, /@media\(max-width:720px\)/);
  assert.match(styles, /focus/);
});

test('catalog renderer uses text nodes and same-origin JSON without dynamic HTML injection', () => {
  assert.match(source, /fetch\('assets\/terminal-tools\.json'/);
  assert.match(source, /textContent/);
  assert.match(source, /noopener noreferrer/);
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|document\.write/);
});
