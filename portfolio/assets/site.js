(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const menu=$('#menuToggle'),nav=$('#siteNav');
if(menu&&nav){
 menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus();}});
}
$$('[data-year]').forEach(el=>el.textContent=String(new Date().getFullYear()));
const main=$('main');
if(main&&!main.id)main.id='main-content';
if(main&&!$('.skip-link')){const a=document.createElement('a');a.className='skip-link';a.href='#main-content';a.textContent='Skip to content';document.body.prepend(a);}
const navRoot=$('.nav');
if(navRoot&&!$('.nav-actions')){
 const actions=document.createElement('div');actions.className='nav-actions';
 const themeButton=document.createElement('button');themeButton.type='button';themeButton.id='themeSwitch';themeButton.className='theme-switch';themeButton.setAttribute('aria-label','Toggle color theme');themeButton.textContent='◐ DARK';
 const paletteButton=document.createElement('button');paletteButton.type='button';paletteButton.id='openPalette';paletteButton.className='palette-trigger';paletteButton.setAttribute('aria-label','Open quick navigation');paletteButton.textContent='⌘ K';
 actions.append(themeButton,paletteButton);navRoot.append(actions);
}
const theme=$('#themeSwitch');
let saved=null;try{saved=localStorage.getItem('mosta-theme')}catch{}
if(saved==='light'||saved==='dark')document.body.dataset.theme=saved;
const syncTheme=()=>{if(theme){const light=document.body.dataset.theme==='light';theme.textContent=light?'☼ LIGHT':'◐ DARK';theme.setAttribute('aria-pressed',String(light));}};
syncTheme();
theme?.addEventListener('click',()=>{document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('mosta-theme',document.body.dataset.theme)}catch{}syncTheme();});
const progress=document.createElement('div');progress.className='top-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
const top=document.createElement('button');top.className='to-top';top.type='button';top.textContent='↑';top.setAttribute('aria-label','Back to top');document.body.append(top);
top.addEventListener('click',()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'}));
const header=$('.top');
let ticking=false;
const onScroll=()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?scrollY/max*100:0)+'%';header?.classList.toggle('scrolled',scrollY>12);top.classList.toggle('show',scrollY>420);ticking=false;});};
addEventListener('scroll',onScroll,{passive:true});onScroll();
const reveal=$$('.card,.panel,.notice,.hero .wrap,.project,.cap');
if(!reduce&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}}),{threshold:.08,rootMargin:'0px 0px -24px 0px'});reveal.forEach(el=>{el.classList.add('reveal-on-scroll');io.observe(el);});}
else reveal.forEach(el=>el.classList.add('visible'));
const page=location.pathname.split('/').pop()||'index.html';
$$('#siteNav a').forEach(a=>{if(a.getAttribute('href')===page){a.classList.add('active');a.setAttribute('aria-current','page');}});
const cards=$$('.project[data-category]'),filters=$$('[data-filter]'),search=$('#projectSearch'),count=$('#projectCount');let active='all';
const applyFilters=()=>{const q=(search?.value||'').toLowerCase().trim();let shown=0;cards.forEach(card=>{const categories=(card.dataset.category||'').split(/\s+/);const ok=(active==='all'||categories.includes(active))&&(!q||((card.dataset.search||'')+' '+card.textContent).toLowerCase().includes(q));card.hidden=!ok;if(ok)shown++;});if(count)count.textContent=shown+' / '+cards.length+' PROJECTS';};
filters.forEach(btn=>btn.addEventListener('click',()=>{active=btn.dataset.filter||'all';filters.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));applyFilters();}));search?.addEventListener('input',applyFilters);if(cards.length)applyFilters();
const backdrop=document.createElement('div');backdrop.className='palette-backdrop';backdrop.innerHTML='<section class="palette-dialog" role="dialog" aria-modal="true" aria-label="Quick navigation"><input class="palette-input" type="search" placeholder="Search pages…" aria-label="Search pages"><nav class="palette-list" aria-label="Pages"></nav><p class="palette-hint">ESC TO CLOSE · CTRL / CMD + K TO OPEN</p></section>';document.body.append(backdrop);
const paletteInput=$('.palette-input'),paletteList=$('.palette-list');
const destinations=[['Home','index.html'],['Projects','projects.html'],['Tools','tools.html'],['Workspace','auth.html'],['About','about.html'],['Security & privacy','security.html'],['Contact','contact.html']];
destinations.forEach(([label,url])=>{const a=document.createElement('a');a.className='palette-link';a.href=url;const name=document.createElement('span'),arrow=document.createElement('span');name.textContent=label;arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');a.append(name,arrow);paletteList.append(a);});
const trigger=$('#openPalette');
const openPalette=()=>{backdrop.classList.add('open');paletteInput.value='';paletteList.querySelectorAll('a').forEach(a=>a.hidden=false);paletteInput.focus();};
const closePalette=()=>{backdrop.classList.remove('open');trigger?.focus();};
trigger?.addEventListener('click',openPalette);
backdrop.addEventListener('click',e=>{if(e.target===backdrop)closePalette();});
paletteInput.addEventListener('input',()=>{const q=paletteInput.value.toLowerCase().trim();paletteList.querySelectorAll('a').forEach(a=>a.hidden=!a.textContent.toLowerCase().includes(q));});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette();}if(e.key==='Escape'&&backdrop.classList.contains('open'))closePalette();if(e.key==='Tab'&&backdrop.classList.contains('open')){const focusables=[paletteInput,...paletteList.querySelectorAll('a:not([hidden])')];if(!focusables.length)return;if(e.shiftKey&&document.activeElement===focusables[0]){e.preventDefault();focusables.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===focusables.at(-1)){e.preventDefault();paletteInput.focus();}}});
})();