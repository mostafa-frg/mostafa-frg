const B=process.env.BASE_URL||'http://localhost:8787', TOKEN=process.env.TEST_BOOTSTRAP_TOKEN||'test-bootstrap-token-0123456789abcdef';
let pass=0,fail=0;const t=(name,ok,note='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+name+(note?'  ['+note+']':''))};
const call=async(path,{method='GET',body,cookie,origin=B,raw,ip,stream}={})=>{const h={};if(origin)h.origin=origin;if(cookie)h.cookie=cookie;if(ip)h['cf-connecting-ip']=ip;if(body!==undefined||raw!==undefined||stream)h['content-type']='application/json';const init={method,headers:h,body:stream|| (raw!==undefined?raw:(body!==undefined?JSON.stringify(body):undefined)),redirect:'manual'};if(stream)init.duplex='half';const r=await fetch(B+path,init);let j=null;try{j=await r.clone().json()}catch{};return{r,j,s:r.status,sc:r.headers.get('set-cookie')}};
const ck=r=>(r.sc||'').split(';')[0];
const PW='correct-horse-battery-1';
// S-03 json handling
t('malformed JSON -> 400',(await call('/api/auth/login',{method:'POST',raw:'{x',ip:'3.3.3.3'})).s===400);
t('JSON null -> 400',(await call('/api/auth/login',{method:'POST',raw:'null',ip:'3.3.3.3'})).s===400);
t('JSON array -> 400',(await call('/api/auth/login',{method:'POST',raw:'[1]',ip:'3.3.3.3'})).s===400);
t('oversize body -> 413',(await call('/api/auth/login',{method:'POST',raw:JSON.stringify({a:'x'.repeat(20000)}),ip:'3.3.3.3'})).s===413);
const oversizedStream=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"x":"'));c.enqueue(new Uint8Array(20000).fill(97));c.enqueue(new TextEncoder().encode('"}'));c.close();}});
t('chunked oversize body without Content-Length -> 413',(await call('/api/auth/login',{method:'POST',stream:oversizedStream,ip:'3.3.3.5'})).s===413);
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
const parallel=await Promise.all(Array.from({length:12},(_,i)=>login('parallel-target','wrong-parallel-'+i,'9.9.9.8')));
t('concurrent attempts cannot bypass the per-account limit',parallel.filter(x=>x.s===401).length===5&&parallel.filter(x=>x.s===429).length===7,parallel.map(x=>x.s).join(','));
const parallelSpray=await Promise.all(Array.from({length:25},(_,i)=>login('parallel-spray-'+i,'wrong-spray-'+i,'6.6.6.7')));
t('concurrent password spray cannot bypass the per-IP limit',parallelSpray.filter(x=>x.s===401).length===20&&parallelSpray.filter(x=>x.s===429).length===5,parallelSpray.map(x=>x.s).join(','));
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
a=await call('/api/admin/users',{method:'POST',cookie:adminCookie,body:{username:'bob',password:'amber-lantern-quartz-2026'}});const bobId=a.j.id;t('admin creates user',a.s===201);
a=await call('/api/auth/login',{method:'POST',ip:'12.0.0.1',body:{username:'bob',password:'amber-lantern-quartz-2026'}});const bob=ck(a);
for(const [p,m] of [['/api/admin/users','GET'],['/api/admin/audit','GET'],['/api/admin/tool-access','GET'],['/api/admin/tools/subnet-calculator','POST']])t(`user blocked: ${m} ${p}`,(await call(p,{method:m,cookie:bob,body:m==='POST'?{enabled:true}:undefined})).s===403);
t('tool default-deny for user',(await call('/api/tools/subnet',{method:'POST',cookie:bob,body:{ip:'10.0.0.1',prefix:24}})).s===403);
await call('/api/admin/tools/subnet-calculator',{method:'POST',cookie:adminCookie,body:{enabled:true}});
a=await call('/api/tools/subnet',{method:'POST',cookie:bob,body:{ip:'192.168.10.10',prefix:24}});t('user allowed after admin enables tool',a.s===200&&a.j.network==='192.168.10.0'&&a.j.usableHosts===254);
t('unauthenticated API blocked',(await call('/api/tools')).s===401);
await call('/api/admin/users/'+bobId+'/disable',{method:'POST',cookie:adminCookie,body:{}});
t('disable revokes live session',(await call('/api/auth/me',{cookie:bob})).s===401);
t('disabled user cannot log in',(await call('/api/auth/login',{method:'POST',ip:'12.0.0.2',body:{username:'bob',password:'amber-lantern-quartz-2026'}})).s===401);
const adm=(await call('/api/admin/users',{cookie:adminCookie})).j.users.find(u=>u.role==='admin');
t('admin account cannot be disabled',(await call('/api/admin/users/'+adm.id+'/disable',{method:'POST',cookie:adminCookie,body:{}})).s===403);
// S-04/S-05 gating + headers
for(const p of ['/dashboard.html','/dashboard','/dashboard/','/DASHBOARD.html']){const x=await call(p);t('anon '+p+' -> redirect to auth',x.s===302&&/\/auth\.html$/.test(x.r.headers.get('location')||''),x.s+' '+(x.r.headers.get('location')||''));}
const red=await call('/dashboard.html');t('redirect carries security headers',!!red.r.headers.get('content-security-policy')&&red.r.headers.get('x-frame-options')==='DENY'&&red.r.headers.get('strict-transport-security'));
const authed=await call('/dashboard',{cookie:adminCookie});t('authed /dashboard served (assets canonicalise .html -> extensionless)',authed.s===200);
const authRed=await call('/auth',{cookie:adminCookie});t('authed /auth -> dashboard',authRed.s===302&&/dashboard/.test(authRed.r.headers.get('location')));
for(const p of ['/api/health','/api/nope','/api/auth/me','/tools.html','/auth.html']){const x=await call(p);const h=x.r.headers;t('headers on '+p+' ('+x.s+')',!!h.get('content-security-policy')&&h.get('x-content-type-options')==='nosniff'&&h.get('x-frame-options')==='DENY'&&!!h.get('strict-transport-security'));}
const health=await call('/api/health');t('health verifies D1 schema readiness',health.s===200&&health.j.database==='ok');
t('API cache-control no-store',(await call('/api/health')).r.headers.get('cache-control')==='no-store');
t('static CSP intact (connect-src crt.sh)',/connect-src 'self'[^;]*crt\.sh/.test((await call('/tools.html')).r.headers.get('content-security-policy')));

// ---- Step 2: password policy, change-password, sessions, reset ----
const mkUser=async(u,pw)=>call('/api/admin/users',{method:'POST',cookie:adminCookie,body:{username:u,password:pw}});
t('policy: 13 chars rejected',(await mkUser('carol','short-pass-13')).s===400);
t('policy: contains username rejected',(await mkUser('carol','carol-is-my-name-1')).s===400);
t('policy: common word rejected',(await mkUser('carol','my-password-is-long')).s===400);
t('policy: repetitive rejected',(await mkUser('carol','a'.repeat(16))).s===400);
a=await mkUser('carol','blue-lantern-orbit-77');t('policy: strong password accepted',a.s===201);const carolId=a.j.id;
const login=async(u,pw,ip)=>call('/api/auth/login',{method:'POST',ip,body:{username:u,password:pw}});
a=await login('carol','blue-lantern-orbit-77','21.0.0.1');const c1=ck(a);a=await login('carol','blue-lantern-orbit-77','21.0.0.2');const c2=ck(a);
t('two concurrent sessions for one user',(await call('/api/auth/me',{cookie:c1})).s===200&&(await call('/api/auth/me',{cookie:c2})).s===200);
a=await call('/api/auth/change-password',{method:'POST',cookie:c1,ip:'21.0.0.1',body:{currentPassword:'WRONG-current-pass',newPassword:'green-harbor-compass-88'}});t('change-password: wrong current -> 403',a.s===403);
t('change-password: weak new rejected',(await call('/api/auth/change-password',{method:'POST',cookie:c1,ip:'21.0.0.1',body:{currentPassword:'blue-lantern-orbit-77',newPassword:'short'}})).s===400);
t('change-password: same password rejected',(await call('/api/auth/change-password',{method:'POST',cookie:c1,ip:'21.0.0.1',body:{currentPassword:'blue-lantern-orbit-77',newPassword:'blue-lantern-orbit-77'}})).s===400);
t('change-password: cross-origin rejected',(await call('/api/auth/change-password',{method:'POST',origin:'https://evil.example',cookie:c1,body:{currentPassword:'x',newPassword:'y'}})).s===403);
t('change-password: unauthenticated rejected',(await call('/api/auth/change-password',{method:'POST',body:{currentPassword:'x',newPassword:'y'}})).s===401);
a=await call('/api/auth/change-password',{method:'POST',cookie:c1,ip:'21.0.0.1',body:{currentPassword:'blue-lantern-orbit-77',newPassword:'green-harbor-compass-88'}});const c1new=ck(a);
t('change-password: success issues new cookie',a.s===200&&c1new.startsWith('__Host-')&&c1new!==c1);
t('change-password: all old sessions revoked',(await call('/api/auth/me',{cookie:c1})).s===401&&(await call('/api/auth/me',{cookie:c2})).s===401&&(await call('/api/auth/me',{cookie:c1new})).s===200);
t('old password no longer works',(await login('carol','blue-lantern-orbit-77','21.0.0.3')).s===401);
t('new password works',(await login('carol','green-harbor-compass-88','21.0.0.4')).s===200);
const wr=[];for(let i=0;i<7;i++)wr.push((await call('/api/auth/change-password',{method:'POST',cookie:c1new,ip:'22.0.0.9',body:{currentPassword:'nope-nope-nope-'+i,newPassword:'another-long-passphrase-9'}})).s);
t('change-password brute force throttled',wr.slice(0,5).every(x=>x===403)&&wr.slice(5).every(x=>x===429),wr.join(','));
// logout-all
a=await login('carol','green-harbor-compass-88','23.0.0.1');const l1=ck(a);const l2=ck(await login('carol','green-harbor-compass-88','23.0.0.2'));
await call('/api/auth/logout-all',{method:'POST',cookie:l1,body:{}});
t('logout-all revokes every session',(await call('/api/auth/me',{cookie:l1})).s===401&&(await call('/api/auth/me',{cookie:l2})).s===401&&(await call('/api/auth/me',{cookie:c1new})).s===401);
// admin sessions
const s1=ck(await login('carol','green-harbor-compass-88','24.0.0.1'));
a=await call('/api/admin/sessions',{cookie:adminCookie});
t('admin lists sessions without token material',a.s===200&&a.j.sessions.length>0&&a.j.sessions.every(x=>!('token_hash' in x)&&!('token' in x))&&a.j.sessions.some(x=>x.current),a.j.sessions.length+' sessions');
const target=a.j.sessions.find(x=>x.username==='carol'&&!x.current);
t('non-admin cannot list sessions',(await call('/api/admin/sessions',{cookie:s1})).s===403);
t('non-admin cannot revoke sessions',(await call('/api/admin/sessions/'+target.id+'/revoke',{method:'POST',cookie:s1,body:{}})).s===403);
t('admin revokes a session',(await call('/api/admin/sessions/'+target.id+'/revoke',{method:'POST',cookie:adminCookie,body:{}})).s===200&&(await call('/api/auth/me',{cookie:s1})).s===401);
t('revoke unknown session -> 404',(await call('/api/admin/sessions/00000000-0000-0000-0000-000000000000/revoke',{method:'POST',cookie:adminCookie,body:{}})).s===404);
t('revoke malformed id -> 404',(await call('/api/admin/sessions/not-a-uuid/revoke',{method:'POST',cookie:adminCookie,body:{}})).s===404);
// admin reset
const s2=ck(await login('carol','green-harbor-compass-88','25.0.0.1'));
t('non-admin cannot reset passwords',(await call('/api/admin/users/'+carolId+'/password',{method:'POST',cookie:s2,body:{password:'whatever-long-password-1'}})).s===403);
t('reset: weak password rejected',(await call('/api/admin/users/'+carolId+'/password',{method:'POST',cookie:adminCookie,body:{password:'short'}})).s===400);
t('reset: admin account refused',(await call('/api/admin/users/'+adm.id+'/password',{method:'POST',cookie:adminCookie,body:{password:'reset-attempt-long-pass-1'}})).s===403);
t('reset: unknown user -> 404',(await call('/api/admin/users/00000000-0000-0000-0000-000000000000/password',{method:'POST',cookie:adminCookie,body:{password:'reset-attempt-long-pass-1'}})).s===404);
t('reset: success',(await call('/api/admin/users/'+carolId+'/password',{method:'POST',cookie:adminCookie,body:{password:'amber-falcon-river-42'}})).s===200);
t('reset: sessions revoked, old password dead, new works',(await call('/api/auth/me',{cookie:s2})).s===401&&(await login('carol','green-harbor-compass-88','25.0.0.2')).s===401&&(await login('carol','amber-falcon-river-42','25.0.0.3')).s===200);
a=await call('/api/admin/audit',{cookie:adminCookie});const acts=new Set(a.j.events.map(e=>e.action));
t('audit trail has the new events',['auth.password_changed','auth.password_change_failed','auth.logout_all','admin.session.revoke','admin.user.password_reset'].every(x=>acts.has(x)),[...acts].join(','));

// session cap
const cookies=[];for(let i=0;i<12;i++){const r=await login('carol','amber-falcon-river-42','31.0.'+i+'.1');cookies.push(ck(r));}
const alive=[];for(const c of cookies)alive.push((await call('/api/auth/me',{cookie:c})).s===200);
t('session cap: only the newest 10 sessions survive',alive.filter(Boolean).length===10&&!alive[0]&&!alive[1]&&alive[11],alive.map(x=>x?1:0).join(''));

console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
