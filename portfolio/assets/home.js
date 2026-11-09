    const topbar=document.getElementById('topbar'),progress=document.getElementById('progress'),menuBtn=document.getElementById('menuBtn'),navlinks=document.getElementById('navlinks');
    const onScroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?scrollY/max*100:0)+'%';topbar.classList.toggle('scrolled',scrollY>12)};
    addEventListener('scroll',onScroll,{passive:true});onScroll();
    menuBtn.addEventListener('click',()=>{const open=navlinks.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open))});
    navlinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{navlinks.classList.remove('open');menuBtn.setAttribute('aria-expanded','false')}));
    document.getElementById('year').textContent=new Date().getFullYear();
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
    const demos={
      network:{command:'mnet tcp 192.168.1.1 443',output:'[demo] Checking a supplied host and port...\nTarget: 192.168.1.1:443\nResult: Example output — TCP connection accepted\nNo live network request was performed.'},
      integrity:{command:'mfim check ./sample-directory',output:'[demo] Comparing files against a stored SHA-256 baseline...\nCLEAN   config.yml\nCHANGED app.py\nADDED   notes.txt\nSummary: 1 modified · 1 added · 0 removed\nIllustrative output only — no files were inspected.'},
      logs:{command:'mlog normalize sample_auth.log',output:'[demo] Parsing sample authentication records...\nParsed events: 18\nssh_failed: 14\nssh_accepted: 2\nssh_invalid_user: 2\nNext step: pass JSONL events to the detection rules engine.\nIllustrative output only — no log file was read.'}
    };
    document.querySelectorAll('.lab-tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.lab-tab').forEach(b=>b.setAttribute('aria-selected','false'));btn.setAttribute('aria-selected','true');const demo=demos[btn.dataset.demo];document.getElementById('command').textContent=demo.command;document.getElementById('output').textContent=demo.output}));

    // Project discovery filters
    const projectCards=[...document.querySelectorAll('.project[data-category]')];
    const filterButtons=[...document.querySelectorAll('.filter-btn')];
    const projectSearch=document.getElementById('projectSearch');
    const projectCount=document.getElementById('projectCount');
    let activeFilter='all';
    const filterProjects=()=>{
      const term=(projectSearch?.value||'').trim().toLowerCase();
      let shown=0;
      projectCards.forEach(card=>{
        const categories=(card.dataset.category||'').split(' ');
        const haystack=((card.dataset.search||'')+' '+card.innerText).toLowerCase();
        const visible=(activeFilter==='all'||categories.includes(activeFilter))&&(!term||haystack.includes(term));
        card.hidden=!visible;
        if(visible)shown++;
      });
      if(projectCount)projectCount.textContent=shown+' / '+projectCards.length+' PROJECTS';
    };
    filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
      activeFilter=btn.dataset.filter;
      filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
      filterProjects();
    }));
    projectSearch?.addEventListener('input',filterProjects);

    // Theme preference is stored locally in this browser only
    const themeToggle=document.getElementById('themeToggle');
    const savedTheme=(()=>{try{return localStorage.getItem('mosta-theme')}catch(e){return null}})();
    if(savedTheme==='light'||savedTheme==='dark')document.body.dataset.theme=savedTheme;
    const syncThemeLabel=()=>{if(themeToggle)themeToggle.textContent=document.body.dataset.theme==='light'?'☼ LIGHT':'◐ DARK'};
    syncThemeLabel();
    themeToggle?.addEventListener('click',()=>{
      document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';
      try{localStorage.setItem('mosta-theme',document.body.dataset.theme)}catch(e){}
      syncThemeLabel();
    });

    // Quick navigation palette
    const backdrop=document.getElementById('paletteBackdrop');
    const openPalette=document.getElementById('openPalette');
    const paletteSearch=document.getElementById('paletteSearch');
    const paletteItems=[...document.querySelectorAll('.palette-item')];
    const showPalette=()=>{backdrop.classList.add('open');paletteSearch.value='';paletteItems.forEach(x=>x.hidden=false);setTimeout(()=>paletteSearch.focus(),30)};
    const hidePalette=()=>backdrop.classList.remove('open');
    openPalette?.addEventListener('click',showPalette);
    backdrop?.addEventListener('click',e=>{if(e.target===backdrop)hidePalette()});
    paletteSearch?.addEventListener('input',()=>{
      const q=paletteSearch.value.toLowerCase().trim();
      paletteItems.forEach(item=>item.hidden=!item.innerText.toLowerCase().includes(q));
    });
    paletteItems.forEach(item=>item.addEventListener('click',()=>{
      if(item.dataset.action==='theme')themeToggle?.click();
      else if(item.dataset.target)document.querySelector(item.dataset.target)?.scrollIntoView({behavior:'smooth'});
      hidePalette();
    }));
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();showPalette()}
      if(e.key==='Escape')hidePalette();
    });
    const backTop=document.getElementById('backTop');
    backTop?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
    addEventListener('scroll',()=>backTop?.classList.toggle('show',scrollY>650),{passive:true});

 
    // Map nodes select the matching project category
    document.querySelectorAll('.map-node[data-map-filter]').forEach(node=>node.addEventListener('click',()=>{
      const category=node.dataset.mapFilter;
      activeFilter=category;
      filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
      filterProjects();
    }));

    // Copy the public portfolio URL
    const copyPortfolio=document.getElementById('copyPortfolio');
    const copyStatus=document.getElementById('copyStatus');
    copyPortfolio?.addEventListener('click',async()=>{
      const url=location.href.split('#')[0];
      try{
        await navigator.clipboard.writeText(url);
        if(copyStatus)copyStatus.textContent='Portfolio link copied to clipboard.';
      }catch(error){
        if(copyStatus)copyStatus.textContent='Copy is unavailable in this browser. Use the address bar URL.';
      }
    });

    const sections=[...document.querySelectorAll('main section[id]')],links=[...document.querySelectorAll('.navlinks a')];
    const navObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}}),{rootMargin:'-35% 0px -55% 0px'});
    sections.forEach(s=>navObserver.observe(s));