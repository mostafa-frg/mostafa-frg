(()=>{
const $=s=>document.querySelector(s);
const log=$('#aiLog'),form=$('#aiForm'),input=$('#aiInput'),send=$('#aiSend'),status=$('#aiStatus');
if(!form)return;
let history=[],busy=false;
async function api(path,opts){
  const r=await fetch('/api'+path,{credentials:'same-origin',...opts,headers:{'content-type':'application/json',...(opts&&opts.headers||{})}});
  const d=await r.json().catch(()=>({error:'Invalid response'}));
  if(!r.ok)throw Error(d.error||'Request failed');
  return d;
}
function add(role,text){
  const row=document.createElement('div');row.className='ai-msg ai-'+role;
  const who=document.createElement('strong');who.textContent=role==='user'?'You':'Assistant';
  const body=document.createElement('div');body.className='ai-text';body.textContent=text;
  row.append(who,body);log.append(row);log.scrollTop=log.scrollHeight;
}
async function refresh(){
  try{
    const s=await api('/ai/status');
    if(!s.enabled){status.textContent='AI assistant is not enabled on this deployment.';send.disabled=true;input.disabled=true;return;}
    status.textContent='Daily usage: '+s.used+' / '+s.limit;
  }catch(e){status.textContent=e.message;}
}
form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;
  const text=input.value.trim();if(!text)return;
  busy=true;send.disabled=true;status.textContent='Thinking…';
  add('user',text);history.push({role:'user',content:text});input.value='';
  try{
    const d=await api('/ai/chat',{method:'POST',body:JSON.stringify({messages:history.slice(-10)})});
    history.push({role:'assistant',content:d.answer});add('assistant',d.answer);
    status.textContent='Daily usage: '+d.used+' / '+d.limit;
  }catch(err){
    history.pop();status.textContent=err.message;
  }finally{busy=false;send.disabled=false;input.focus();}
});
$('#aiClear').addEventListener('click',()=>{history=[];log.replaceChildren();refresh();});
refresh();
})();
