(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const grid = $('#terminalToolGrid');
  const roadmapGrid = $('#firmwareRoadmapGrid');
  const search = $('#terminalToolSearch');
  const environment = $('#installEnvironment');
  const filters = $('#terminalCategoryTabs');
  const count = $('#terminalToolCount');
  const status = $('#terminalLibraryStatus');
  const empty = $('#terminalNoResults');
  const categoryLabels = {
    all: 'All tools',
    terminal: 'Terminal essentials',
    automation: 'Bash & automation',
    network: 'Networking',
    security: 'Security & diagnostics',
    system: 'System administration'
  };
  let catalog = null;
  let activeCategory = 'all';

  function node(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  }

  function addExternalLink(parent, label, url) {
    const link = node('a', 'terminal-source-link', label);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    parent.append(link);
  }

  function addCommand(parent, label, command) {
    const panel = node('div', 'terminal-command-panel');
    const heading = node('div', 'terminal-command-heading');
    heading.append(node('span', '', label));
    const copy = node('button', 'terminal-copy', 'COPY');
    copy.type = 'button';
    copy.dataset.copy = command;
    copy.setAttribute('aria-label', 'Copy ' + label + ' command');
    heading.append(copy);
    const pre = node('pre', 'terminal-command');
    pre.append(node('code', '', command));
    panel.append(heading, pre);
    parent.append(panel);
  }

  function renderTool(tool) {
    const card = node('article', 'terminal-tool-card');
    card.dataset.category = tool.category;
    const top = node('div', 'terminal-tool-top');
    top.append(node('span', 'terminal-tool-symbol', tool.symbol));
    top.append(node('span', 'terminal-ready', 'TERMUX + DEBIAN / UBUNTU'));
    card.append(top, node('h3', '', tool.name), node('p', 'terminal-tool-summary', tool.summary));

    const tags = node('div', 'terminal-tags');
    tool.tags.forEach(tag => tags.append(node('span', 'terminal-tag', tag)));
    card.append(tags);

    const details = node('details', 'terminal-tool-details');
    const summary = node('summary', '', 'Installation, verification & troubleshooting');
    details.append(summary);
    const body = node('div', 'terminal-tool-detail-body');
    const pkg = environment.value === 'debian' ? tool.debianPackage : tool.termuxPackage;
    const install = environment.value === 'debian'
      ? 'sudo apt install ' + pkg
      : 'pkg install ' + pkg;
    const remove = environment.value === 'debian'
      ? 'sudo apt remove ' + pkg
      : 'pkg uninstall ' + pkg;
    const verify = environment.value === 'debian' ? tool.verifyDebian : tool.verifyTermux;
    const environmentLabel = environment.value === 'debian' ? 'DEBIAN / UBUNTU (APT)' : 'TERMUX (PKG)';

    body.append(node('p', 'terminal-environment-label', 'INSTALL TARGET: ' + environmentLabel));
    const commands = node('div', 'terminal-command-grid');
    addCommand(commands, 'INSTALL', install);
    addCommand(commands, 'VERIFY', verify);
    addCommand(commands, 'UNINSTALL', remove);
    body.append(commands);
    body.append(node('p', 'terminal-tool-note', 'Important: ' + tool.note));
    body.append(node('p', 'terminal-tool-trouble', 'If something fails: ' + tool.trouble));
    body.append(node('p', 'terminal-license-note', 'License: review the license in the original project before copying, modifying or redistributing it. This catalog links to upstream sources and does not bundle the tool.'));
    const links = node('div', 'terminal-source-links');
    addExternalLink(links, 'UPSTREAM SOURCE', tool.sourceUrl);
    addExternalLink(links, 'OFFICIAL DOCUMENTATION', tool.docsUrl);
    body.append(links);
    details.append(body);
    card.append(details);
    return card;
  }

  function renderRoadmap(item) {
    const card = node('article', 'terminal-roadmap-card');
    const top = node('div', 'terminal-tool-top');
    top.append(node('span', 'terminal-tool-symbol', 'FUTURE'));
    top.append(node('span', 'terminal-planned', 'PLANNED · NOT INSTALLABLE YET'));
    card.append(top, node('h3', '', item.name), node('p', 'terminal-tool-summary', item.purpose));
    const platforms = node('div', 'terminal-tags');
    item.platforms.forEach(platform => platforms.append(node('span', 'terminal-tag', platform)));
    card.append(platforms);
    card.append(node('p', 'terminal-tool-note', 'Safety and implementation boundary: ' + item.safety));
    const links = node('div', 'terminal-source-links');
    addExternalLink(links, 'UPSTREAM SOURCE', item.sourceUrl);
    addExternalLink(links, 'OFFICIAL DOCUMENTATION', item.docsUrl);
    card.append(links);
    return card;
  }

  function render() {
    if (!catalog || !grid) return;
    const query = (search.value || '').trim().toLowerCase();
    const matches = catalog.tools.filter(tool => {
      const categoryMatch = activeCategory === 'all' || tool.category === activeCategory;
      const text = [tool.name, tool.summary, tool.category, ...tool.tags].join(' ').toLowerCase();
      return categoryMatch && (!query || text.includes(query));
    });
    grid.replaceChildren();
    matches.forEach(tool => grid.append(renderTool(tool)));
    count.textContent = matches.length + ' / ' + catalog.tools.length + ' TOOLS';
    empty.hidden = matches.length !== 0;
    filters.querySelectorAll('[data-filter]').forEach(button => {
      const selected = button.dataset.filter === activeCategory;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function renderCategories() {
    filters.replaceChildren();
    const all = [{ id: 'all', label: 'All tools', description: '' }, ...catalog.categories];
    all.forEach(category => {
      const button = node('button', 'terminal-filter', category.label);
      button.type = 'button';
      button.dataset.filter = category.id;
      button.setAttribute('aria-pressed', String(category.id === activeCategory));
      button.addEventListener('click', () => {
        activeCategory = category.id;
        render();
      });
      filters.append(button);
    });
  }

  async function copyText(value, button) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = node('textarea', 'terminal-copy-buffer');
        area.value = value;
        area.setAttribute('readonly', '');
        document.body.append(area);
        area.select();
        const copied = document.execCommand('copy');
        area.remove();
        if (!copied) throw new Error('Copy is unavailable in this browser.');
      }
      button.textContent = 'COPIED';
      status.textContent = 'Command copied. Review it before running it in your terminal.';
    } catch (error) {
      button.textContent = 'COPY FAILED';
      status.textContent = error.message || 'Could not copy this command.';
    }
    window.setTimeout(() => { button.textContent = 'COPY'; }, 1500);
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    copyText(button.dataset.copy || '', button);
  });
  search.addEventListener('input', render);
  environment.addEventListener('change', render);

  fetch('assets/terminal-tools.json', {
    credentials: 'same-origin',
    headers: { accept: 'application/json' }
  }).then(response => {
    if (!response.ok) throw new Error('Catalog data could not be loaded (' + response.status + ').');
    return response.json();
  }).then(data => {
    if (!Array.isArray(data.tools) || !Array.isArray(data.categories) || !Array.isArray(data.roadmap)) {
      throw new Error('Catalog data format is invalid.');
    }
    catalog = data;
    renderCategories();
    catalog.roadmap.forEach(item => roadmapGrid.append(renderRoadmap(item)));
    render();
    status.textContent = 'Package metadata checked against the Termux package repository on ' + data.reviewedOn + '. Device-level installation has not been run by this website.';
  }).catch(error => {
    status.textContent = error.message || 'The terminal catalog could not be loaded.';
    grid.replaceChildren(node('p', 'terminal-load-error', 'Unable to load the tool catalog. Refresh the page or check the repository files.'));
  });
})();
