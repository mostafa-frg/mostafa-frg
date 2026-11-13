const B=process.env.BASE_URL||'http://localhost:8787', TOKEN=process.env.TEST_BOOTSTRAP_TOKEN||'test-bootstrap-token-0123456789abcdef';
let pass=0,fail=0;const t=(name,ok,note='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+name+(note?'  ['+note+']':''))};
const call=async(path,{method='GET',body,cookie,origin=B,raw,ip}={})=>{const h={};if(origin)h.origin=origin;if(cookie)h.cookie=cookie;if(ip)h['cf-connecting-ip']=ip;if(body!==undefined||raw!==undefined)h['content-type']='application/json';const r=await fetch(B+path,{method,headers:h,body:raw!==undefined?raw:(body!==undefined?JSON.stringify(body):undefined),redirect:'manual'});let j=null;try{j=await r.clone().json()}catch{};return{r,j,s:r.status,sc:r.headers.get('set-cookie')}};
const ck=r=>(r.sc||'').split(';')[0];
const PW='correct-horse-battery-1';
// S-03 json handling
t('malformed JSON -> 400',(await call('/api/auth/login',{method:'POST',raw:'{x',ip:'3.3.3.3'})).s===400);
t('JSON null -> 400',(await call('/api/auth/login',{method:'POST',raw:'null',ip:'3.3.3.3'})).s===400);
t('JSON array -> 400',(await call('/api/auth/login',{method:'POST',raw:'[1]',ip:'3.3.3.3'})).s===400);
t('oversize body -> 413',(await call('/api/auth/login',{method:'POST',raw:JSON.stringify({a:'x'.repeat(20000)}),ip:'3.3.3.3'})).s===413);
// S-02 bootstrap throttle
const codes=[];for(let i=0;i<8;i++)codes.push((await call('/api/auth/bootstrap',{method:'POST',ip:'4.4.4.4',body:{bootstrapToken:'wrong'+i,username:'adminone',password:'x'.repeat(14)}})).s);
t('bootstrap brute force throttled',codes.slice(0,5).every(c=>c===403)&&codes.slice(5).every(c=>c===429),codes.join(','));
t('correct token from throttled IP still blocked',(await call('/api/auth/bootstrap',{method:'POST',ip:'4.4.4.4',body:{bootstrapToken:TOKEN,username:'adminone',password:PW}})).s===429);
// race
const mk=u=>call('/api/auth/bootstrap',{method:'POST',ip:'5.5.5.5',body:{bootstrapToken:TOKEN,username:u,password:PW}});
const rr=await Promise.all([mk('adminone'),mk('admintwo'),mk('adminthree')]);
t('concurrent bootstrap creates exactly one admin',rr.filter(x=>x.s===201).length===1,rr.map(x=>x.s).join(','));
const winner=['adminone','admintwo','adminthree'][rr.findIndex(x=>x.s===201)];
let a=await call('/api/auth/login',{method:'POST',ip:'8.8.8.8',body:{username:winner,password:PW}});const adminCookie=ck(a);
t('admin login ok + cookie flags',a.s===200&&/HttpOnly/.test(a.sc)&&/Secure/.test(a.sc)&&/SameSite=Strict/.test(a.sc)&&adminCookie.startsWith('__Host-'));
// S-01 lockout DoS
const att=[];for(let i=0;i<12;i++)att.push((await call('/api/auth/login',{method:'POST',ip:'9.9.9.9',body:{username:winner,password:'guess'+i}})).s);
t('attacker IP locked after 5 failures',att.slice(0,5).every(c=>c===401)&&att.slice(5).every(c=>c===429),att.join(','));
a=await call('/api/auth/login',{method:'POST',ip:'8.8.8.8',body:{username:winner,password:PW}});
t('real admin from another IP NOT locked out',a.s===200,'status '+a.s);
// successful logins don't count
const ok8=[];for(let i=0;i<8;i++)ok8.push((await call('/api/auth/login',{method:'POST',ip:'7.7.7.7',body:{username:winner,password:PW}})).s);
t('8 successful logins from one IP all allowed',ok8.every(c=>c===200),ok8.join(','));
// per-IP spray across usernames
const spray=[];for(let i=0;i<25;i++)spray.push((await call('/api/auth/login',{method:'POST',ip:'6.6.6.6',body:{username:'user'+i,password:'x'}})).s);
t('per-IP password spraying throttled at 20',spray.slice(0,20).every(c=>c===401)&&spray.slice(20).every(c=>c===429),[...new Set(spray)].join(','));
// audit of failures
a=await call('/api/admin/audit',{cookie:adminCookie});t('failed logins are audited',a.j.events.some(e=>e.action==='auth.login_failed'),a.j.events.filter(e=>e.action==='auth.login_failed').length+' events');
// timing equalisation
const time=async(u,ip)=>{const s=performance.now();await call('/api/auth/login',{method:'POST',ip,body:{username:u,password:'wrong-password-xyz'}});return performance.now()-s};
const med=x=>x.sort((p,q)=>p-q)[Math.floor(x.length/2)];
const A=[],Bn=[];for(let i=0;i<7;i++){A.push(await time('no-such-user-'+i,'10.0.0.'+i));Bn.push(await time(winner,'11.0.0.'+i));}
console.log('   timing median ms: nonexistent',med(A).toFixed(1),'existing',med(Bn).toFixed(1));
t('unknown-user timing within 35% of real user',Math.abs(med(A)-med(Bn))/med(Bn)<0.35);
// CSRF
t('cross-origin login rejected',(await call('/api/auth/login',{method:'POST',origin:'https://evil.example',ip:'3.3.3.4',body:{username:winner,password:PW}})).s===403);
t('cross-origin admin POST rejected',(await call('/api/admin/users',{method:'POST',origin:'https://evil.example',cookie:adminCookie,body:{username:'zzz',password:'x'.repeat(14)}})).s===403);
t('missing Origin admin POST rejected',(await call('/api/admin/users',{method:'POST',origin:null,cookie:adminCookie,body:{username:'zzz',password:'x'.repeat(14)}})).s===403);
// authz
a=await call('/api/admin/users',{method:'POST',cookie:adminCookie,body:{username:'bob',password:'bobs-password-123'}});const bobId=a.j.id;t('admin creates user',a.s===201);
a=await call('/api/auth/login',{method:'POST',ip:'12.0.0.1',body:{username:'bob',password:'bobs-password-123'}});const bob=ck(a);
for(const [p,m] of [['/api/admin/users','GET'],['/api/admin/audit','GET'],['/api/admin/tool-access','GET'],['/api/admin/tools/subnet-calculator','POST']])t(`user blocked: ${m} ${p}`,(await call(p,{method:m,cookie:bob,body:m==='POST'?{enabled:true}:undefined})).s===403);
t('tool default-deny for user',(await call('/api/tools/subnet',{method:'POST',cookie:bob,body:{ip:'10.0.0.1',prefix:24}})).s===403);
await call('/api/admin/tools/subnet-calculator',{method:'POST',cookie:adminCookie,body:{enabled:true}});
a=await call('/api/tools/subnet',{method:'POST',cookie:bob,body:{ip:'192.168.10.10',prefix:24}});t('user allowed after admin enables tool',a.s===200&&a.j.network==='192.168.10.0'&&a.j.usableHosts===254);
t('unauthenticated API blocked',(await call('/api/tools')).s===401);
await call('/api/admin/users/'+bobId+'/disable',{method:'POST',cookie:adminCookie,body:{}});
t('disable revokes live session',(await call('/api/auth/me',{cookie:bob})).s===401);
t('disabled user cannot log in',(await call('/api/auth/login',{method:'POST',ip:'12.0.0.2',body:{username:'bob',password:'bobs-password-123'}})).s===401);
const adm=(await call('/api/admin/users',{cookie:adminCookie})).j.users.find(u=>u.role==='admin');
t('admin account cannot be disabled',(await call('/api/admin/users/'+adm.id+'/disable',{method:'POST',cookie:adminCookie,body:{}})).s===403);
// S-04/S-05 gating + headers
for(const p of ['/dashboard.html','/dashboard','/dashboard/','/DASHBOARD.html']){const x=await call(p);t('anon '+p+' -> redirect to auth',x.s===302&&/\/auth\.html$/.test(x.r.headers.get('location')||''),x.s+' '+(x.r.headers.get('location')||''));}
const red=await call('/dashboard.html');t('redirect carries security headers',!!red.r.headers.get('content-security-policy')&&red.r.headers.get('x-frame-options')==='DENY'&&red.r.headers.get('strict-transport-security'));
const authed=await call('/dashboard',{cookie:adminCookie});t('authed /dashboard served (assets canonicalise .html -> extensionless)',authed.s===200);
const authRed=await call('/auth',{cookie:adminCookie});t('authed /auth -> dashboard',authRed.s===302&&/dashboard/.test(authRed.r.headers.get('location')));
for(const p of ['/api/health','/api/nope','/api/auth/me','/tools.html','/auth.html']){const x=await call(p);const h=x.r.headers;t('headers on '+p+' ('+x.s+')',!!h.get('content-security-policy')&&h.get('x-content-type-options')==='nosniff'&&h.get('x-frame-options')==='DENY'&&!!h.get('strict-transport-security'));}
t('API cache-control no-store',(await call('/api/health')).r.headers.get('cache-control')==='no-store');
t('static CSP intact (connect-src crt.sh)',/connect-src 'self'[^;]*crt\.sh/.test((await call('/tools.html')).r.headers.get('content-security-policy')));
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
