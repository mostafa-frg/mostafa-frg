(()=>{'use strict';
const WORKER_ORIGIN='https://mostafa-frg.frh7977.workers.dev';
if(location.hostname.endsWith('.github.io')){
  const workerPath=location.pathname.replace(/^\/mostafa-frg(?=\/|$)/,'')||'/auth.html';
  location.replace(WORKER_ORIGIN+workerPath+location.search+location.hash);
  return;
}
const $=s=>document.querySelector(s),status=$('#authStatus');
async function api(p,o={}){const r=await fetch('/api'+p,{credentials:'same-origin',...o,headers:{'content-type':'application/json',...(o.headers||{})}}),d=await r.json().catch(()=>({error:'Invalid response'}));if(!r.ok)throw Error(d.error||'Request failed');return d;}
async function init(){
  try{
    let health;
    for(let i=0;i<4;i++){try{health=await fetch('/api/health',{cache:'no-store'});if(health.ok)break;}catch{}await new Promise(r=>setTimeout(r,1500));}
    if(!health||!health.ok)throw Error('The platform API is unavailable.');
    const me=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
    if(me.ok){location.replace('dashboard.html');return;}
    const state=await api('/auth/setup-status');
    if(state.setupRequired){
      $('#authTitle').textContent='Create your admin account';
      $('#authIntro').textContent='Your MOSTA workspace is ready. Set up its first administrator to continue.';
      $('#authFoot').textContent='One-time setup. Public registration is disabled.';
      if(state.bootstrapEnabled){
        $('#bootstrapForm').hidden=false;
        status.textContent='No administrator exists yet. Complete the form below.';
      }else{
        status.textContent='Setup is not unlocked yet. The site owner must configure the one-time setup key in GitHub Actions secrets.';
      }
    }else{
      $('#authTitle').textContent='Welcome back';
      $('#authIntro').textContent='Your administrator account is ready. Sign in to your MOSTA workspace.';
      $('#loginForm').hidden=false;
      status.textContent='Administrator account detected. Sign in to continue.';
    }
  }catch(e){
    $('#authIntro').textContent='We could not verify the workspace status.';
    status.textContent=e.message;
  }
}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const button=$('#loginForm button');button.disabled=true;try{await api('/auth/login',{method:'POST',body:JSON.stringify({username:$('#username').value,password:$('#password').value})});location.href='dashboard.html';}catch(x){status.textContent=x.message;button.disabled=false;}});
$('#bootstrapForm').addEventListener('submit',async e=>{e.preventDefault();const button=$('#bootstrapForm button');button.disabled=true;try{await api('/auth/bootstrap',{method:'POST',body:JSON.stringify({bootstrapToken:$('#bootstrapToken').value,username:$('#adminUsername').value,password:$('#adminPassword').value})});$('#bootstrapForm').hidden=true;$('#loginForm').hidden=false;$('#authTitle').textContent='Admin account created';$('#authIntro').textContent='Your administrator account is ready. Sign in with the username and password you just created.';$('#authFoot').textContent='Initial setup is complete. Only authorized accounts can sign in.';$('#username').value=$('#adminUsername').value;$('#password').value=$('#adminPassword').value;$('#bootstrapToken').value='';status.textContent='Administrator created successfully. Sign in to continue.';$('#loginForm').requestSubmit();}catch(x){status.textContent=x.message;button.disabled=false;}});
init();
})();