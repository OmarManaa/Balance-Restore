const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});

function isObject(value){return value&&typeof value==="object"&&!Array.isArray(value)}
function deepMerge(defaults,saved){
  if(Array.isArray(defaults))return Array.isArray(saved)?saved:defaults;
  if(!isObject(defaults))return saved===undefined||saved===null?defaults:saved;
  const output={...defaults};
  if(!isObject(saved))return output;
  for(const [key,value] of Object.entries(saved)){
    if(key in defaults)output[key]=deepMerge(defaults[key],value);
    else output[key]=value;
  }
  return output;
}
async function defaults(env){
  const response=await env.ASSETS.fetch(new Request("https://assets.local/default-content.json"));
  return response.json();
}
async function getContent(env){
  const base=await defaults(env);
  const row=await env.DB.prepare("SELECT content FROM site_content WHERE id=1").first();
  if(!row?.content)return base;
  try{return deepMerge(base,JSON.parse(row.content))}catch{return base}
}
function adminAllowed(request,env){
  const email=request.headers.get("Cf-Access-Authenticated-User-Email");
  return Boolean(email&&(!env.ADMIN_EMAIL||email.toLowerCase()===env.ADMIN_EMAIL.toLowerCase()));
}
async function saveContent(env,content){
  const normalized=deepMerge(await defaults(env),content);
  normalized.schemaVersion=3;
  await env.DB.prepare(`INSERT INTO site_content(id,content,updated_at) VALUES(1,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET content=excluded.content,updated_at=datetime('now')`).bind(JSON.stringify(normalized)).run();
  return normalized;
}
export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/content"&&request.method==="GET")return json(await getContent(env));
    if(url.pathname.startsWith("/api/admin/")){
      if(!adminAllowed(request,env))return json({error:"Unauthorized"},401);
      if(url.pathname==="/api/admin/content"&&request.method==="GET")return json(await getContent(env));
      if(url.pathname==="/api/admin/content"&&request.method==="PUT"){
        try{return json(await saveContent(env,await request.json()))}catch(error){return json({error:"Could not save content",details:String(error)},400)}
      }
      if(url.pathname==="/api/admin/reset"&&request.method==="POST")return json(await saveContent(env,await defaults(env)));
    }
    return env.ASSETS.fetch(request);
  }
};
