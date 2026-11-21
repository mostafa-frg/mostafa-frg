(()=>{'use strict';
const WORKER_ORIGIN='https://mostafa-frg.frh7977.workers.dev';
if(location.hostname.endsWith('.github.io')){
  const workerPath=location.pathname.replace(/^\/mostafa-frg(?=\/|$)/,'')||'/dashboard.html';
  location.replace(WORKER_ORIGIN+workerPath+location.search+location.hash);
  return;
}
const $=s=>document.querySelector(s),status=$('#dashboardStatus');
let cachedUsers=[],cachedAudit=[],auditCursor=null,auditHasMore=false,auditLoading=false;
const el=(tag,cls='',value)=>{const node=document.createElement(tag);node.className=cls;if(value!==undefined)node.textContent=value;return node;};
const setStatus=(message,ok=false)=>{if(!status)return;status.textContent=message;status.className='notice '+(ok?'status-ok':'status-error');};
async function api(path,options={}){
  const response=await fetch('/api'+path,{credentials:'same-origin',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
  const data=await response.json().catch(()=>({error:'The server returned an invalid response.'}));
  if(!response.ok)throw Error(data.error||'Request failed ('+response.status+').');
  return data;
}
function metric(label,value,note){const card=el('article','overview-card');card.append(el('span','',label),el('strong','',String(value)),el('small','',note));return card;}
async function overview(){
  const data=await api('/admin/overview'),box=$('#overviewGrid');
  box.replaceChildren(
    metric('User accounts',data.users.total,data.users.active+' active · '+data.users.admins+' admins'),
    metric('Active sessions',data.sessions.active,'Unexpired sessions'),
    metric('Tools available',data.toolCatalog.total,'Registered platform tools'),
    metric('Audit events · 24h',data.activity.events24h,'Recorded security and admin events'),
    metric('Failed logins · 24h',data.activity.failedLogins24h,'Authentication failures')
  );
  let stamp=box.nextElementSibling;
  if(!stamp||!stamp.matches('[data-overview-stamp]')){stamp=el('p','notice');stamp.dataset.overviewStamp='1';box.after(stamp);}
  stamp.textContent='Updated '+new Date(data.generatedAt*1000).toLocaleString()+' · '+data.activity.authAttempts15m+' authentication attempts in the last 15 minutes';
}
function renderTools(tools){
  const grid=$('#toolGrid');grid.replaceChildren();
  tools.forEach(tool=>{
    const card=el('article','tool-card');
    card.append(el('div','meta',tool.group),el('h3','',tool.name),el('p','',tool.description),el('span','pill',(tool.mode==='browser'||tool.mode==='browser-file')?'AVAILABLE':tool.mode==='external'?'EXTERNAL LOOKUP':'REVIEW'));
    if(tool.id==='hash-file'){
      const file=el('input','field'),out=el('pre','result');file.type='file';file.setAttribute('aria-label','Choose a file to hash locally');
      file.addEventListener('change',async()=>{const selected=file.files&&file.files[0];if(!selected)return;out.textContent='Hashing locally…';try{const digest=await crypto.subtle.digest('SHA-256',await selected.arrayBuffer());out.textContent='File: '+selected.name+'\\nSHA-256: '+[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}catch{out.textContent='Web Crypto is unavailable. Use HTTPS.';}});
      card.append(file,out);
    }
    if(tool.id==='config'&&window.MostaConfigAudit)window.MostaConfigAudit.mount(card);
    if(tool.id==='headers'&&window.MostaHttpAudit)window.MostaHttpAudit.mount(card);
    if(tool.id==='subnet'){
      const form=el('form','admin-form'),ip=el('input','field'),prefix=el('input','field'),button=el('button','btn primary','CALCULATE'),out=el('pre','result');
      ip.value='192.168.1.10';ip.required=true;ip.setAttribute('aria-label','IPv4 address');prefix.type='number';prefix.min='0';prefix.max='32';prefix.value='24';prefix.setAttribute('aria-label','CIDR prefix');button.type='submit';form.append(ip,prefix,button);
      form.addEventListener('submit',async event=>{event.preventDefault();button.disabled=true;out.textContent='Calculating…';try{out.textContent=JSON.stringify(await api('/tools/subnet',{method:'POST',body:JSON.stringify({ip:ip.value,prefix:Number(prefix.value)})}),null,2);}catch(error){out.textContent=error.message;}finally{button.disabled=false;}});
      card.append(form,out);
    }
    const open=el('a','btn','OPEN TOOL');open.href='tools.html?tool='+encodeURIComponent(tool.id);card.append(open);grid.append(card);
  });
}
async function loadUsers(){
  const data=await api('/admin/users');cachedUsers=data.users||[];renderUsers();return cachedUsers;
}
function renderUsers(){
  const box=$('#userList'),query=($('#userSearch')?.value||'').trim().toLowerCase();if(!box)return;box.replaceChildren();
  const matches=cachedUsers.filter(user=>(user.username+' '+user.role+' '+(user.active?'active':'disabled')).toLowerCase().includes(query));
  if(!matches.length)box.append(el('p','notice','No matching user accounts.'));
  matches.forEach(user=>{
    const row=el('div','user-row',user.username+' · '+user.role+' · '+(user.active?'ACTIVE':'DISABLED'));
    if(user.role==='user'){
      const button=el('button','btn',user.active?'DISABLE':'ENABLE');button.type='button';
      button.addEventListener('click',async()=>{button.disabled=true;try{await api('/admin/users/'+user.id+'/'+(user.active?'disable':'enable'),{method:'POST',body:'{}'});await loadUsers();setStatus('User account updated.',true);}catch(error){setStatus(error.message);}finally{button.disabled=false;}});
      row.append(button);
    }
    box.append(row);
  });
}
async function access(){
  const select=$('#accessUser'),box=$('#accessList');if(!select||!box)return;
  const previous=select.value;select.replaceChildren();
  cachedUsers.filter(user=>user.role==='user').forEach(user=>{const option=el('option','',user.username);option.value=user.id;select.append(option);});
  if(previous&&[...select.options].some(option=>option.value===previous))select.value=previous;
  select.onchange=loadAccess;await loadAccess();
}
async function loadAccess(){
  const userId=$('#accessUser')?.value,box=$('#accessList');if(!box)return;box.replaceChildren();
  if(!userId){box.append(el('p','notice','Create a user account before assigning tools.'));return;}
  const [{access:grants},{tools}]=await Promise.all([api('/admin/tool-access?userId='+encodeURIComponent(userId)),api('/tools')]);
  const permissions=new Map((grants||[]).map(item=>[item.tool_id,!!item.enabled]));
  tools.forEach(tool=>{
    const row=el('div','access-row',tool.group+' · '+tool.name),enabled=!!permissions.get(tool.id),button=el('button','btn',enabled?'ACCESS ENABLED':'ACCESS DISABLED');
    button.type='button';button.setAttribute('aria-pressed',String(enabled));
    button.addEventListener('click',async()=>{button.disabled=true;try{const next=!permissions.get(tool.id);await api('/admin/users/'+userId+'/tools/'+tool.id,{method:'POST',body:JSON.stringify({enabled:next})});permissions.set(tool.id,next);button.textContent=next?'ACCESS ENABLED':'ACCESS DISABLED';button.setAttribute('aria-pressed',String(next));setStatus('Tool permission updated.',true);}catch(error){setStatus(error.message);}finally{button.disabled=false;}});
    row.append(button);box.append(row);
  });
}
function renderAudit(){
  const box=$('#auditList'),query=($('#auditSearch')?.value||'').trim().toLowerCase();if(!box)return;box.replaceChildren();
  const matches=cachedAudit.filter(event=>(event.action+' '+(event.username||'')+' '+(event.detail||'')).toLowerCase().includes(query));
  if(!matches.length)box.append(el('p','notice',cachedAudit.length?'No activity matches this filter.':'No audit events on this page.'));
  matches.forEach(event=>{const row=el('div','audit-row');row.append(el('strong','',event.action+' · '+(event.username||'system')),el('small','',new Date(event.created_at*1000).toLocaleString()),el('p','',event.detail||''));box.append(row);});
  const more=$('#loadOlderAudit');if(more){more.hidden=!auditHasMore;more.disabled=auditLoading;more.textContent=auditLoading?'LOADING…':'LOAD OLDER EVENTS';}
}
async function loadAudit(reset=true){
  if(auditLoading)return;auditLoading=true;
  const button=$('#loadOlderAudit');if(button){button.disabled=true;button.textContent='LOADING…';}
  try{
    if(reset){cachedAudit=[];auditCursor=null;auditHasMore=false;}
    const params=new URLSearchParams({limit:'50'});if(!reset&&auditCursor)params.set('before',auditCursor);
    const data=await api('/admin/audit?'+params.toString());
    cachedAudit=reset?(data.events||[]):cachedAudit.concat(data.events||[]);
    auditCursor=data.nextCursor||null;
    auditHasMore=!!data.hasMore;renderAudit();
  }catch(error){setStatus('Audit log: '+error.message);}
  finally{auditLoading=false;renderAudit();}
}
async function sessions(){
  const {sessions:list}=await api('/admin/sessions'),box=$('#sessionList');if(!box)return;box.replaceChildren();
  if(!list.length)box.append(el('p','notice','No active sessions.'));
  list.forEach(session=>{
    const row=el('div','user-row'),meta=el('div','',session.username+' · '+new Date(session.created_at*1000).toLocaleString()+' · expires '+new Date(session.expires_at*1000).toLocaleString()),tag=el('span','pill',session.current?'CURRENT SESSION':'ACTIVE');
    row.append(meta,tag);
    if(!session.current){const button=el('button','btn','REVOKE');button.type='button';button.addEventListener('click',async()=>{button.disabled=true;try{await api('/admin/sessions/'+session.id+'/revoke',{method:'POST',body:'{}'});await sessions();await overview();setStatus('Session revoked.',true);}catch(error){setStatus(error.message);button.disabled=false;}});row.append(button);}
    box.append(row);
  });
}
async function load(){
  try{
    const {user}=await api('/auth/me'),admin=user.role==='admin';
    $('#roleTitle').textContent=admin?'Admin Console':'User Workspace';$('#roleBadge').textContent=user.role.toUpperCase();$('#welcomeText').textContent='Signed in as '+user.username+'. Permissions are enforced by the API.';
    const {tools}=await api('/tools');renderTools(tools||[]);
    if(admin){
      ['overviewPanel','userPanel','accessPanel','auditPanel','sessionPanel'].forEach(id=>{const panel=$('#'+id);if(panel)panel.hidden=false;});
      try{await loadUsers();}catch(error){setStatus('User management: '+error.message);}
      const tasks=[['overview',overview],['permissions',access],['audit log',()=>loadAudit(true)],['sessions',sessions]];
      const results=await Promise.allSettled(tasks.map(([,task])=>task()));
      const failures=results.map((result,index)=>result.status==='rejected'?tasks[index][0]+': '+result.reason.message:null).filter(Boolean);
      if(failures.length)setStatus('Workspace loaded with issues: '+failures.join(' · '));
      else setStatus('Workspace ready.',true);
      return;
    }
    setStatus('Workspace ready.',true);
  }catch(error){setStatus(error.message);if(error.message==='Authentication required.')location.replace('auth.html');}
}
$('#refreshOverview')?.addEventListener('click',async()=>{const button=$('#refreshOverview');button.disabled=true;try{await Promise.all([overview(),loadAudit(true),sessions()]);await loadUsers();await access();setStatus('Admin data refreshed.',true);}catch(error){setStatus(error.message);}finally{button.disabled=false;}});
$('#userSearch')?.addEventListener('input',renderUsers);
$('#auditSearch')?.addEventListener('input',renderAudit);
$('#loadOlderAudit')?.addEventListener('click',()=>loadAudit(false));
$('#createUserForm')?.addEventListener('submit',async event=>{event.preventDefault();const button=event.target.querySelector('button[type="submit"]');button.disabled=true;try{await api('/admin/users',{method:'POST',body:JSON.stringify({username:$('#newUsername').value,password:$('#newPassword').value})});$('#newUsername').value='';$('#newPassword').value='';await loadUsers();await access();setStatus('User created.',true);}catch(error){setStatus(error.message);}finally{button.disabled=false;}});
$('#logoutButton')?.addEventListener('click',async()=>{try{await api('/auth/logout',{method:'POST',body:'{}'});}finally{location.href='auth.html';}});
load();
})();