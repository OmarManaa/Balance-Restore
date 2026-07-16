const encoder = new TextEncoder();
const ADMIN_EMAILS = ['haneen.jalal@gmail.com', 'omar.manaa@gmail.com'];
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extra}
});
const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, saved) {
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  if (!isObject(base)) return saved === undefined || saved === null ? base : saved;
  const out = {...base};
  if (!isObject(saved)) return out;
  for (const [k,v] of Object.entries(saved)) out[k] = k in base ? merge(base[k], v) : v;
  return out;
}
async function defaults(env) {
  return (await env.ASSETS.fetch(new Request('https://assets.local/default-content.json'))).json();
}
async function getContent(env) {
  const base = await defaults(env);
  const row = await env.DB.prepare('SELECT content FROM site_content WHERE id=1').first();
  if (!row?.content) return base;
  try { return merge(base, JSON.parse(row.content)); } catch { return base; }
}
async function saveContent(env, content) {
  const normalized = merge(await defaults(env), content);
  normalized.schemaVersion = 5;
  await env.DB.prepare("INSERT INTO site_content(id,content,updated_at) VALUES(1,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET content=excluded.content,updated_at=datetime('now')")
    .bind(JSON.stringify(normalized)).run();
  return normalized;
}
const hex = b => [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const bytes = h => new Uint8Array(h.match(/.{1,2}/g).map(x=>parseInt(x,16)));
function randomHex(n=32){const b=new Uint8Array(n);crypto.getRandomValues(b);return hex(b)}
async function sha256(v){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(v)))}
async function hashPassword(password,salt=randomHex(16),iterations=210000){
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const result=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:bytes(salt),iterations},key,256);
  return {salt,hash:hex(result),iterations};
}
function safeEqual(a,b){if(!a||!b||a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0}
function parseCookies(req){const out={};for(const p of (req.headers.get('Cookie')||'').split(';')){const [k,...v]=p.trim().split('=');if(k)out[k]=decodeURIComponent(v.join('='))}return out}
const sessionCookie=(token,maxAge=28800)=>`br_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const clearCookie=()=>`br_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
const email=v=>String(v||'').trim().toLowerCase();
const isSuper=e=>ADMIN_EMAILS.includes(email(e));
const validPassword=p=>typeof p==='string'&&p.length>=12&&/[A-Z]/.test(p)&&/[a-z]/.test(p)&&/[0-9]/.test(p);
async function currentSession(req,env){
  const token=parseCookies(req).br_session;if(!token)return null;
  const row=await env.DB.prepare(`SELECT s.id session_id,s.csrf_token,u.id,u.email,u.name,u.role,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>datetime('now')`).bind(await sha256(token)).first();
  return row?.active ? row : null;
}
function csrfOk(req,s){const t=req.headers.get('x-csrf-token');return !!t&&safeEqual(t,s.csrf_token)}
async function tooManyAttempts(env,e,ip){const r=await env.DB.prepare("SELECT COUNT(*) total FROM login_attempts WHERE email=? AND ip=? AND success=0 AND created_at>datetime('now','-15 minutes')").bind(e,ip).first();return Number(r?.total||0)>=5}
async function logAttempt(env,e,ip,ok){await env.DB.prepare('INSERT INTO login_attempts(email,ip,success) VALUES(?,?,?)').bind(e,ip,ok?1:0).run()}

async function authRoute(req,env,url){
  if(url.pathname==='/api/auth/setup'&&req.method==='POST'){
    const count=await env.DB.prepare('SELECT COUNT(*) total FROM users').first();
    if(Number(count?.total||0)>0)return json({error:'Setup is already complete.'},409);
    const b=await req.json(), e=email(b.email);
    if(b.token!==env.ADMIN_SETUP_TOKEN)return json({error:'Invalid setup token.'},403);
    if(!isSuper(e))return json({error:'Use an approved administrator email.'},403);
    if(!validPassword(b.password))return json({error:'Use at least 12 characters with upper-case, lower-case and a number.'},400);
    const h=await hashPassword(b.password);
    await env.DB.prepare('INSERT INTO users(id,email,name,role,password_hash,password_salt,password_iterations,active) VALUES(?,?,?,?,?,?,?,1)')
      .bind(crypto.randomUUID(),e,String(b.name||'Administrator').trim(),'admin',h.hash,h.salt,h.iterations).run();
    return json({ok:true});
  }
  if(url.pathname==='/api/auth/login'&&req.method==='POST'){
    const b=await req.json(),e=email(b.email),ip=req.headers.get('CF-Connecting-IP')||'unknown';
    if(await tooManyAttempts(env,e,ip))return json({error:'Too many failed attempts. Try again in 15 minutes.'},429);
    const u=await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(e).first();
    if(!u?.active){await logAttempt(env,e,ip,false);return json({error:'Invalid email or password.'},401)}
    const h=await hashPassword(b.password,u.password_salt,u.password_iterations);
    if(!safeEqual(h.hash,u.password_hash)){await logAttempt(env,e,ip,false);return json({error:'Invalid email or password.'},401)}
    await logAttempt(env,e,ip,true);
    const token=randomHex(),csrf=randomHex(24);
    await env.DB.prepare("INSERT INTO sessions(id,user_id,token_hash,csrf_token,expires_at) VALUES(?,?,?,?,datetime('now','+8 hours'))")
      .bind(crypto.randomUUID(),u.id,await sha256(token),csrf).run();
    return json({ok:true},200,{'set-cookie':sessionCookie(token)});
  }
  if(url.pathname==='/api/auth/me'&&req.method==='GET'){
    const s=await currentSession(req,env);if(!s)return json({error:'Unauthorized'},401);
    return json({id:s.id,email:s.email,name:s.name,role:s.role,csrfToken:s.csrf_token,canManageUsers:isSuper(s.email)});
  }
  if(url.pathname==='/api/auth/logout'&&req.method==='POST'){
    const s=await currentSession(req,env);if(s)await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(s.session_id).run();
    return json({ok:true},200,{'set-cookie':clearCookie()});
  }
  return null;
}
async function usersRoute(req,env,url,s){
  if(!isSuper(s.email))return json({error:'Only approved administrator emails can manage users.'},403);
  if(url.pathname==='/api/users'&&req.method==='GET'){
    const r=await env.DB.prepare('SELECT id,email,name,role,active,created_at,updated_at FROM users ORDER BY created_at').all();return json({users:r.results||[]});
  }
  if(url.pathname==='/api/users'&&req.method==='POST'){
    let b;
    try{
      b=await req.json();
    }catch{
      return json({error:'The user request did not contain valid JSON.'},400);
    }

    const e=email(b.email);
    const name=String(b.name||'').trim();
    const role=b.role==='admin'?'admin':'editor';
    const password=String(b.password||'');

    if(!e||!/^\\S+@\\S+\\.\\S+$/.test(e)){
      return json({error:'Enter a valid email address.'},400);
    }
    if(!name){
      return json({error:'Enter the user name.'},400);
    }
    if(!validPassword(password)){
      return json({
        error:'Password must be at least 12 characters and include uppercase, lowercase and a number.'
      },400);
    }

    try{
      const existing=await env.DB.prepare(
        'SELECT id FROM users WHERE lower(email)=lower(?) LIMIT 1'
      ).bind(e).first();

      if(existing){
        return json({error:'A user with this email address already exists.'},409);
      }

      const h=await hashPassword(password);
      const id=crypto.randomUUID();

      const result=await env.DB.prepare(`
        INSERT INTO users (
          id,
          email,
          name,
          role,
          password_hash,
          password_salt,
          password_iterations,
          active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `).bind(
        id,
        e,
        name,
        role,
        h.hash,
        h.salt,
        h.iterations
      ).run();

      if(!result.success){
        console.error('D1 create-user result:',JSON.stringify(result));
        return json({
          error:'The database did not confirm that the user was created.',
          details:result.error||'Unknown D1 result'
        },500);
      }

      const created=await env.DB.prepare(
        'SELECT id,email,name,role,active,created_at,updated_at FROM users WHERE id=?'
      ).bind(id).first();

      return json({ok:true,user:created},201);
    }catch(error){
      console.error('Create user failed:',error?.stack||error);

      const message=String(error?.message||error||'Unknown database error');

      if(message.toLowerCase().includes('unique')){
        return json({error:'A user with this email address already exists.'},409);
      }

      return json({
        error:'Could not create user.',
        details:message
      },500);
    }
  }
  let m=url.pathname.match(/^\/api\/users\/([^/]+)\/password$/);
  if(m&&req.method==='PUT'){
    const b=await req.json();if(!validPassword(b.password))return json({error:'Password does not meet requirements.'},400);const h=await hashPassword(b.password);
    await env.DB.batch([env.DB.prepare("UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,updated_at=datetime('now') WHERE id=?").bind(h.hash,h.salt,h.iterations,m[1]),env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(m[1])]);return json({ok:true});
  }
  m=url.pathname.match(/^\/api\/users\/([^/]+)\/status$/);
  if(m&&req.method==='PUT'){const b=await req.json();await env.DB.prepare("UPDATE users SET active=?,updated_at=datetime('now') WHERE id=?").bind(b.active?1:0,m[1]).run();return json({ok:true})}
  return null;
}
export default{async fetch(req,env){
  const url=new URL(req.url);
  if(url.pathname==='/api/content'&&req.method==='GET')return json(await getContent(env));
  if(url.pathname.startsWith('/api/auth/')){const r=await authRoute(req,env,url);if(r)return r}
  if(url.pathname.startsWith('/api/admin/')||url.pathname.startsWith('/api/users')){
    const s=await currentSession(req,env);if(!s)return json({error:'Unauthorized'},401);
    if(req.method!=='GET'&&!csrfOk(req,s))return json({error:'Invalid CSRF token.'},403);
    if(url.pathname.startsWith('/api/users')){const r=await usersRoute(req,env,url,s);if(r)return r}
    if(url.pathname==='/api/admin/content'&&req.method==='GET')return json(await getContent(env));
    if(url.pathname==='/api/admin/content'&&req.method==='PUT')return json(await saveContent(env,await req.json()));
    if(url.pathname==='/api/admin/reset'&&req.method==='POST')return json(await saveContent(env,await defaults(env)));
  }
  if(url.pathname==='/admin'||url.pathname==='/admin/'){
    if(!await currentSession(req,env))return Response.redirect(`${url.origin}/admin/login/`,302);
  }
  if(url.pathname==='/admin/users'||url.pathname==='/admin/users/'){
    const s=await currentSession(req,env);if(!s)return Response.redirect(`${url.origin}/admin/login/`,302);if(!isSuper(s.email))return new Response('Forbidden',{status:403});
  }
  return env.ASSETS.fetch(req);
}};
